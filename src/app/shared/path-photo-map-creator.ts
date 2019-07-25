import { Logger } from '../../../src-shared/log/logger';
import { Dimensions } from './model/dimensions.model';
import { GpsInfo } from './model/gps-info.model';
import { LatLng } from './model/lat-lng.model';
import { Thumbnail } from './model/thumbnail.model';
import { Photo } from './model/photo.model';
import { ExifFetcher } from './exif-fetcher';
import { PhotoDateTimeTakenGenerator } from './photo-date-time-taken-generator';
import { SupportedFilenameExtensions } from './supported-filename-extensions';

export class PathPhotoMapCreator {
  private static pathPhotoMap: Map<string, Photo>;

  public static async create(directoryTreeObject: DirectoryTree): Promise<Map<string, Photo>> {
    this.pathPhotoMap = new Map<string, Photo>();
    await this.updatePathPhotoMap(directoryTreeObject);
    return this.pathPhotoMap;
  }

  private static async updatePathPhotoMap(directoryTreeObject: DirectoryTree): Promise<void> {
    this.addPathPhotoMapElements(directoryTreeObject);
    await this.updateExifParserResult(directoryTreeObject);
    await this.processExifParserResult();
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

    const isSupportedExtension = SupportedFilenameExtensions.isSupported(directoryTreeElement.extension);
    if (!isSupportedExtension)
      return;

    const photo = new Photo();
    photo.name = directoryTreeElement.name;
    photo.path = directoryTreeElement.path;
    photo.exifParserResult = null;
    this.pathPhotoMap.set(photo.path, photo);
  }

  private static async updateExifParserResult(directoryTreeObject: DirectoryTree) {
    const pathExifPairs = await ExifFetcher.generatePathExifPairs(directoryTreeObject)
      .catch(reason => {
        Logger.error(`Something went wrong in ExifFetcher.generatePathExifPairs(directoryTreeObject) : `, directoryTreeObject, reason);
        return [];
      });

    pathExifPairs.forEach(pair => {
      const photo = this.pathPhotoMap.get(pair.path);
      photo.exifParserResult = pair.exifParserResult;
    });
  }

  private static async processExifParserResult() {
    const pathPhotoArray = Array.from(this.pathPhotoMap);
    const promiseArray = pathPhotoArray.map(async ([path, photo]) => await this.updatePhotoFromExifParserResult(photo));
    await Promise.all(promiseArray);
  }

  private static async updatePhotoFromExifParserResult(photo: Photo) {
    const exifParserResult = photo.exifParserResult;

    if (!exifParserResult)
      return;

    if (exifParserResult.imageSize) {
      photo.dimensions = new Dimensions(exifParserResult.imageSize.width, exifParserResult.imageSize.height);
    }

    if (exifParserResult.tags && exifParserResult.tags.GPSLatitude && exifParserResult.tags.GPSLongitude) {
      const gpsInfo = new GpsInfo();
      gpsInfo.latLng = new LatLng(exifParserResult.tags.GPSLatitude, exifParserResult.tags.GPSLongitude);
      photo.gpsInfo = gpsInfo;
    }

    photo.thumbnail = await Thumbnail.create(photo);
    photo.dateTimeTaken = PhotoDateTimeTakenGenerator.generate(photo);
  }
}
