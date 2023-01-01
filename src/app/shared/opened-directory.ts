/* eslint-disable no-useless-escape */

import { wrap } from 'comlink';
import * as pathModule from 'path';
import { FilenameExtension } from '../../../src-shared/filename-extension/filename-extension';

export class OpenedDirectory {
  private static excludeRegexArray: RegExp[] = [
    // Notes:
    // - The purpose of regex is to exclude the hidden files/folders.
    // - Regex should be as specific as possible in order not to accidentally exclude visible files/folders.
    // - Regex begins from [\/\\] (/ or \ for path separator) to be sure of the beginning of a file/folder name.
    // - For files, $ is placed at the end to be sure of specifying file paths.
    // - Using i flag to ignore case. e.g. both $RECYCLE.BIN and $Recycle.Bin exist.

    // Windows
    /[\/\\]\$Recycle\.Bin/i,
    /[\/\\]desktop\.ini$/i,
    /[\/\\]Thumbs\.db$/i,

    // Mac - Anywhere
    /[\/\\]\._.*/i,
    /[\/\\]\.AppleDouble/i,
    /[\/\\]\.DS_Store$/i,
    /[\/\\]\.localized$/i,
    /[\/\\]__MACOSX/i,

    // Mac - Root of a Volume
    /[\/\\]\.apdisk$/i,
    /[\/\\]\.com\.apple\.timemachine\.donotpresent$/i,
    /[\/\\]\.DocumentRevisions-V100/i,
    /[\/\\]\.fseventsd/i,
    /[\/\\]\.Spotlight-V100/i,
    /[\/\\]\.TemporaryItems/i,
    /[\/\\]\.Trashes/i,
    /[\/\\]\.VolumeIcon\.icns/i,
  ];

  private static worker = wrap<typeof import('./worker/directory-tree.worker').api>(
    new Worker(new URL('./worker/directory-tree.worker', import.meta.url)),
  );

  public static async createDirectoryTree(dirPath: string) {
    const dirTree = await this.worker.createDirectoryTree(dirPath, {exclude: this.excludeRegexArray});
    await this.storeLivePhotosCandidateFilePaths(dirTree);
    return dirTree;
  }

  private static livePhotosCandidateFilePaths: string[] = [];

  private static async storeLivePhotosCandidateFilePaths(dirTree: DirectoryTree) {
    const flattenedDirTree = await this.worker.convertToFlattenedDirTree(dirTree);
    this.livePhotosCandidateFilePaths
      = flattenedDirTree
        .filter(element => FilenameExtension.isLivePhotos(element.extension))
        .map(element => element.path.toLowerCase());
  }

  public static getLivePhotosFilePathIfAvailable(photoFilePath: string) {
    const livePhotosExtensions = FilenameExtension.extensionsForLivePhotos;

    for (const extension of livePhotosExtensions) {
      const result = this.findLivePhotos(photoFilePath, extension);
      if (result.livePhotosAvailable) {
        return {
          livePhotosAvailable: result.livePhotosAvailable,
          livePhotosFilePath: result.livePhotosFilePath,
        };
      }
    }

    return {
      livePhotosAvailable: false,
      livePhotosFilePath: '',
    };
  }

  private static findLivePhotos(photoFilePath: string, extension: string) {
    const parsedPath = pathModule.parse(photoFilePath);
    const livePhotosFilePath = pathModule.join(parsedPath.dir, parsedPath.name + extension).toLowerCase();
    const livePhotosAvailable = this.livePhotosCandidateFilePaths.includes(livePhotosFilePath);
    return {livePhotosAvailable, livePhotosFilePath};
  }
}
