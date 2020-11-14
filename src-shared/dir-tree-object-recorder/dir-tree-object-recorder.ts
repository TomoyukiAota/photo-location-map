import { DirectoryTree } from 'directory-tree';
import { Analytics } from '../analytics/analytics';
import { convertToFlattenedDirTree } from '../dir-tree/dir-tree-util';
import { FilenameExtension } from '../filename-extension/filename-extension';
import { Logger } from '../log/logger';

class NumbersOfPhotos {
  public jpeg: number;
  public tiff: number;
  public png: number;
  public heif: number;
  public webp: number;
  public get total(): number { return this.jpeg + this.tiff + this.png + this.heif + this.webp; }

  public get supportedPercentage(): string {
    if (this.total === 0)
      return 'N/A (No photos loaded)';

    const supportedRatio = (this.jpeg + this.heif) / this.total;
    return (supportedRatio * 100).toFixed(3);
  }
}

class NumbersOfLivePhotos {
  public jpeg: number;
  public heif: number;
  public get total(): number { return this.jpeg + this.heif; }

  public get supportedPercentage(): string {
    if (this.total === 0)
      return 'N/A (No photos loaded)';

    const supportedRatio = (this.jpeg + this.heif) / this.total;
    return (supportedRatio * 100).toFixed(3);
  }
}

class NumbersToRecordFromDirTreeObject {
  public totalItems: number;
  public directories: number;
  public files: number;
  public photos = new NumbersOfPhotos();
  public livePhotos = new NumbersOfLivePhotos();
}

enum LivePhotosFormat {
  Jpeg,
  Heif
}

export class DirTreeObjectRecorder {
  public static record(dirTreeObject: DirectoryTree): void {
    Logger.info('Directory tree object: ', dirTreeObject);
    const flattenedDirTree = convertToFlattenedDirTree(dirTreeObject);
    Logger.info('Flattened directory tree: ', flattenedDirTree);
    const numberOf = this.getNumbersToRecord(flattenedDirTree);

    Logger.info(`Numbers of items in the selected directory are as follows:`);
    Logger.info(`Total Items: ${numberOf.totalItems}, Directories: ${numberOf.directories}, Files: ${numberOf.files}`);
    Logger.info(`[Photos] Total: ${numberOf.photos.total}, JPEG: ${numberOf.photos.jpeg}, TIFF: ${numberOf.photos.tiff}, `
      + `PNG: ${numberOf.photos.png}, HEIF: ${numberOf.photos.heif}, WebP: ${numberOf.photos.webp}`);
    Logger.info(`[Photos] Supported Percentage: ${numberOf.photos.supportedPercentage} %`);
    Logger.info(`[Live Photos] Total: ${numberOf.livePhotos.total}, JPEG: ${numberOf.livePhotos.jpeg}, HEIF: ${numberOf.livePhotos.heif}`);
    Logger.info(`[Live Photos] Supported Percentage: ${numberOf.livePhotos.supportedPercentage} %`);

    const track = Analytics.trackEvent;
    const category = 'Selected Folder Info';
    track(category, `${category}: Total Items`, `Total Items: ${numberOf.totalItems}`);
    track(category, `${category}: Directories`, `Directories: ${numberOf.directories}`);
    track(category, `${category}: Files`, `Files: ${numberOf.files}`);

    track(category, `${category}: Photos (JPEG)`, `Photos (JPEG): ${numberOf.photos.jpeg}`);
    track(category, `${category}: Photos (TIFF)`, `Photos (TIFF): ${numberOf.photos.tiff}`);
    track(category, `${category}: Photos (PNG)`, `Photos (PNG): ${numberOf.photos.png}`);
    track(category, `${category}: Photos (HEIF)`, `Photos (HEIF): ${numberOf.photos.heif}`);
    track(category, `${category}: Photos (WebP)`, `Photos (WebP): ${numberOf.photos.webp}`);
    track(category, `${category}: Photos (Total)`, `Photos (Total): ${numberOf.photos.total}`);
    track(category, `${category}: Photos (Supported %)`, `Photos (Supported %): ${numberOf.photos.supportedPercentage} %`);

    track(category, `${category}: Live Photos (JPEG)`, `Live Photos (JPEG): ${numberOf.livePhotos.jpeg}`);
    track(category, `${category}: Live Photos (HEIF)`, `Live Photos (HEIF): ${numberOf.livePhotos.heif}`);
    track(category, `${category}: Live Photos (Total)`, `Live Photos (Total): ${numberOf.livePhotos.total}`);
    track(category, `${category}: Live Photos (Supported %)`, `Live Photos (Supported %): ${numberOf.livePhotos.supportedPercentage} %`);
  }

  public static getNumbersToRecord(flattenedDirTree: DirectoryTree[]): NumbersToRecordFromDirTreeObject {
    const numberOf = new NumbersToRecordFromDirTreeObject();
    numberOf.totalItems = flattenedDirTree.length;
    numberOf.directories = flattenedDirTree.filter(element => element.type === 'directory').length;
    numberOf.files = flattenedDirTree.filter(element => element.type === 'file').length;
    numberOf.photos.jpeg = flattenedDirTree.filter(element => FilenameExtension.isJpeg(element.extension)).length;
    numberOf.photos.tiff = flattenedDirTree.filter(element => FilenameExtension.isTiff(element.extension)).length;
    numberOf.photos.png = flattenedDirTree.filter(element => FilenameExtension.isPng(element.extension)).length;
    numberOf.photos.heif = flattenedDirTree.filter(element => FilenameExtension.isHeif(element.extension)).length;
    numberOf.photos.webp = flattenedDirTree.filter(element => FilenameExtension.isWebp(element.extension)).length;
    numberOf.livePhotos.jpeg = this.getNumberOfLivePhotos(flattenedDirTree, LivePhotosFormat.Jpeg);
    numberOf.livePhotos.heif = this.getNumberOfLivePhotos(flattenedDirTree, LivePhotosFormat.Heif);
    return numberOf;
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
