import { Dimensions } from './model/dimensions.model';

export class CorrectRotationResult {
  public dataUrl: string;
  public dimensions: Dimensions;
}

/**
 * Correct rotation of an image using EXIF orientation
 * @param {string} dataUrl Data URL of the image to correct rotation
 * @param {number} orientation EXIF orientation
 * @returns {Promise<CorrectRotationResult>} Data URL, width, and height of the rotated image
 */
export function correctRotation(dataUrl: string, orientation: number): Promise<CorrectRotationResult> {
  return new Promise(resolve => {
    const img = new Image();

    img.onload = function () {
      const srcWidth = img.width;
      const srcHeight = img.height;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const rotatedSize = getRotatedSize(srcWidth, srcHeight, orientation);
      canvas.width = rotatedSize.width;
      canvas.height = rotatedSize.height;

      // transform context according to the specified orientation
      switch (orientation) {
        case 2: ctx.transform(-1, 0, 0, 1, srcWidth, 0); break;
        case 3: ctx.transform(-1, 0, 0, -1, srcWidth, srcHeight); break;
        case 4: ctx.transform(1, 0, 0, -1, 0, srcHeight); break;
        case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
        case 6: ctx.transform(0, 1, -1, 0, srcHeight, 0); break;
        case 7: ctx.transform(0, -1, -1, 0, srcHeight, srcWidth); break;
        case 8: ctx.transform(0, -1, 1, 0, 0, srcWidth); break;
        default: break;
      }

      ctx.drawImage(img, 0, 0);

      const result = new CorrectRotationResult();
      result.dataUrl = canvas.toDataURL();
      result.dimensions = new Dimensions(canvas.width, canvas.height);
      resolve(result);
    };

    img.src = dataUrl;
  });
}

/**
 * Get rotated width and height using EXIF orientation.
 * @param {number} srcWidth width to rotate
 * @param {number} srcHeight height to rotate
 * @param {number} orientation EXIF orientation
 */
export function getRotatedSize(srcWidth: number, srcHeight: number, orientation: number): { width: number, height: number } {
  let dstWidth, dstHeight;
  if (4 < orientation && orientation < 9) {
    // noinspection JSSuspiciousNameCombination
    dstWidth = srcHeight;
    // noinspection JSSuspiciousNameCombination
    dstHeight = srcWidth;
  } else {
    dstWidth = srcWidth;
    dstHeight = srcHeight;
  }
  return {
    width: dstWidth,
    height: dstHeight
  };
}
