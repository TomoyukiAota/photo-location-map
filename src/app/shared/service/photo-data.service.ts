import { Injectable, computed, signal } from '@angular/core';
import { GpsInfo } from '../model/gps-info.model';
import { Photo } from '../model/photo.model';
import { PathPhotoMapCreator } from '../path-photo-map-creator';

@Injectable({
  providedIn: 'root'
})
export class PhotoDataService {
  // The photos of the opened folder by path, in a signal: a template that looks a photo up, such as a node of the
  // tree, renders again when another folder replaces them, before the tree itself is replaced.
  private readonly pathPhotoMap = signal(new Map<string, Photo>());
  /** The photos of the opened folder, for views that derive what they show from them. */
  public readonly photos = computed<readonly Photo[]>(() => Array.from(this.pathPhotoMap().values()));

  public async update(directoryTreeObject: DirectoryTree): Promise<void> {
    this.pathPhotoMap.set(await PathPhotoMapCreator.create(directoryTreeObject));
  }

  public getPhoto(path: string): Photo {
    const photo = this.pathPhotoMap().get(path);
    return !!photo ? photo : null;
  }

  public getGpsInfo(path: string): GpsInfo {
    const photo = this.pathPhotoMap().get(path);
    if (!photo || !photo.exif || !photo.exif.gpsInfo)
      return null;

    return photo.exif.gpsInfo;
  }

  public getAllPhotos(): Photo[] {
    return Array.from(this.pathPhotoMap().values());
  }

  public getPhotosWithGpsInfo(): Photo[] {
    return this.getAllPhotos().filter(photo => !!this.getGpsInfo(photo.path));
  }

  public getPhotoPathsWithGpsInfo(): string[] {
    return this.getPhotosWithGpsInfo().map(photo => photo.path);
  }
}
