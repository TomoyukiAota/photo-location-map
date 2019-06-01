import { Injectable } from '@angular/core';
import { Logger } from '../../../../src-shared/log/logger';
import { GpsInfo } from '../model/gps-info.model';
import { Photo } from '../model/photo.model';
import { ExifFetcher } from '../exif-fetcher';
import { SupportedFilenameExtensions } from '../supported-filename-extensions';

@Injectable({
  providedIn: 'root'
})
export class PhotoDataService {
  private readonly pathPhotoMap: Map<string, Photo> = new Map<string, Photo>();

  public async update(directoryTreeObject: DirectoryTree): Promise<void> {
    this.pathPhotoMap.clear();
    this.updatePathPhotoMap(directoryTreeObject);
    await this.updateExifParserResult(directoryTreeObject);
    this.processExifParserResult();
    Logger.info(`Updated path-photo map: `, this.pathPhotoMap);
  }

  private updatePathPhotoMap(directoryTreeObject: DirectoryTree) {
    this.addPathPhotoMapIfAppropriate(directoryTreeObject);
    if (directoryTreeObject.children) {
      directoryTreeObject.children.forEach(child => this.updatePathPhotoMap(child));
    }
  }

  private addPathPhotoMapIfAppropriate(directoryTreeElement: DirectoryTree) {
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

  private async updateExifParserResult(directoryTreeObject: DirectoryTree) {
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

  private processExifParserResult() {
    this.pathPhotoMap.forEach((photo, path, map) => {
      const exifParserResult = photo.exifParserResult;
      if (exifParserResult && exifParserResult.tags && exifParserResult.tags.GPSLatitude && exifParserResult.tags.GPSLongitude) {
        const gpsInfo = new GpsInfo();
        gpsInfo.gpsLatitude = exifParserResult.tags.GPSLatitude;
        gpsInfo.gpsLongitude = exifParserResult.tags.GPSLongitude;
        photo.gpsInfo = gpsInfo;
      }
    });
  }

  public getPhoto(path: string) {
    const photo = this.pathPhotoMap.get(path);
    return !!photo ? photo : null;
  }

  public getExifParserResult(path: string) {
    const photo = this.pathPhotoMap.get(path);
    if (!photo || !photo.exifParserResult)
      return null;

    return photo.exifParserResult;
  }

  public getGpsInfo(path: string) {
    const photo = this.pathPhotoMap.get(path);
    if (!photo || !photo.gpsInfo)
      return null;

    return photo.gpsInfo;
  }
}
