import * as fs from 'fs';
import { Injectable } from '@angular/core';
import * as exifParser from 'exif-parser';
import { Logger } from '../../../src-shared/log/logger';
import { Photo } from './photo.model';

@Injectable({
  providedIn: 'root'
})
export class PhotoDataService {
  private pathPhotoMap: Map<string, Photo> = new Map<string, Photo>();

  public update(directoryTreeObject: DirectoryTree): void {
    this.pathPhotoMap.clear();
    this.updatePathPhotoMap(directoryTreeObject);
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

  private addPathPhotoMapIfAppropriate(directoryTreeObject: DirectoryTree) {
    const isDirectory = directoryTreeObject.type === 'directory';
    if (isDirectory)
      return;

    const isSupportedExtension = this.isSupportedExtension(directoryTreeObject.extension);
    if (!isSupportedExtension)
      return;

    const photo = new Photo();
    photo.name = directoryTreeObject.name;
    photo.path = directoryTreeObject.path;

    const exif = this.parseExifFromFile(photo.path);
    photo.exifParserResult = exif;

    this.pathPhotoMap.set(photo.path, photo);
  }

  private isSupportedExtension(extension: string) {
    const jpegExtensions = ['.jpeg', '.jpg', '.jpe', '.jfif', '.jfi', '.jif'];
    const isSupportedExtension = jpegExtensions.includes(extension);
    return isSupportedExtension;
  }

  private parseExifFromFile(path: string): ExifParserResult | null {
    const buffer = fs.readFileSync(path);
    try {
      const result: ExifParserResult = exifParser.create(buffer).parse();
      Logger.info(`Fetched EXIF from ${path} `, result);
      return result;
    } catch (error) {
      Logger.warn(`Failed to fetch EXIF from ${path} `, error);
      return null;
    }
  }
}
