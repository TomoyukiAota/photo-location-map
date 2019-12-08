import * as exifParser from 'exif-parser';
import { FilenameExtension } from '../../../src-shared/filename-extension/filename-extension';
import { Logger } from '../../../src-shared/log/logger';

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

    const isSupportedExtension = FilenameExtension.isSupported(directoryTreeElement.extension);
    if (!isSupportedExtension)
      return;

    this.addPathExifPairPromise(directoryTreeElement.path);
  }

  private static addPathExifPairPromise(filePath: string) {
    const promise = this.instantiatePromiseToFetchExif(filePath)
      .then(exifParserResult =>
        new PathExifPair(filePath, exifParserResult)
      )
      .catch(() =>
        new PathExifPair(filePath, null)
      );

    this.pathExifPairPromises.push(promise);
  }

  private static instantiatePromiseToFetchExif(filePath: string): Promise<ExifParserResult> {
    return new Promise((resolve, reject) => {
      const bufferLengthRequiredToParseExif = 65635;
      window.require('fs-extra').open(filePath, 'r', (error, fd) => {
        if (error) {
          Logger.warn(`Failed to open ${filePath}`, error);
          reject(`Failed to open file ${filePath}`);
          return;
        }

        const buffer = Buffer.allocUnsafe(bufferLengthRequiredToParseExif);
        window.require('fs-extra').read(fd, buffer, 0, bufferLengthRequiredToParseExif, 0, (err, bytesRead) => {
          if (err) {
            Logger.warn(`Failed to read file content of ${filePath}`, err, fd);
            reject(`Failed to read file content of ${filePath}`);
            return;
          }

          try {
            const exif = exifParser.create(buffer).parse();
            Logger.info(`Fetched EXIF of ${filePath} `, exif);
            resolve(exif);
          } catch (error) {
            if (error.message === 'Invalid JPEG section offset') {
              Logger.info(`exif-parser reported "Invalid JPEG section offset" for "${filePath}" reading ${bytesRead} bytes.`);
            } else {
              Logger.warn(`Failed to fetch EXIF of ${filePath} `, error);
            }

            reject(`Failed to fetch EXIF of ${filePath}`);
          }

          window.require('fs-extra').close(fd, e => {
            if (e)
              Logger.warn(`Failed to close ${filePath}`, error);
          });
        });
      });
    });
  }

  // Previous implementation using readStream. Stopped using this because the readStream does not flow in some cases.
  // TODO: When another implementation becomes stable, remove this implementation.
  private static instantiatePromiseToFetchExif_old(filePath: string): Promise < ExifParserResult > {
    return new Promise((resolve, reject) => {
      console.debug('instantiatePromise function: Start of new Promise');
      let exif: ExifParserResult = null;
      const bufferLengthRequiredToParseExif = 65635;
      const readStream = window.require('fs-extra').createReadStream(
        filePath,
        {start: 0, end: bufferLengthRequiredToParseExif - 1});

      readStream.on('readable', () => {
        console.debug(`readStream.on "readable" start for ${filePath}`);
        let buffer;
        while (null !== (buffer = readStream.read(bufferLengthRequiredToParseExif))) {
          Logger.info(`Fetched ${buffer.length} bytes from ${filePath}`);
          try {
            exif = exifParser.create(buffer).parse();
            Logger.info(`Fetched EXIF of ${filePath} `, exif);
          } catch (error) {
            Logger.warn(`Failed to fetch EXIF of ${filePath} `, error);
          }
        }
      });

      readStream.on('end', () => {
        console.debug(`readStream.on "end" start for ${filePath}`, exif);
        if (exif) {
          resolve(exif);
        } else {
          reject();
        }
      });

      readStream.on('error', error => {
        Logger.warn(`An error occurred when fetching data from ${filePath} `, error);
        reject(error);
      });

      readStream.resume();
      console.debug('instantiatePromise function: End of new Promise');
    });
  }
}
