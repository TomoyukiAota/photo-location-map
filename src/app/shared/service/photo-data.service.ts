import { Injectable, signal } from '@angular/core';
import { GpsInfo } from '../model/gps-info.model';
import { Photo } from '../model/photo.model';
import { PathPhotoMapCreator } from '../path-photo-map-creator';

@Injectable({
  providedIn: 'root'
})
export class PhotoDataService {
  private pathPhotoMap: Map<string, Photo> = new Map<string, Photo>();
  private readonly photosState = signal<readonly Photo[]>([]);
  /** The photos of the opened folder, for views that derive what they show from them. */
  public readonly photos = this.photosState.asReadonly();

  public async update(directoryTreeObject: DirectoryTree): Promise<void> {
    this.pathPhotoMap = await PathPhotoMapCreator.create(directoryTreeObject);
    this.photosState.set(Array.from(this.pathPhotoMap.values()));
  }

  public getPhoto(path: string): Photo {
    const photo = this.pathPhotoMap.get(path);
    return !!photo ? photo : null;
  }

  public getGpsInfo(path: string): GpsInfo {
    const photo = this.pathPhotoMap.get(path);
    if (!photo || !photo.exif || !photo.exif.gpsInfo)
      return null;

    return photo.exif.gpsInfo;
  }

  public getAllPhotos(): Photo[] {
    return Array.from(this.pathPhotoMap.values());
  }

  public getPhotosWithGpsInfo(): Photo[] {
    return this.getAllPhotos().filter(photo => !!this.getGpsInfo(photo.path));
  }

  public getPhotoPathsWithGpsInfo(): string[] {
    return this.getPhotosWithGpsInfo().map(photo => photo.path);
  }
}
