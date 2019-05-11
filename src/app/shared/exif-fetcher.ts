import * as fs from 'fs';
import * as exifParser from 'exif-parser';
import { Logger } from '../../../src-shared/log/logger';
import { SupportedFilenameExtensions } from './supported-filename-extensions';

export class PathExifPair {
  constructor(public readonly path: string,
              public readonly exifParserResult: ExifParserResult) {
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

    const isSupportedExtension = SupportedFilenameExtensions.isSupported(directoryTreeElement.extension);
    if (!isSupportedExtension)
      return;

    this.addPathExifPairPromise(directoryTreeElement);
  }

  private static addPathExifPairPromise(directoryTreeElement: DirectoryTree) {
    const promise = this.instantiatePromiseToFetchExif(directoryTreeElement)
      .then(exifParserResult =>
        new PathExifPair(directoryTreeElement.path, exifParserResult)
      )
      .catch(() =>
        new PathExifPair(directoryTreeElement.path, null)
      );

    this.pathExifPairPromises.push(promise);
  }

  private static instantiatePromiseToFetchExif(directoryTreeElement: DirectoryTree): Promise<ExifParserResult> {
    return new Promise((resolve, reject) => {
      let exif: ExifParserResult = null;
      const bufferLengthRequiredToParseExif = 65635;
      const readStream = fs.createReadStream(
        directoryTreeElement.path,
        {start: 0, end: bufferLengthRequiredToParseExif - 1});

      readStream.on('readable', () => {
        let buffer;
        while (null !== (buffer = readStream.read(bufferLengthRequiredToParseExif))) {
          Logger.info(`Fetched ${buffer.length} bytes from ${directoryTreeElement.path}`);
          try {
            exif = exifParser.create(buffer).parse();
            Logger.info(`Fetched EXIF of ${directoryTreeElement.path} `, exif);
          } catch (error) {
            Logger.warn(`Failed to fetch EXIF of ${directoryTreeElement.path} `, error);
          }
        }
      });

      readStream.on('end', () => {
        if (exif) {
          resolve(exif);
        } else {
          reject();
        }
      });

      readStream.on('error', error => {
        Logger.warn(`An error occurred when fetching data from ${directoryTreeElement.path} `, error);
        reject(error);
      });

      readStream.resume();
    });
  }
}
