import { computed, inject, signal, Service, untracked } from '@angular/core';
import { Analytics } from '../../../../src-shared/analytics/analytics';
import { bridge, ThumbnailState } from '../../../../src-shared/bridge/plm-bridge';
import { convertToFlattenedDirTree } from '../../../../src-shared/dir-tree/dir-tree-util';
import { FilenameExtension } from '../../../../src-shared/filename-extension/filename-extension';
import { stringArrayToLogText } from '../../../../src-shared/log/multiline-log-text';
import { perfMark } from '../../../../src-shared/perf/perf-mark';
import { thumbnailGenerationLogger as logger } from '../../../../src-shared/thumbnail/generation/thumbnail-generation-logger';
import { pageDecodesHevc } from '../../heif-thumbnail/heif-image-decoding';
import { ThumbnailSizeService } from '../../shared/thumbnail-size/thumbnail-size.service';
import { ThumbnailGenerationStatusBarService } from '../status-bar/service/thumbnail-generation-status-bar.service';

export interface ThumbnailGenerationResult {
  errorOccurred: boolean,
  filePathsWithoutThumbnail: string[],
}

/** Where the generation of the opened folder's HEIF thumbnails is, which the status bar shows. */
export interface ThumbnailGenerationStatus {
  /** 'idle' until the first generation starts. */
  readonly phase: 'idle' | 'generating' | 'done';
  readonly numOfAllHeifFiles: number;
  readonly numOfCacheAvailableThumbnails: number;
  readonly numOfGenerationRequiredThumbnails: number;
  readonly numOfProcessedThumbnails: number;
  readonly progressPercent: number;
  /** Set once the phase is 'done'. */
  readonly result: ThumbnailGenerationResult | null;
  /**
   * Whether the generation makes every HEIF file of the folder without a thumbnail in the cache, as the details of the
   * status bar count it, rather than the photos that the page could not make the thumbnails of, one by one.
   */
  readonly isWholeFolder: boolean;
}

/** The HEIF files of a folder, and whether each has its thumbnail in the cache, as the main process checked them. */
export interface ThumbnailCacheCheck {
  readonly allHeifFilePaths: string[];
  readonly states: ThumbnailState[];
}

export const idleThumbnailGenerationStatus: ThumbnailGenerationStatus = {
  phase: 'idle',
  numOfAllHeifFiles: 0,
  numOfCacheAvailableThumbnails: 0,
  numOfGenerationRequiredThumbnails: 0,
  numOfProcessedThumbnails: 0,
  progressPercent: 0,
  result: null,
  isWholeFolder: true,
};

/**
 * The thumbnails of HEIF photos that the main process makes (src-main/thumbnail-generation/), with libheif in its
 * utility processes, and caches.
 * TL;DR: Every such photo of a folder from the start, where the page cannot decode HEVC and the thumbnails are of high
 * quality; elsewhere only those that the page could not make itself, one by one (src/app/heif-thumbnail/).
 * Details: The page decodes a photo's images with WebCodecs where the platform decodes HEVC: 20 to 35 ms for a
 * thumbnail of high quality, 4 ms for the small thumbnail that the photo holds, against 0.6 to 2 seconds for the main
 * process to make one. Where it cannot, the main process makes a high-quality thumbnail of each photo, as it always did,
 * while the page shows the photo's small thumbnail, which libheif decodes for it in a few milliseconds.
 */
@Service()
export class ThumbnailGenerationService {
  private readonly statusBarService = inject(ThumbnailGenerationStatusBarService);
  private readonly thumbnailSizeService = inject(ThumbnailSizeService);
  private readonly statusState = signal<ThumbnailGenerationStatus>(idleThumbnailGenerationStatus);
  public readonly status = this.statusState.asReadonly();
  public readonly isGenerating = computed(() => this.status().phase === 'generating');
  /**
   * The quality of the thumbnails as the settings have it, for what the page shows of it: a signal, as the settings
   * are not one, so that the views follow a new setting (ThumbnailSizeService.follow()).
   */
  public readonly thumbnailQuality = this.thumbnailSizeService.quality;

  private allHeifFilePaths: string[] = [];
  /** The folder's HEIF files whose thumbnail was in the cache when it was opened. */
  private cachedFilePaths = new Set<string>();

  /** The files that the current generation makes, in the order that they were asked for, and the same as a set. */
  private heifFilePathsToGenerateThumbnail: string[] = [];
  private readonly filesToGenerate = new Set<string>();
  private get numOfGenerationRequiredThumbnails(): number { return this.heifFilePathsToGenerateThumbnail.length; }
  private progressTimer: ReturnType<typeof setInterval> | undefined;
  /** The files asked for one by one in this turn, which are asked for together. */
  private readonly filesAskedFor = new Set<string>();

  /**
   * Has the main process check which HEIF files of a folder have their thumbnail in the cache
   * (src-main/thumbnail-generation/thumbnail-state.ts), for startThumbnailGeneration.
   */
  public async checkThumbnailCache(dirTreeObj: DirectoryTree): Promise<ThumbnailCacheCheck> {
    const allHeifFilePaths = convertToFlattenedDirTree(dirTreeObj)
      .filter(element => FilenameExtension.isHeif(element.extension))
      .map(element => element.path);
    return { allHeifFilePaths, states: await this.thumbnailStates(allHeifFilePaths) };
  }

  /**
   * Starts making the thumbnails of the folder's HEIF files that are not in the cache, where the page cannot decode
   * HEVC and the thumbnails are of high quality.
   * @returns Whether a generation started.
   */
  public async startThumbnailGeneration(check: ThumbnailCacheCheck): Promise<boolean> {
    // The thumbnails of the previous folder that wait to be made are not made before this folder's.
    if (this.isGenerating())
      await bridge().thumbnails.cancel().catch(error => logger.error('Failed to drop the thumbnails that wait to be made.', error));
    this.stopProgressPolling();
    this.filesAskedFor.clear();
    this.allHeifFilePaths = check.allHeifFilePaths;
    this.cachedFilePaths = new Set(this.allHeifFilePaths.filter((_filePath, index) => check.states[index].cacheAvailable));
    this.setFilesToGenerate([]);
    this.statusState.set(idleThumbnailGenerationStatus);
    return this.startForTheFolder();
  }

  /** Whether the thumbnail of `filePath` was in the cache when its folder was opened. */
  public isCached(filePath: string): boolean {
    return this.cachedFilePaths.has(filePath);
  }

  /** Whether the main process makes the thumbnail of `filePath`, or has made it, in this folder. */
  public isMade(filePath: string): boolean {
    return this.filesToGenerate.has(filePath);
  }

  private setFilesToGenerate(filePaths: string[]): void {
    this.heifFilePathsToGenerateThumbnail = filePaths;
    this.filesToGenerate.clear();
    filePaths.forEach(filePath => this.filesToGenerate.add(filePath));
  }

  /**
   * Has the main process make the thumbnail of a photo that the page could not make: one whose image the page cannot
   * decode, or read. The status bar shows it with those of the folder, or alone.
   */
  public generate(filePath: string): void {
    if (this.isMade(filePath) || this.filesAskedFor.has(filePath))
      return;
    this.filesAskedFor.add(filePath);
    if (this.filesAskedFor.size === 1)
      queueMicrotask(() => this.generateFilesAskedFor());
  }

  /**
   * Follows new settings of the thumbnails' quality and size (ThumbnailSizeService): the thumbnails that wait to be
   * made are dropped, as they are of the previous settings, and those of the folder are made for 'high', at the new
   * size, where the page cannot decode HEVC.
   */
  public async applyThumbnailSettings(): Promise<boolean> {
    if (this.isGenerating()) {
      logger.info('The thumbnails that wait to be made are dropped, as they are of the previous settings.');
      await bridge().thumbnails.cancel();
      this.stopProgressPolling();
      this.statusState.set(idleThumbnailGenerationStatus);
      this.statusBarService.hide();
    }
    this.setFilesToGenerate([]);
    if (untracked(this.thumbnailSizeService.quality) === 'fast')
      return false;
    const states = await this.thumbnailStates(this.allHeifFilePaths);
    this.cachedFilePaths = new Set(this.allHeifFilePaths.filter((_filePath, index) => states[index].cacheAvailable));
    this.setFilesToGenerate([]);
    const started = await this.startForTheFolder();
    if (started)
      this.statusBarService.showForNewGeneration();
    return started;
  }

  private async startForTheFolder(): Promise<boolean> {
    const quality = untracked(this.thumbnailSizeService.quality);
    if (quality !== 'high' || await pageDecodesHevc()) {
      logger.info(`The page makes the thumbnails of HEIF files (quality: ${quality}). `
        + 'The main process makes those that the page cannot.');
      return false;
    }

    const filePaths = this.allHeifFilePaths.filter(filePath => !this.cachedFilePaths.has(filePath));
    if (filePaths.length === 0) {
      logger.info(`Cached thumbnails are available for all HEIF files. Thumbnail generation is skipped.`);
      return false;
    }
    this.setFilesToGenerate(filePaths);
    perfMark('thumbnails:generation-started', { all: this.allHeifFilePaths.length, required: filePaths.length });
    this.startGenerationInMainProcess(filePaths);
    this.updateGenerationStatusAsStarted(true);
    this.updateGenerationStatusFromInProgressToDone();
    return true;
  }

  private generateFilesAskedFor(): void {
    const filePaths = [...this.filesAskedFor].filter(filePath => !this.isMade(filePath));
    this.filesAskedFor.clear();
    if (filePaths.length === 0)
      return;
    logger.info(`The page could not make the thumbnails of ${filePaths.length} HEIF files, which the main process makes.`);
    const isNewGeneration = !this.isGenerating();
    this.setFilesToGenerate([...(isNewGeneration ? [] : this.heifFilePathsToGenerateThumbnail), ...filePaths]);
    this.startGenerationInMainProcess(filePaths);
    if (isNewGeneration) {
      this.updateGenerationStatusAsStarted(false);
      this.updateGenerationStatusFromInProgressToDone();
      this.statusBarService.showForNewGeneration();
    } else {
      this.statusState.update(status => ({ ...status, isWholeFolder: false,
        numOfGenerationRequiredThumbnails: this.numOfGenerationRequiredThumbnails,
        progressPercent: (status.numOfProcessedThumbnails / this.numOfGenerationRequiredThumbnails) * 100 }));
    }
  }

  private startGenerationInMainProcess(filePaths: string[]) {
    logger.info(`Thumbnails for HEIF files will be generated in the main process.`);
    logger.info(`Sending the IPC invoke request about thumbnail generation to the main process.`);

    bridge().thumbnails.generate(this.allHeifFilePaths, filePaths, untracked(this.thumbnailSizeService.longerSide))
      .catch(error => logger.error(`Failed to request thumbnail generation.`, error));
  }

  /**
   * Where the thumbnail of each file is, at the size that the settings choose; none to ask about for a folder without
   * HEIF files.
   */
  private thumbnailStates(filePaths: string[]): Promise<ThumbnailState[]> {
    return filePaths.length === 0 ? Promise.resolve([])
      : bridge().thumbnails.state(filePaths, untracked(this.thumbnailSizeService.longerSide));
  }

  private updateGenerationStatusAsStarted(isWholeFolder: boolean) {
    const numOfAllHeifFiles = this.allHeifFilePaths.length;
    const numOfCacheAvailableThumbnails = this.cachedFilePaths.size;
    this.statusState.set({
      phase: 'generating',
      numOfAllHeifFiles,
      numOfCacheAvailableThumbnails,
      numOfGenerationRequiredThumbnails: this.numOfGenerationRequiredThumbnails,
      numOfProcessedThumbnails: 0,
      progressPercent: 0,
      result: null,
      isWholeFolder,
    });
    this.recordAtThumbnailGenerationStart(numOfAllHeifFiles, numOfCacheAvailableThumbnails);
  }

  private recordAtThumbnailGenerationStart(numOfAllHeifFiles: number, numOfCacheAvailableThumbnails: number) {
    logger.info(`Total HEIF files: ${numOfAllHeifFiles}, Cache-available: ${numOfCacheAvailableThumbnails}, `
      + `Generation-required: ${this.numOfGenerationRequiredThumbnails}`);
    Analytics.trackEvent('Thumbnail Generation', 'Thumbnail Generation Started',
      `Total: ${numOfAllHeifFiles}, Cache-available: ${numOfCacheAvailableThumbnails}, Generation-required: ${this.numOfGenerationRequiredThumbnails}`);
    Analytics.trackEvent('Thumbnail Generation', 'Thumbnail Generation: Total', `Total HEIF files: ${numOfAllHeifFiles}`);
    Analytics.trackEvent('Thumbnail Generation', 'Thumbnail Generation: Cache-available', `Cache-available: ${numOfCacheAvailableThumbnails}`);
    Analytics.trackEvent('Thumbnail Generation', 'Thumbnail Generation: Gen-required', `Generation-required: ${this.numOfGenerationRequiredThumbnails}`);
  }

  private stopProgressPolling(): void {
    clearInterval(this.progressTimer);
    this.progressTimer = undefined;
  }

  private updateGenerationStatusFromInProgressToDone(): void {
    const updateMilliseconds = 5000;
    let isChecking = false;  // A check that takes longer than the interval is not overlapped by the next.
    this.stopProgressPolling();
    const timer = setInterval(async () => {
      if (isChecking) return;
      isChecking = true;
      try {
        // The files of the generation as they are now: a photo that the page could not make is added while it runs.
        const filePaths = [...this.heifFilePathsToGenerateThumbnail];
        const states = await this.thumbnailStates(filePaths);
        if (timer !== this.progressTimer)
          return;  // Another folder, or another setting, ended this generation meanwhile.
        const numberOfProcessedThumbnails = states.filter(state => state.attemptFinished).length;
        this.updateGenerationProgress(numberOfProcessedThumbnails);
        if (numberOfProcessedThumbnails === this.numOfGenerationRequiredThumbnails) {
          this.stopProgressPolling();
          this.updateGenerationStatusToDone(filePaths.filter((_filePath, index) => !states[index].cacheAvailable));
          this.recordThumbnailGenerationResult();
        }
      } catch (error) {
        logger.error(`Failed to check the progress of thumbnail generation.`, error);
      } finally {
        isChecking = false;
      }
    }, updateMilliseconds);
    this.progressTimer = timer;
  }

  private updateGenerationProgress(numberOfProcessedThumbnails: number) {
    const progressPercent = (numberOfProcessedThumbnails / this.numOfGenerationRequiredThumbnails) * 100;
    logger.info(`Thumbnail generation progress: ${progressPercent.toFixed(5)} %, Processed/Generation-required: `
      + `${numberOfProcessedThumbnails}/${this.numOfGenerationRequiredThumbnails}`);
    this.statusState.update(status => ({...status, numOfProcessedThumbnails: numberOfProcessedThumbnails, progressPercent}));
  }

  private updateGenerationStatusToDone(heifFilePathsWithoutThumbnail: string[]) {
    const errorOccurred = heifFilePathsWithoutThumbnail.length >= 1;
    const result: ThumbnailGenerationResult = {
      errorOccurred: errorOccurred,
      filePathsWithoutThumbnail: heifFilePathsWithoutThumbnail,
    };
    this.statusState.update(status => ({...status, phase: 'done', result}));
    perfMark('thumbnails:status-done', { required: this.numOfGenerationRequiredThumbnails, failed: heifFilePathsWithoutThumbnail.length });
  }

  private recordThumbnailGenerationResult() {
    logger.info(`Finished thumbnail generation.`);
    const { errorOccurred, filePathsWithoutThumbnail } = this.status().result;
    if (errorOccurred) {
      // Recorded as "Thumbnail Generation Finished" with the count, below, and with the reasons in the main process.
    logger.warnNotRecorded(`Error(s) occurred during thumbnail generation.`);
      const filePathsText = stringArrayToLogText(filePathsWithoutThumbnail);
      logger.warnNotRecorded(`Thumbnails could not be generated for the following ${filePathsWithoutThumbnail.length} files: ${filePathsText}`);
    }
    Analytics.trackEvent('Thumbnail Generation', 'Thumbnail Generation Finished', `Number of thumbnails failed to generate: ${filePathsWithoutThumbnail.length}`);
  }
}
