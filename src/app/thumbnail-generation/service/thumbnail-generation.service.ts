import { Injectable } from '@angular/core';
import { ipcRenderer } from 'electron';
import { BehaviorSubject, Subject } from 'rxjs';
import { convertToFlattenedDirTree } from '../../../../src-shared/dir-tree/dir-tree-util';
import { FilenameExtension } from '../../../../src-shared/filename-extension/filename-extension';
import { IpcConstants } from '../../../../src-shared/ipc/ipc-constants';
import { isThumbnailCacheAvailable } from '../../../../src-shared/thumbnail/cache/thumbnail-cache-util';
import { thumbnailGenerationLogger as logger } from '../../../../src-shared/thumbnail/generation/thumbnail-generation-logger';

@Injectable({
  providedIn: 'root'
})
export class ThumbnailGenerationService {
  public generationStarted = new Subject<{numOfAllHeifFiles: number, numOfCacheAvailableThumbnails: number, numOfGenerationRequiredThumbnails: number}>();
  public generationProgress = new Subject<{numOfGeneratedThumbnails: number, progressPercent: number}>();
  public generationDone = new Subject<void>();
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

    logger.info(`Total HEIF files: ${this.numOfAllHeifFiles}, Cache-available: ${numOfCacheAvailableThumbnails}, `
      + `Generation-required: ${this.numOfGenerationRequiredThumbnails}`);
  }

  private updateGenerationStatusFromInProgressToDone(): void {
    const updateMilliseconds = 10000;
    const intervalId = setInterval(() => {
      const numberOfGeneratedThumbnails = this.heifFilePathsToGenerateThumbnail.filter(filePath => isThumbnailCacheAvailable(filePath)).length;
      const progressPercent = (numberOfGeneratedThumbnails / this.numOfGenerationRequiredThumbnails) * 100;
      logger.info(`Thumbnail generation progress: ${progressPercent.toFixed(5)} %, Generated/Generation-required: `
        + `${numberOfGeneratedThumbnails}/${this.numOfGenerationRequiredThumbnails}`);
      this.generationProgress.next({numOfGeneratedThumbnails: numberOfGeneratedThumbnails, progressPercent});

      if (numberOfGeneratedThumbnails === this.numOfGenerationRequiredThumbnails) {
        this.generationDone.next();
        logger.info(`Completed thumbnail generation.`);
        clearInterval(intervalId);
      }
    }, updateMilliseconds);
  }
}
