import * as fs from 'fs';
import { Injectable } from '@angular/core';
import * as exifParser from 'exif-parser';
import { Logger } from '../../../src-shared/log/logger';
import { Photo } from './photo.model';

class PathExifParserResultPair {
  constructor(public path: string,
              public exifParserResult: ExifParserResult) {
  }
}

@Injectable({
  providedIn: 'root'
})
export class PhotoDataService {
  private readonly pathPhotoMap: Map<string, Photo> = new Map<string, Photo>();
  private readonly pathExifParserResultPairs: PathExifParserResultPair[] = [];
  private readonly exifParserResultPromises: Promise<ExifParserResult>[] = [];

  public async update(directoryTreeObject: DirectoryTree): Promise<void> {
    this.pathPhotoMap.clear();
    this.pathExifParserResultPairs.length = 0;
    this.exifParserResultPromises.length = 0;

    this.updatePathPhotoMap(directoryTreeObject);
    await Promise.all(this.exifParserResultPromises);
    this.pathExifParserResultPairs.forEach(pair => {
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

    const isSupportedExtension = this.isSupportedExtension(directoryTreeElement.extension);
    if (!isSupportedExtension)
      return;

    this.addPromiseToFetchExif(directoryTreeElement);
    const photo = new Photo();
    photo.name = directoryTreeElement.name;
    photo.path = directoryTreeElement.path;
    photo.exifParserResult = null;
    this.pathPhotoMap.set(photo.path, photo);
  }

  private isSupportedExtension(extension: string) {
    const jpegExtensions = ['.jpeg', '.jpg', '.jpe', '.jfif', '.jfi', '.jif'];
    const isSupportedExtension = jpegExtensions.includes(extension);
    return isSupportedExtension;
  }

  private addPromiseToFetchExif(directoryTreeElement: DirectoryTree) {
    const promise = this.instantiatePromiseToFetchExif(directoryTreeElement)
      .then(exifParserResult => {
        this.pathExifParserResultPairs.push(
          new PathExifParserResultPair(
            directoryTreeElement.path,
            exifParserResult
          )
        );
        return exifParserResult;
      })
      .catch(() => {
        this.pathExifParserResultPairs.push(
          new PathExifParserResultPair(
            directoryTreeElement.path,
            null
          )
        );
        return null;
      });

    this.exifParserResultPromises.push(promise);
  }

  private instantiatePromiseToFetchExif(directoryTreeElement: DirectoryTree): Promise<ExifParserResult> {
    return new Promise((resolve, reject) => {
      let exif: ExifParserResult = null;
      const bufferLengthRequiredToParseExif = 65635;
      const readStream = fs.createReadStream(
        directoryTreeElement.path,
        {start: 0, end: bufferLengthRequiredToParseExif - 1});

      readStream.on('readable', () => {
        let buffer;
        while (null !== (buffer = readStream.read(bufferLengthRequiredToParseExif))) {
          Logger.info(`Fetched ${buffer.length} bytes from ${directoryTreeElement.path}`);
          try {
            exif = exifParser.create(buffer).parse();
            Logger.info(`Fetched EXIF of ${directoryTreeElement.path} `, exif);
          } catch (error) {
            Logger.warn(`Failed to fetch EXIF of ${directoryTreeElement.path} `, error);
          }
        }
      });

      readStream.on('end', () => {
        if (exif) {
          resolve(exif);
        } else {
          reject();
        }
      });

      readStream.on('error', error => {
        Logger.warn(`An error occurred when fetching data from ${directoryTreeElement.path} `, error);
        reject(error);
      });
    });
  }
}
