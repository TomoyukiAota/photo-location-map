import PQueue from 'p-queue';
import { exifFetchLibraryInUse } from '../../../../src-shared/exif-fetch-library-in-use/exif-fetch-library-in-use';
import { FilenameExtension } from '../../../../src-shared/filename-extension/filename-extension';
import { Logger } from '../../../../src-shared/log/logger';
import { Exif } from '../model/exif.model';
import { LoadingFolderProgress } from '../loading-folder-progress';
import { fetchExifUsingExifParser } from './using-exif-parser/fetch-exif-using-exif-parser';
import { fetchExifUsingExifr } from './using-exifr/fetch-exif-using-exifr';

export class PathExifPair {
  constructor(public readonly path: string,
              public readonly exif: Exif) {
  }
}

export class ExifFetcher {
  private static readonly queue = new PQueue({concurrency: 10});
  private static readonly pathExifPairPromiseFuncs: (() => Promise<PathExifPair>)[] = [];

  public static async generatePathExifPairs(directoryTreeObject: DirectoryTree): Promise<PathExifPair[]> {
    Logger.debug(`ExifFetcher.generatePathExifPairs function: Started with `, directoryTreeObject);
    this.pathExifPairPromiseFuncs.length = 0;
    this.queue.clear();

    Logger.debug(`ExifFetcher.generatePathExifPairs function: Before calling updatePathExifPairPromiseFuncs`);
    this.updatePathExifPairPromiseFuncs(directoryTreeObject);
    Logger.debug(`ExifFetcher.generatePathExifPairs function: After calling updatePathExifPairPromiseFuncs`, this.pathExifPairPromiseFuncs);
    LoadingFolderProgress.setNumberOfAllFilesToLoad(this.pathExifPairPromiseFuncs.length);

    Logger.debug(`ExifFetcher.generatePathExifPairs function: Before awaiting all PathExifPair promises.`);
    const pathExifPairs = await this.queue.addAll(this.pathExifPairPromiseFuncs);
    Logger.debug(`ExifFetcher.generatePathExifPairs function: After awaiting all PathExifPair promises and gotten pathExifPairs`, pathExifPairs);

    return pathExifPairs;
  }

  private static updatePathExifPairPromiseFuncs(directoryTreeElement: DirectoryTree) {
    this.addPathExifPairPromiseFuncIfAppropriate(directoryTreeElement);
    if (directoryTreeElement.children) {
      directoryTreeElement.children.forEach(child => this.updatePathExifPairPromiseFuncs(child));
    }
  }

  private static addPathExifPairPromiseFuncIfAppropriate(directoryTreeElement: DirectoryTree) {
    const isDirectory = directoryTreeElement.type === 'directory';
    if (isDirectory)
      return;

    const isSupportedByPlm = FilenameExtension.isSupportedByPlm(directoryTreeElement.extension);
    if (!isSupportedByPlm)
      return;

    this.addPathExifPairPromiseFunc(directoryTreeElement.path);
  }

  private static addPathExifPairPromiseFunc(filePath: string) {
    const pathExifPairPromiseFunc = () => {
      let exifPromise: Promise<Exif>;

      if (exifFetchLibraryInUse === 'exifr') {
        exifPromise = fetchExifUsingExifr(filePath);
      } else if (exifFetchLibraryInUse === 'exif-parser') {
        exifPromise = fetchExifUsingExifParser(filePath);
      } else {
        Logger.error(`Something went wrong with exifFetchLibraryInUse. The value of exifFetchLibraryInUse is "${exifFetchLibraryInUse}"`);
      }

      const pathExifPairPromise = exifPromise
        .then(exif => new PathExifPair(filePath, exif))
        .finally(() => LoadingFolderProgress.incrementNumberOfLoadedFiles());
      return pathExifPairPromise;
    };

    this.pathExifPairPromiseFuncs.push(pathExifPairPromiseFunc);
  }
}
