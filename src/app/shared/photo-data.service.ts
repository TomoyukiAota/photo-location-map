import { Injectable } from '@angular/core';
import { Logger } from '../../../src-shared/log/logger';
import { Photo } from './photo.model';
import { ExifFetcher } from './exif-fetcher';
import { SupportedFilenameExtensions } from './supported-filename-extensions';

@Injectable({
  providedIn: 'root'
})
export class PhotoDataService {
  private readonly pathPhotoMap: Map<string, Photo> = new Map<string, Photo>();

  public async update(directoryTreeObject: DirectoryTree): Promise<void> {
    this.pathPhotoMap.clear();
    this.updatePathPhotoMap(directoryTreeObject);

    const pathExifPairs = await ExifFetcher.generatePathExifPairs(directoryTreeObject)
      .catch(reason => {
        Logger.error(`Something went wrong in ExifFetcher.generatePathExifPairs(directoryTreeObject) : `, directoryTreeObject, reason);
        return [];
      });

    pathExifPairs.forEach(pair => {
      const photo = this.pathPhotoMap.get(pair.path);
      photo.exifParserResult = pair.exifParserResult;
    });

    Logger.info(`Fetched path-photo map: `, this.pathPhotoMap);
  }

  public getExif(path: string) {
    const photo = this.pathPhotoMap.get(path);
    if (!photo)
      return null;

    // TODO: Return photo.exif if available. If not, return null.
    return true;
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
}
