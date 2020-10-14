import { FilenameExtension } from '../../../src-shared/filename-extension/filename-extension';
import { Logger } from '../../../src-shared/log/logger';
import { Photo } from './model/photo.model';
import { ExifFetcher, PathExifPair } from './exif-fetcher';
import { PathPhotoMapRecorder } from './path-photo-map-recorder';

export class PathPhotoMapCreator {
  private static pathPhotoMap: Map<string, Photo>;

  public static async create(directoryTreeObject: DirectoryTree): Promise<Map<string, Photo>> {
    this.pathPhotoMap = new Map<string, Photo>();
    await this.updatePathPhotoMap(directoryTreeObject);
    PathPhotoMapRecorder.record(this.pathPhotoMap);
    return this.pathPhotoMap;
  }

  private static async updatePathPhotoMap(directoryTreeObject: DirectoryTree): Promise<void> {
    this.addPathPhotoMapElements(directoryTreeObject);
    await this.updatePhotosWithExif(directoryTreeObject);
    Logger.info(`Updated path-photo map: `, this.pathPhotoMap);
  }

  private static addPathPhotoMapElements(directoryTreeObject: DirectoryTree) {
    this.addPathPhotoMapElementIfAppropriate(directoryTreeObject);
    if (directoryTreeObject.children) {
      directoryTreeObject.children.forEach(child => this.addPathPhotoMapElements(child));
    }
  }

  private static addPathPhotoMapElementIfAppropriate(directoryTreeElement: DirectoryTree) {
    const isDirectory = directoryTreeElement.type === 'directory';
    if (isDirectory)
      return;

    const isSupportedExtension = FilenameExtension.isSupported(directoryTreeElement.extension);
    if (!isSupportedExtension)
      return;

    const photo = new Photo();
    photo.name = directoryTreeElement.name;
    photo.path = directoryTreeElement.path;
    photo.exif = null;
    this.pathPhotoMap.set(photo.path, photo);
  }

  private static async updatePhotosWithExif(directoryTreeObject: DirectoryTree) {
    const pathExifPairs = await ExifFetcher.generatePathExifPairs(directoryTreeObject)
      .catch(reason => {
        Logger.error(`Something went wrong in ExifFetcher.generatePathExifPairs(directoryTreeObject) : `, directoryTreeObject, reason);
        return [];
      });

    pathExifPairs.forEach(pair => this.updateEachPhotoWithExif(pair));
  }

  private static updateEachPhotoWithExif(pair: PathExifPair) {
    const photo = this.pathPhotoMap.get(pair.path);
    photo.exif = pair.exif;
  }
}
