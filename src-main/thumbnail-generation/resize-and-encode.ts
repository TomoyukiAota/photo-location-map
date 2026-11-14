import { Jimp, Bitmap } from 'jimp';
import jpegJs from 'jpeg-js';

export function resizeAndEncode(bitmap: Bitmap, quality: number) {
  // The bitmap constructor preserves Buffer view offsets; fromBitmap 1.6 does not.
  const image = new Jimp(bitmap);
  const thumbnailWidthHeight = 200;
  const highDpiFactor = 2;
  const widthHeight = thumbnailWidthHeight * highDpiFactor;
  image.scaleToFit({ w: widthHeight, h: widthHeight });
  const { data, width, height } = image.bitmap;
  return jpegJs.encode({ data, width, height }, quality);
}
