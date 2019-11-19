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
    const base64String = thumbnailGenerationRequired
      ? await this.createBase64StringFromFile(photo)
      : await this.createBase64StringFromExif(exif);

    if (!base64String)
      return null;

    const dataUrl = `data:image/jpg;base64,${base64String}`;
    const rotated = await imageRotator.correctRotation(dataUrl, exif.tags.Orientation);
    const rotatedDimensions = new Dimensions(rotated.width, rotated.height);
    return new Thumbnail(rotated.dataUrl, rotatedDimensions);
  }

  private static async createBase64StringFromExif(exif): Promise<string> {
    const buffer = exif.getThumbnailBuffer();
    const base64String = btoa(String.fromCharCode.apply(null, buffer));
    return base64String;
  }

  private static async createBase64StringFromFile(photo: Photo): Promise<string | null> {
    try {
      // TODO: get base64 string of shrunk image
      // const base64String: string =
      // console.log(base64String);
      // return base64String;
      return null;
    } catch (err) {
      console.error(err);
      return null;
    }
  }
}
