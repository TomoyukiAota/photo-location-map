import { Injectable } from '@angular/core';
import { ipcRenderer } from 'electron';
import { Subject } from 'rxjs';
import { convertToFlattenedDirTree } from '../../../../src-shared/dir-tree/dir-tree-util';
import { FilenameExtension } from '../../../../src-shared/filename-extension/filename-extension';
import { IpcConstants } from '../../../../src-shared/ipc/ipc-constants';
import { Logger } from '../../../../src-shared/log/logger';
import { isThumbnailCacheAvailable } from '../../../../src-shared/thumbnail-cache/thumbnail-cache-util';

@Injectable({
  providedIn: 'root'
})
export class ThumbnailGenerationService {
  public generationStarted = new Subject<{numOfAllHeifFiles: number, numOfCacheAvailableThumbnails: number, numOfGenerationRequiredThumbnails: number}>();
  public generationInProgress = new Subject<{numOfGeneratedThumbnails: number, progressPercent: number}>();
  public generationDone = new Subject<void>();

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
    this.logAllHeifFiles();

    this.heifFilePathsToGenerateThumbnail = this.allHeifFilePaths.filter(filePath => !isThumbnailCacheAvailable(filePath));
    this.logHeifFilesToGenerateThumbnail();

    if (this.numOfHeifFilesToGenerateThumbnail >= 1) {
      this.startGenerationInMainProcess();
      this.updateGenerationStatusAsStarted();
      this.updateGenerationStatusFromInProgressToDone();
    } else {
      Logger.info(`Cached thumbnails are available for all HEIF files. Thumbnail generation is skipped.`);
    }
  }

  private logAllHeifFiles(): void {
    Logger.info(`Number of all HEIF files: ${this.numOfAllHeifFiles}`);
    if (this.numOfAllHeifFiles >= 1) {
      Logger.info(`All HEIF file paths are as follows: `);
      this.allHeifFilePaths.forEach(filePath => Logger.info(filePath));
    }
  }

  private logHeifFilesToGenerateThumbnail(): void {
    Logger.info(`Number of HEIF files to generate thumbnails: ${this.numOfHeifFilesToGenerateThumbnail}`);
    if (this.numOfHeifFilesToGenerateThumbnail >= 1) {
      Logger.info(`HEIF files to generate thumbnails are as follows: `);
      this.heifFilePathsToGenerateThumbnail.forEach(filePath => Logger.info(filePath));
    }
  }

  private startGenerationInMainProcess() {
    Logger.info(`Thumbnails for HEIF files will be generated in the main process.`);

    // noinspection JSIgnoredPromiseFromCall
    ipcRenderer.invoke(IpcConstants.ThumbnailGenerationInMainProcess.Name, this.heifFilePathsToGenerateThumbnail);
  }

  private updateGenerationStatusAsStarted() {
    const numOfCacheAvailableThumbnails = this.numOfAllHeifFiles - this.numOfGenerationRequiredThumbnails;

    this.generationStarted.next({
      numOfAllHeifFiles: this.numOfAllHeifFiles,
      numOfCacheAvailableThumbnails: numOfCacheAvailableThumbnails,
      numOfGenerationRequiredThumbnails: this.numOfGenerationRequiredThumbnails,
    });

    Logger.info(`Total HEIF files: ${this.numOfAllHeifFiles}, Cache-available: ${numOfCacheAvailableThumbnails}, `
      + `Generation-required: ${this.numOfGenerationRequiredThumbnails}`);
  }

  private updateGenerationStatusFromInProgressToDone(): void {
    const updateMilliseconds = 500;
    const intervalId = setInterval(() => {
      const numberOfGeneratedThumbnails = this.heifFilePathsToGenerateThumbnail.filter(filePath => isThumbnailCacheAvailable(filePath)).length;
      const progressPercent = (numberOfGeneratedThumbnails / this.numOfGenerationRequiredThumbnails) * 100;
      Logger.info(`Thumbnail generation progress: ${progressPercent} %, Generated/Generation-required: `
        + `${numberOfGeneratedThumbnails}/${this.numOfGenerationRequiredThumbnails}`);
      this.generationInProgress.next({numOfGeneratedThumbnails: numberOfGeneratedThumbnails, progressPercent});

      if (numberOfGeneratedThumbnails === this.numOfGenerationRequiredThumbnails) {
        this.generationDone.next();
        Logger.info(`Completed thumbnail generation.`);
        clearInterval(intervalId);
      }
    }, updateMilliseconds);
  }
}
