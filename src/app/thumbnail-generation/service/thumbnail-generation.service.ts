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
  public thumbnailGenerationStarted = new Subject<{numOfAllHeifFiles: number, generationRequiredFilePaths: string[]}>();
  public thumbnailGenerationInProgress = new Subject<{numberOfGeneratedThumbnails: number, progressPercent: number}>();
  public thumbnailGenerationDone = new Subject<void>();

  private heifFilePathsToGenerateThumbnail: string[];

  public startThumbnailGeneration(dirTreeObj: DirectoryTree): void {
    const flattenedDirTree = convertToFlattenedDirTree(dirTreeObj);
    const allHeifFilePaths = flattenedDirTree
      .filter(element => FilenameExtension.isHeif(element.extension))
      .map(element => element.path);

    Logger.info(`Number of all HEIF files: ${allHeifFilePaths.length}`);
    if (allHeifFilePaths.length >= 1) {
      Logger.info(`All HEIF file paths are as follows: `);
      allHeifFilePaths.forEach(filePath => Logger.info(filePath));
    }

    this.heifFilePathsToGenerateThumbnail = allHeifFilePaths.filter(filePath => !isThumbnailCacheAvailable(filePath));

    Logger.info(`Number of HEIF files to generate thumbnails: ${this.heifFilePathsToGenerateThumbnail.length}`);
    if (this.heifFilePathsToGenerateThumbnail.length >= 1) {
      Logger.info(`HEIF files to generate thumbnails are as follows: `);
      this.heifFilePathsToGenerateThumbnail.forEach(filePath => Logger.info(filePath));

      Logger.info(`Thumbnails for HEIF files will be generated in the main process.`);
      ipcRenderer.invoke(IpcConstants.ThumbnailGenerationInMainProcess.Name, this.heifFilePathsToGenerateThumbnail);

      this.thumbnailGenerationStarted.next({
        numOfAllHeifFiles: allHeifFilePaths.length,
        generationRequiredFilePaths: this.heifFilePathsToGenerateThumbnail
      });

      const numberOfThumbnailsUsingCache = allHeifFilePaths.length - this.heifFilePathsToGenerateThumbnail.length;
      Logger.info(`Total HEIF files: ${ allHeifFilePaths.length }, Using cache: ${ numberOfThumbnailsUsingCache }, `
        + `Generation required: ${ this.heifFilePathsToGenerateThumbnail.length }`);
      this.updateThumbnailGenerationStatus();
    } else {
      Logger.info(`Cached thumbnails are available for all HEIF files. Thumbnail generation is skipped.`);
    }
  }

  private updateThumbnailGenerationStatus(): void {
    const intervalId = setInterval(() => {
      const numberOfGeneratedThumbnails = this.heifFilePathsToGenerateThumbnail.filter(filePath => isThumbnailCacheAvailable(filePath)).length;
      const progressPercent = (numberOfGeneratedThumbnails / this.heifFilePathsToGenerateThumbnail.length) * 100;
      Logger.info(`Thumbnail generation progress: ${progressPercent} %, Generated/Generation-required: `
        + `${numberOfGeneratedThumbnails}/${this.heifFilePathsToGenerateThumbnail.length}`);
      this.thumbnailGenerationInProgress.next({numberOfGeneratedThumbnails, progressPercent});

      if (numberOfGeneratedThumbnails === this.heifFilePathsToGenerateThumbnail.length) {
        this.thumbnailGenerationDone.next();
        Logger.info(`Completed thumbnail generation.`);
        clearInterval(intervalId);
      }
    }, 500);
  }
}
