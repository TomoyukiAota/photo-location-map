import * as allSettled from 'promise.allsettled';
import { FilenameExtension } from '../../../src-shared/filename-extension/filename-extension';
import { Logger } from '../../../src-shared/log/logger';
import { Exif } from './model/exif.model';
import { Dimensions } from './model/dimensions.model';
import { GpsInfo } from './model/gps-info.model';
import { LatLng } from './model/lat-lng.model';
import { Photo } from './model/photo.model';
import { createThumbnail } from './create-thumbnail-from-exif-parser-result';
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
    await this.updatePhotosWithExifUsingExifParserResult(directoryTreeObject);
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

  private static async updatePhotosWithExifUsingExifParserResult(directoryTreeObject: DirectoryTree) {
    const pathExifPairs = await ExifFetcher.generatePathExifPairs(directoryTreeObject)
      .catch(reason => {
        Logger.error(`Something went wrong in ExifFetcher.generatePathExifPairs(directoryTreeObject) : `, directoryTreeObject, reason);
        return [];
      });

    const arrayFromPathExifPairs = Array.from(pathExifPairs);
    const promiseArray = arrayFromPathExifPairs.map(pair => this.updateEachPhotoWithExifUsingExifParserResult(pair));
    await allSettled(promiseArray);
  }

  private static async updateEachPhotoWithExifUsingExifParserResult(pair: PathExifPair) {
    const exifParserResult: ExifParserResult = pair.exifParserResult;

    if (!exifParserResult)
      return;

    const exif = new Exif();

    if (exifParserResult.tags && exifParserResult.tags.DateTimeOriginal) {
      exif.dateTimeOriginal = exifParserResult.tags.DateTimeOriginal;
    }

    if (exifParserResult.imageSize) {
      exif.imageDimensions = new Dimensions(exifParserResult.imageSize.width, exifParserResult.imageSize.height);
    }

    if (exifParserResult.tags && exifParserResult.tags.GPSLatitude && exifParserResult.tags.GPSLongitude) {
      const gpsInfo = new GpsInfo();
      gpsInfo.latLng = new LatLng(exifParserResult.tags.GPSLatitude, exifParserResult.tags.GPSLongitude);
      exif.gpsInfo = gpsInfo;
    }

    exif.thumbnail = await createThumbnail(exifParserResult);

    const photo = this.pathPhotoMap.get(pair.path);
    photo.exif = exif;
  }
}
