import type { HeifTransformations } from '../../src-shared/heif/heif-images.js';

/** An image as RGBA bytes, four per pixel, row by row. */
export interface RgbaImage {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8Array | Uint8ClampedArray;
}

/**
 * The part of a decoded picture that is the image, turned and mirrored as a HEIF file has it: cropped to `crop`, turned
 * anti-clockwise by `rotation` degrees, then mirrored about a vertical (0) or horizontal (1) axis.
 */
export function transformRgba(picture: RgbaImage, transformations: HeifTransformations): RgbaImage {
  const { crop, rotation, mirror } = transformations;
  if (crop.x < 0 || crop.y < 0 || crop.x + crop.width > picture.width || crop.y + crop.height > picture.height)
    throw new Error(`The crop ${JSON.stringify(crop)} is not within a picture of ${picture.width}x${picture.height}.`);
  const turned = rotation === 90 || rotation === 270;
  const width = turned ? crop.height : crop.width;
  const height = turned ? crop.width : crop.height;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Where the output's pixel was before the mirroring, then before the turn.
      const mx = mirror === 0 ? width - 1 - x : x;
      const my = mirror === 1 ? height - 1 - y : y;
      let sx: number, sy: number;
      switch (rotation) {
        case 90: sx = crop.width - 1 - my; sy = mx; break;
        case 180: sx = crop.width - 1 - mx; sy = crop.height - 1 - my; break;
        case 270: sx = my; sy = crop.height - 1 - mx; break;
        default: sx = mx; sy = my; break;
      }
      const from = ((crop.y + sy) * picture.width + crop.x + sx) * 4;
      const to = (y * width + x) * 4;
      data[to] = picture.data[from];
      data[to + 1] = picture.data[from + 1];
      data[to + 2] = picture.data[from + 2];
      data[to + 3] = picture.data[from + 3];
    }
  }
  return { width, height, data };
}
