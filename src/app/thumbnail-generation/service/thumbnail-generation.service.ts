import { computed, signal, Service } from '@angular/core';
import { Analytics } from '../../../../src-shared/analytics/analytics';
import { bridge, ThumbnailState } from '../../../../src-shared/bridge/plm-bridge';
import { convertToFlattenedDirTree } from '../../../../src-shared/dir-tree/dir-tree-util';
import { FilenameExtension } from '../../../../src-shared/filename-extension/filename-extension';
import { stringArrayToLogText } from '../../../../src-shared/log/multiline-log-text';
import { perfMark } from '../../../../src-shared/perf/perf-mark';
import { thumbnailGenerationLogger as logger } from '../../../../src-shared/thumbnail/generation/thumbnail-generation-logger';

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
};

@Service()
export class ThumbnailGenerationService {
  private readonly statusState = signal<ThumbnailGenerationStatus>(idleThumbnailGenerationStatus);
  public readonly status = this.statusState.asReadonly();
  public readonly isGenerating = computed(() => this.status().phase === 'generating');

  private allHeifFilePaths: string[];
  private get numOfAllHeifFiles(): number { return this.allHeifFilePaths.length; }

  private heifFilePathsToGenerateThumbnail: string[];
  private get numOfHeifFilesToGenerateThumbnail(): number { return this.heifFilePathsToGenerateThumbnail.length; }
  private get numOfGenerationRequiredThumbnails(): number { return this.numOfHeifFilesToGenerateThumbnail; }

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

  /** @returns Whether a generation started, which it does when a HEIF file has no thumbnail in the cache. */
  public startThumbnailGeneration(check: ThumbnailCacheCheck): boolean {
    this.allHeifFilePaths = check.allHeifFilePaths;
    this.heifFilePathsToGenerateThumbnail = this.allHeifFilePaths
      .filter((_filePath, index) => !check.states[index].cacheAvailable);

    if (this.numOfHeifFilesToGenerateThumbnail >= 1) {
      perfMark('thumbnails:generation-started', { all: this.numOfAllHeifFiles, required: this.numOfHeifFilesToGenerateThumbnail });
      this.startGenerationInMainProcess();
      this.updateGenerationStatusAsStarted();
      this.updateGenerationStatusFromInProgressToDone();
      return true;
    } else {
      logger.info(`Cached thumbnails are available for all HEIF files. Thumbnail generation is skipped.`);
      return false;
    }
  }

  private startGenerationInMainProcess() {
    logger.info(`Thumbnails for HEIF files will be generated in the main process.`);
    logger.info(`Sending the IPC invoke request about thumbnail generation to the main process.`);

    bridge().thumbnails.generate(this.allHeifFilePaths, this.heifFilePathsToGenerateThumbnail)
      .catch(error => logger.error(`Failed to request thumbnail generation.`, error));
  }

  /** Where the thumbnail of each file is; none to ask about for a folder without HEIF files. */
  private thumbnailStates(filePaths: string[]): Promise<ThumbnailState[]> {
    return filePaths.length === 0 ? Promise.resolve([]) : bridge().thumbnails.state(filePaths);
  }

  private updateGenerationStatusAsStarted() {
    const numOfCacheAvailableThumbnails = this.numOfAllHeifFiles - this.numOfGenerationRequiredThumbnails;
    this.statusState.set({
      phase: 'generating',
      numOfAllHeifFiles: this.numOfAllHeifFiles,
      numOfCacheAvailableThumbnails: numOfCacheAvailableThumbnails,
      numOfGenerationRequiredThumbnails: this.numOfGenerationRequiredThumbnails,
      numOfProcessedThumbnails: 0,
      progressPercent: 0,
      result: null,
    });
    this.recordAtThumbnailGenerationStart(numOfCacheAvailableThumbnails);
  }

  private recordAtThumbnailGenerationStart(numOfCacheAvailableThumbnails: number) {
    logger.info(`Total HEIF files: ${this.numOfAllHeifFiles}, Cache-available: ${numOfCacheAvailableThumbnails}, `
      + `Generation-required: ${this.numOfGenerationRequiredThumbnails}`);
    Analytics.trackEvent('Thumbnail Generation', 'Thumbnail Generation Started',
      `Total: ${this.numOfAllHeifFiles}, Cache-available: ${numOfCacheAvailableThumbnails}, Generation-required: ${this.numOfGenerationRequiredThumbnails}`);
    Analytics.trackEvent('Thumbnail Generation', 'Thumbnail Generation: Total', `Total HEIF files: ${this.numOfAllHeifFiles}`);
    Analytics.trackEvent('Thumbnail Generation', 'Thumbnail Generation: Cache-available', `Cache-available: ${numOfCacheAvailableThumbnails}`);
    Analytics.trackEvent('Thumbnail Generation', 'Thumbnail Generation: Gen-required', `Generation-required: ${this.numOfGenerationRequiredThumbnails}`);
  }

  private updateGenerationStatusFromInProgressToDone(): void {
    const updateMilliseconds = 5000;
    let isChecking = false;  // A check that takes longer than the interval is not overlapped by the next.
    const intervalId = setInterval(async () => {
      if (isChecking) return;
      isChecking = true;
      try {
        const filePaths = this.heifFilePathsToGenerateThumbnail;
        const states = await this.thumbnailStates(filePaths);
        const numberOfProcessedThumbnails = states.filter(state => state.attemptFinished).length;
        this.updateGenerationProgress(numberOfProcessedThumbnails);
        if (numberOfProcessedThumbnails === this.numOfGenerationRequiredThumbnails) {
          clearInterval(intervalId);
          this.updateGenerationStatusToDone(filePaths.filter((_filePath, index) => !states[index].cacheAvailable));
          this.recordThumbnailGenerationResult();
        }
      } catch (error) {
        logger.error(`Failed to check the progress of thumbnail generation.`, error);
      } finally {
        isChecking = false;
      }
    }, updateMilliseconds);
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
