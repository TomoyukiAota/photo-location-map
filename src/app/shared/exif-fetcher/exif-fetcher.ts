import { FilenameExtension } from '../../../../src-shared/filename-extension/filename-extension';
import { Logger } from '../../../../src-shared/log/logger';
import { Exif } from '../model/exif.model';
import { fetchExifUsingExifParser } from './using-exif-parser/fetch-exif-using-exif-parser';
import { fetchExifUsingExifr } from './using-exifr/fetch-exif-using-exifr';

export class PathExifPair {
  constructor(public readonly path: string,
              public readonly exif: Exif) {
  }
}

export class ExifFetcher {
  private static readonly pathExifPairPromises: Promise<PathExifPair>[] = [];

  public static async generatePathExifPairs(directoryTreeObject: DirectoryTree): Promise<PathExifPair[]> {
    Logger.debug(`ExifFetcher.generatePathExifPairs function: Started with `, directoryTreeObject);
    this.pathExifPairPromises.length = 0;
    Logger.debug(`ExifFetcher.generatePathExifPairs function: Before calling updatePathExifPairPromises`);
    this.updatePathExifPairPromises(directoryTreeObject);
    Logger.debug(`ExifFetcher.generatePathExifPairs function: After calling updatePathExifPairPromises`, this.pathExifPairPromises);
    const pathExifPairs = await Promise.all(this.pathExifPairPromises);
    Logger.debug(`ExifFetcher.generatePathExifPairs function: After await Promise.all(this.pathExifPairPromises) and gotten pathExifPairs`, pathExifPairs);
    return pathExifPairs;
  }

  private static updatePathExifPairPromises(directoryTreeElement: DirectoryTree) {
    this.addPathExifPairPromiseIfAppropriate(directoryTreeElement);
    if (directoryTreeElement.children) {
      directoryTreeElement.children.forEach(child => this.updatePathExifPairPromises(child));
    }
  }

  private static addPathExifPairPromiseIfAppropriate(directoryTreeElement: DirectoryTree) {
    const isDirectory = directoryTreeElement.type === 'directory';
    if (isDirectory)
      return;

    const isSupportedByPlm = FilenameExtension.isSupportedByPlm(directoryTreeElement.extension);
    if (!isSupportedByPlm)
      return;

    this.addPathExifPairPromise(directoryTreeElement.path);
  }

  public static exifFetchLibraryInUse: 'exifr' | 'exif-parser' = 'exifr';

  private static addPathExifPairPromise(filePath: string) {
    let exifPromise: Promise<Exif>;

    if (this.exifFetchLibraryInUse === 'exifr') {
      exifPromise = fetchExifUsingExifr(filePath);
    } else if (this.exifFetchLibraryInUse === 'exif-parser') {
      exifPromise = fetchExifUsingExifParser(filePath);
    } else {
      Logger.error(`Something went wrong with exifFetchLibraryInUse. The value of exifFetchLibraryInUse is "${this.exifFetchLibraryInUse}"`);
    }

    const pathExifPairPromise = exifPromise
      .then(exif => new PathExifPair(filePath, exif));

    this.pathExifPairPromises.push(pathExifPairPromise);
  }
}
