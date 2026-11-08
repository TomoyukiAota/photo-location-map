import { computed, signal, Service } from '@angular/core';
import { ipcRenderer } from 'electron';
import { Analytics } from '../../../../src-shared/analytics/analytics';
import { convertToFlattenedDirTree } from '../../../../src-shared/dir-tree/dir-tree-util';
import { FilenameExtension } from '../../../../src-shared/filename-extension/filename-extension';
import { IpcConstants } from '../../../../src-shared/ipc/ipc-constants';
import { stringArrayToLogText } from '../../../../src-shared/log/multiline-log-text';
import {
  isAttemptToGenerateThumbnailFinished,
  isThumbnailCacheAvailable
} from '../../../../src-shared/thumbnail/cache/thumbnail-cache-util';
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

  /** @returns Whether a generation started, which it does when a HEIF file has no thumbnail in the cache. */
  public startThumbnailGeneration(dirTreeObj: DirectoryTree): boolean {
    const flattenedDirTree = convertToFlattenedDirTree(dirTreeObj);

    this.allHeifFilePaths = flattenedDirTree
      .filter(element => FilenameExtension.isHeif(element.extension))
      .map(element => element.path);

    this.heifFilePathsToGenerateThumbnail = this.allHeifFilePaths
      .filter(filePath => !isThumbnailCacheAvailable(filePath));

    if (this.numOfHeifFilesToGenerateThumbnail >= 1) {
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

    // noinspection JSIgnoredPromiseFromCall
    ipcRenderer.invoke(IpcConstants.ThumbnailGenerationInMainProcess.Name, this.allHeifFilePaths, this.heifFilePathsToGenerateThumbnail);
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
    const intervalId = setInterval(() => {
      const numberOfProcessedThumbnails = this.heifFilePathsToGenerateThumbnail.filter(filePath => isAttemptToGenerateThumbnailFinished(filePath)).length;
      this.updateGenerationProgress(numberOfProcessedThumbnails);
      if (numberOfProcessedThumbnails === this.numOfGenerationRequiredThumbnails) {
        this.updateGenerationStatusToDone();
        this.recordThumbnailGenerationResult();
        clearInterval(intervalId);
      }
    }, updateMilliseconds);
  }

  private updateGenerationProgress(numberOfProcessedThumbnails: number) {
    const progressPercent = (numberOfProcessedThumbnails / this.numOfGenerationRequiredThumbnails) * 100;
    logger.info(`Thumbnail generation progress: ${progressPercent.toFixed(5)} %, Processed/Generation-required: `
      + `${numberOfProcessedThumbnails}/${this.numOfGenerationRequiredThumbnails}`);
    this.statusState.update(status => ({...status, numOfProcessedThumbnails: numberOfProcessedThumbnails, progressPercent}));
  }

  private updateGenerationStatusToDone() {
    const heifFilePathsWithoutThumbnail = this.heifFilePathsToGenerateThumbnail.filter(filePath => !isThumbnailCacheAvailable(filePath));
    const errorOccurred = heifFilePathsWithoutThumbnail.length >= 1;
    const result: ThumbnailGenerationResult = {
      errorOccurred: errorOccurred,
      filePathsWithoutThumbnail: heifFilePathsWithoutThumbnail,
    };
    this.statusState.update(status => ({...status, phase: 'done', result}));
  }

  private recordThumbnailGenerationResult() {
    logger.info(`Finished thumbnail generation.`);
    const { errorOccurred, filePathsWithoutThumbnail } = this.status().result;
    if (errorOccurred) {
      logger.warn(`Error(s) occurred during thumbnail generation.`);
      const filePathsText = stringArrayToLogText(filePathsWithoutThumbnail);
      logger.warn(`Thumbnails could not be generated for the following ${filePathsWithoutThumbnail.length} files: ${filePathsText}`);
    }
    Analytics.trackEvent('Thumbnail Generation', 'Thumbnail Generation Finished', `Number of thumbnails failed to generate: ${filePathsWithoutThumbnail.length}`);
  }
}
