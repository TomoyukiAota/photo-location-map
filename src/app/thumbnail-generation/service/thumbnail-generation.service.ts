import { Injectable } from '@angular/core';
import { ipcRenderer } from 'electron';
import { BehaviorSubject, Subject } from 'rxjs';
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

@Injectable({
  providedIn: 'root'
})
export class ThumbnailGenerationService {
  public generationStarted = new Subject<{numOfAllHeifFiles: number, numOfCacheAvailableThumbnails: number, numOfGenerationRequiredThumbnails: number}>();
  public generationProgress = new Subject<{numOfProcessedThumbnails: number, progressPercent: number}>();
  public generationDone = new Subject<ThumbnailGenerationResult>();
  public thumbnailGenerationResult: ThumbnailGenerationResult;
  public isGenerating = new BehaviorSubject<boolean>(false);

  constructor() {
    this.generationStarted.subscribe(() => this.isGenerating.next(true));
    this.generationDone.subscribe(() => this.isGenerating.next(false));
  }

  private allHeifFilePaths: string[];
  private get numOfAllHeifFiles(): number { return this.allHeifFilePaths.length; }

  private heifFilePathsToGenerateThumbnail: string[];
  private get numOfHeifFilesToGenerateThumbnail(): number { return this.heifFilePathsToGenerateThumbnail.length; }
  private get numOfGenerationRequiredThumbnails(): number { return this.numOfHeifFilesToGenerateThumbnail; }

  public startThumbnailGeneration(dirTreeObj: DirectoryTree): void {
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
    } else {
      logger.info(`Cached thumbnails are available for all HEIF files. Thumbnail generation is skipped.`);
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
    this.generationStarted.next({
      numOfAllHeifFiles: this.numOfAllHeifFiles,
      numOfCacheAvailableThumbnails: numOfCacheAvailableThumbnails,
      numOfGenerationRequiredThumbnails: this.numOfGenerationRequiredThumbnails,
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
    this.generationProgress.next({numOfProcessedThumbnails: numberOfProcessedThumbnails, progressPercent});
  }

  private updateGenerationStatusToDone() {
    const heifFilePathsWithoutThumbnail = this.heifFilePathsToGenerateThumbnail.filter(filePath => !isThumbnailCacheAvailable(filePath));
    const errorOccurred = heifFilePathsWithoutThumbnail.length >= 1;
    this.thumbnailGenerationResult = {
      errorOccurred: errorOccurred,
      filePathsWithoutThumbnail: heifFilePathsWithoutThumbnail,
    };
    this.generationDone.next(this.thumbnailGenerationResult);
  }

  private recordThumbnailGenerationResult() {
    logger.info(`Finished thumbnail generation.`);
    const { errorOccurred, filePathsWithoutThumbnail } = this.thumbnailGenerationResult;
    if (errorOccurred) {
      logger.warn(`Error(s) occurred during thumbnail generation.`);
      const filePathsText = stringArrayToLogText(filePathsWithoutThumbnail);
      logger.warn(`Thumbnails could not be generated for the following ${filePathsWithoutThumbnail.length} files: ${filePathsText}`);
    }
    Analytics.trackEvent('Thumbnail Generation', 'Thumbnail Generation Finished', `Number of thumbnails failed to generate: ${filePathsWithoutThumbnail.length}`);
  }
}
