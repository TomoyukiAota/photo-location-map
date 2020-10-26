import { Injectable } from '@angular/core';
import { ipcRenderer } from 'electron';
import { Subject } from 'rxjs';
import { convertToFlattenedDirTree } from '../../../../src-shared/dir-tree/dir-tree-util';
import { FilenameExtension } from '../../../../src-shared/filename-extension/filename-extension';
import { IpcConstants } from '../../../../src-shared/ipc/ipc-constants';
import { Logger } from '../../../../src-shared/log/logger';
import { isThumbnailCacheAvailable } from '../../../../src-shared/thumbnail/thumbnail-generation-util';

@Injectable({
  providedIn: 'root'
})
export class ThumbnailGenerationService {
  public thumbnailGenerationStarted = new Subject<{numOfAllHeifFiles: number, generationRequiredFilePaths: string[]}>();

  public generateThumbnail(dirTreeObj: DirectoryTree) {
    const flattenedDirTree = convertToFlattenedDirTree(dirTreeObj);
    const heifFilePaths = flattenedDirTree
      .filter(element => FilenameExtension.isHeif(element.extension))
      .map(element => element.path);

    Logger.info(`Number of all HEIF files: ${heifFilePaths.length}`);
    if (heifFilePaths.length >= 1) {
      Logger.info(`All HEIF file paths are as follows: `);
      heifFilePaths.forEach(filePath => Logger.info(filePath));
    }

    const heifFilePathsToGenerateThumbnail = heifFilePaths.filter(filePath => !isThumbnailCacheAvailable(filePath));

    Logger.info(`Number of HEIF files to generate thumbnails: ${heifFilePathsToGenerateThumbnail.length}`);
    if (heifFilePathsToGenerateThumbnail.length >= 1) {
      Logger.info(`HEIF files to generate thumbnails are as follows: `);
      heifFilePathsToGenerateThumbnail.forEach(filePath => Logger.info(filePath));
      Logger.info(`Thumbnails for HEIF files will be generated in the main process.`);
      ipcRenderer.invoke(IpcConstants.ThumbnailGenerationInMainProcess.Name, heifFilePathsToGenerateThumbnail);
      this.thumbnailGenerationStarted.next({
        numOfAllHeifFiles: heifFilePaths.length,
        generationRequiredFilePaths: heifFilePathsToGenerateThumbnail
      });
    } else {
      Logger.info(`Cached thumbnails are available for all HEIF files. Thumbnail generation is skipped.`);
    }
  }
}
