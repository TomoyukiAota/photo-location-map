import * as pathModule from 'path';
import * as createDirectoryTree from 'directory-tree';
import { FilenameExtension } from '../../../src-shared/filename-extension/filename-extension';
import { convertToFlattenedDirTree } from '../../../src-shared/dir-tree/dir-tree-util';

export class SelectedDirectory {
  private static movFilePaths: string[] = [];

  public static createDirectoryTree(selectedDirPath: string) {
    const dirTree = createDirectoryTree(selectedDirPath);
    const flattenedDirTree = convertToFlattenedDirTree(dirTree);
    this.movFilePaths = flattenedDirTree
      .filter(element => FilenameExtension.isMov(element.extension))
      .map(element => element.path.toLowerCase());
    return dirTree;
  }

  public static getLivePhotosFilePathIfAvailable(photoFilePath: string) {
    const parsedPath = pathModule.parse(photoFilePath);
    const livePhotosFilePath = pathModule.join(parsedPath.dir, parsedPath.name + '.MOV').toLowerCase();
    const livePhotosAvailable = this.movFilePaths.includes(livePhotosFilePath);
    return {livePhotosAvailable, livePhotosFilePath};
  }
}
