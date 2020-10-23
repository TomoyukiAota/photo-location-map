import { Thumbnail } from '../../model/thumbnail.model';
import { correctRotation } from '../../image-rotation';


export async function createThumbnail(exifParserResult: ExifParserResult): Promise<Thumbnail> {
  const isThumbnailAvailableInExif = exifParserResult && exifParserResult.hasThumbnail('image/jpeg');
  if (!isThumbnailAvailableInExif) {
    return null;
  }

  const dataUrl = createDataUrlFromExif(exifParserResult);
  const rotated = await correctRotation(dataUrl, exifParserResult.tags.Orientation);
  return new Thumbnail(rotated.dataUrl, rotated.dimensions);
}

function createDataUrlFromExif(exifParserResult: ExifParserResult): string {
  const buffer = exifParserResult.getThumbnailBuffer();
  const base64String = btoa(String.fromCharCode.apply(null, buffer));
  const dataUrl = `data:image/jpg;base64,${base64String}`;
  return dataUrl;
}
