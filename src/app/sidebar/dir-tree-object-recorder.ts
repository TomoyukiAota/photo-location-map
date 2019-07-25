import { DirectoryTree } from 'directory-tree';
import { Analytics } from '../../../src-shared/analytics/analytics';
import { Logger } from '../../../src-shared/log/logger';
import { SupportedFilenameExtensions } from '../shared/supported-filename-extensions';

export class DirTreeObjectRecorder {
  public static record(dirTreeObject: DirectoryTree): void {
    Logger.info('Directory tree object: ', dirTreeObject);
    const flattenedDirTree = this.convertToFlattenedDirTree(dirTreeObject);
    Logger.info('Flattened directory tree: ', flattenedDirTree);

    const totalNumOfItems = flattenedDirTree.length;
    const numOfDirectories = flattenedDirTree.filter(element => element.type === 'directory').length;
    const numOfFiles = flattenedDirTree.filter(element => element.type === 'file').length;
    const numOfJpegFiles = flattenedDirTree.filter(
      element => SupportedFilenameExtensions.isJpeg(element.extension)).length;
    const numOfLivePhotos = this.getNumberOfLivePhotos(flattenedDirTree);

    Logger.info(`Numbers of items in the selected directory are as follows:`);
    Logger.info(`Total Items: ${totalNumOfItems}, Directories: ${numOfDirectories}, Files: ${numOfFiles}`);
    Logger.info(`JPEG Files: ${numOfJpegFiles}, Live Photos: ${numOfLivePhotos}`);

    Analytics.trackEvent('Selected Folder Info', 'Selected Folder Info: Total Items', `Total Items: ${totalNumOfItems}`);
    Analytics.trackEvent('Selected Folder Info', 'Selected Folder Info: Directories', `Directories: ${numOfDirectories}`);
    Analytics.trackEvent('Selected Folder Info', 'Selected Folder Info: Files', `Files: ${numOfFiles}`);
    Analytics.trackEvent('Selected Folder Info', 'Selected Folder Info: JPEG Files', `JPEG Files: ${numOfJpegFiles}`);
    Analytics.trackEvent('Selected Folder Info', 'Selected Folder Info: Live Photos', `Live Photos: ${numOfLivePhotos}`);
    // TODO: Add more numbers
  }

  private static convertToFlattenedDirTree(dirTreeObject: DirectoryTree): DirectoryTree[] {
    const flattenedDirTree: DirectoryTree[] = [];
    this.flattenDirectoryTree([dirTreeObject], flattenedDirTree);
    return flattenedDirTree;
  }

  private static flattenDirectoryTree(srcDirTreeArray: DirectoryTree[], dstDirTreeArray: DirectoryTree[]): DirectoryTree[] {
    srcDirTreeArray.forEach((element: DirectoryTree) => {
      dstDirTreeArray.push(element);
      if (element.children) {
        this.flattenDirectoryTree(element.children, dstDirTreeArray);
      }
    });
    return dstDirTreeArray;
  }

  private static getNumberOfLivePhotos(flattenedDirTree: DirectoryTree[]): number {
    const possibleLivePhotoMovFilePaths = flattenedDirTree
      .filter(element => SupportedFilenameExtensions.isJpeg(element.extension))
      .map(element => element.path)
      .map(path => this.removeExtension(path))
      .map(path => `${path}.MOV`)
      .map(path => path.toUpperCase());

    const allFilePaths = flattenedDirTree
      .map(element => element.path)
      .map(path => path.toUpperCase());

    const livePhotos = possibleLivePhotoMovFilePaths.filter(path => allFilePaths.includes(path));
    return livePhotos.length;
  }

  private static removeExtension(path: string): string {
    return path.replace(/\.[^/.]+$/, '');
  }
}
