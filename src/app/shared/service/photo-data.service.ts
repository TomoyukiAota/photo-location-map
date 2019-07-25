import { Injectable } from '@angular/core';
import { Photo } from '../model/photo.model';
import { PathPhotoMapCreator } from '../path-photo-map-creator';

@Injectable({
  providedIn: 'root'
})
export class PhotoDataService {
  private pathPhotoMap: Map<string, Photo> = new Map<string, Photo>();

  public async update(directoryTreeObject: DirectoryTree): Promise<void> {
    this.pathPhotoMap = await PathPhotoMapCreator.create(directoryTreeObject);
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
