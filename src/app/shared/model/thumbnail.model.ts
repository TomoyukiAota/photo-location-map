import DepreciatedJimp from 'jimp';
const Jimp: DepreciatedJimp = window.require('jimp');

import { Logger } from '../../../../src-shared/log/logger';
import { Photo } from './photo.model';
import { Dimensions } from './dimensions.model';
import * as imageRotator from './../image-rotator';

export class Thumbnail {
  private constructor(public readonly dataUrl: string,
                      public readonly dimensions: Dimensions) {
  }

  public static async create(photo: Photo): Promise<Thumbnail> {
    const exif = photo.exifParserResult;
    const thumbnailGenerationRequired = !exif || !(exif.hasThumbnail('image/jpeg'));
    const dataUrl = thumbnailGenerationRequired
      ? await this.createDataUrlFromFile(photo)
      : await this.createDataUrlFromExif(exif);

    if (!dataUrl)
      return null;

    const rotated = await imageRotator.correctRotation(dataUrl, exif.tags.Orientation);
    const rotatedDimensions = new Dimensions(rotated.width, rotated.height);
    return new Thumbnail(rotated.dataUrl, rotatedDimensions);
  }

  private static async createDataUrlFromExif(exif): Promise<string> {
    const buffer = exif.getThumbnailBuffer();
    const base64String = btoa(String.fromCharCode.apply(null, buffer));
    const dataUrl = `data:image/jpg;base64,${base64String}`;
    return dataUrl;
  }

  private static async createDataUrlFromFile(photo: Photo): Promise<string | null> {
    try {
      Logger.info(`Thumbnail generation started for "${photo.path}"`);
      const image = await Jimp.read(photo.path);
      const mimeType = image.getMIME();
      const dataUrl = await image.resize(100, Jimp.AUTO).getBase64Async(mimeType);
      Logger.info(`Thumbnail generation completed for "${photo.path}"`);
      return dataUrl;
    } catch (error) {
      Logger.error(`Error occurred in thumbnail generation for "${photo.path}", error: "${error}"`);
      return null;
    }
  }
}
