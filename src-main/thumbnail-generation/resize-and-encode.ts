import { Jimp, Bitmap } from 'jimp';
import jpegJs from 'jpeg-js';

/**
 * The image of `bitmap` as a JPEG of `quality` (0 to 100), at most `longerSide` pixels on its longer side: twice the
 * CSS pixels of the box that shows it (src-shared/user-settings/thumbnail-size.ts).
 */
export function resizeAndEncode(bitmap: Bitmap, quality: number, longerSide = 400) {
  // The bitmap constructor preserves Buffer view offsets; fromBitmap 1.6 does not.
  const image = new Jimp(bitmap);
  image.scaleToFit({ w: longerSide, h: longerSide });
  const { data, width, height } = image.bitmap;
  return jpegJs.encode({ data, width, height }, quality);
}
