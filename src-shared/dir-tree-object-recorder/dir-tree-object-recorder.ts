import { DirectoryTree } from 'directory-tree';
import { Analytics } from '../analytics/analytics';
import { Logger } from '../log/logger';
import { FilenameExtension } from '../../src/app/shared/filename-extension';

class NumbersToRecordFromDirTreeObject {
  public totalItems: number;
  public directories: number;
  public files: number;
  public jpegFiles: number;
  public tiffFiles: number;
  public heifFiles: number;
  public livePhotosByJpeg: number;
  public livePhotosByHeif: number;
}

enum LivePhotosFormat {
  Jpeg,
  Heif
}

export class DirTreeObjectRecorder {
  public static record(dirTreeObject: DirectoryTree): void {
    Logger.info('Directory tree object: ', dirTreeObject);
    const numberOf = this.getNumbersToRecord(dirTreeObject);

    Logger.info(`Numbers of items in the selected directory are as follows:`);
    Logger.info(`Total Items: ${numberOf.totalItems}, Directories: ${numberOf.directories}, Files: ${numberOf.files}`);
    Logger.info(`JPEG Files: ${numberOf.jpegFiles}, TIFF Files: ${numberOf.tiffFiles}, HEIF Files: ${numberOf.heifFiles}`);
    Logger.info(`Live Photos (JPEG): ${numberOf.livePhotosByJpeg}, Live Photos (HEIF): ${numberOf.livePhotosByHeif}`);

    Analytics.trackEvent('Selected Folder Info', 'Selected Folder Info: Total Items', `Total Items: ${numberOf.totalItems}`);
    Analytics.trackEvent('Selected Folder Info', 'Selected Folder Info: Directories', `Directories: ${numberOf.directories}`);
    Analytics.trackEvent('Selected Folder Info', 'Selected Folder Info: Files', `Files: ${numberOf.files}`);
    Analytics.trackEvent('Selected Folder Info', 'Selected Folder Info: JPEG Files', `JPEG Files: ${numberOf.jpegFiles}`);
    Analytics.trackEvent('Selected Folder Info', 'Selected Folder Info: TIFF Files', `TIFF Files: ${numberOf.tiffFiles}`);
    Analytics.trackEvent('Selected Folder Info', 'Selected Folder Info: HEIF Files', `HEIF Files: ${numberOf.heifFiles}`);
    Analytics.trackEvent('Selected Folder Info', 'Selected Folder Info: Live Photos (JPEG)', `Live Photos (JPEG): ${numberOf.livePhotosByJpeg}`);
    Analytics.trackEvent('Selected Folder Info', 'Selected Folder Info: Live Photos (HEIF)', `Live Photos (HEIF): ${numberOf.livePhotosByHeif}`);
  }

  public static getNumbersToRecord(dirTreeObject: DirectoryTree): NumbersToRecordFromDirTreeObject {
    const flattenedDirTree = this.convertToFlattenedDirTree(dirTreeObject);
    Logger.info('Flattened directory tree: ', flattenedDirTree);

    const numberOf = new NumbersToRecordFromDirTreeObject();
    numberOf.totalItems = flattenedDirTree.length;
    numberOf.directories = flattenedDirTree.filter(element => element.type === 'directory').length;
    numberOf.files = flattenedDirTree.filter(element => element.type === 'file').length;
    numberOf.jpegFiles = flattenedDirTree.filter(element => FilenameExtension.isJpeg(element.extension)).length;
    numberOf.tiffFiles = flattenedDirTree.filter(element => FilenameExtension.isTiff(element.extension)).length;
    numberOf.heifFiles = flattenedDirTree.filter(element => FilenameExtension.isHeif(element.extension)).length;
    numberOf.livePhotosByJpeg = this.getNumberOfLivePhotos(flattenedDirTree, LivePhotosFormat.Jpeg);
    numberOf.livePhotosByHeif = this.getNumberOfLivePhotos(flattenedDirTree, LivePhotosFormat.Heif);
    return numberOf;
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

  private static getNumberOfLivePhotos(flattenedDirTree: DirectoryTree[], format: LivePhotosFormat): number {
    const filterByExtension = format === LivePhotosFormat.Jpeg
      ? element => FilenameExtension.isJpeg(element.extension)
      : element => FilenameExtension.isHeif(element.extension);

    const possibleLivePhotoMovFilePaths = flattenedDirTree
      .filter(filterByExtension)
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
