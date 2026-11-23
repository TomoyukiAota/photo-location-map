import assert from 'assert';
import type { HeifTransformations } from '../../../../src-shared/heif/heif-images.js';
import { readWholeImage } from '../../../../src-main/heif/heif-file.js';
import { decodeWholeImage, pageDecodesHevc } from '../../../../src/app/heif-thumbnail/heif-image-decoding.js';
import { repositoryPath } from '../../../test-util/repository.js';

// One grey, 200 of 255, 1100x700 in a grid of 3x2 tiles of 512x512, written by ImageIO (test/e2e/fixtures/README.md).
// At 400 pixels, the edges between its tiles fall within pixels of the thumbnail, where they showed as lines 15 to 25%
// darker, and its bottom within the last row, which showed what the tiles hold past the image.
const uniformTiles = repositoryPath('test', 'e2e', 'fixtures', 'uniform-tiles.heic');
/**
 * How far a pixel of the thumbnail may be from the photo's grey, and from the thumbnail's own: the rounding of the
 * colour conversion and of JPEG. On an Apple M5, every pixel was 199.
 */
const tolerance = 2;

/** The pixels of a JPEG, as RGBA. */
async function pixelsOf(jpeg: Blob): Promise<ImageData> {
  const bitmap = await createImageBitmap(jpeg);
  try {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext('2d');
    context.drawImage(bitmap, 0, 0);
    return context.getImageData(0, 0, bitmap.width, bitmap.height);
  } finally {
    bitmap.close();
  }
}

/** The grey of most of the image's pixels. */
function greyOf(image: ImageData): number {
  const counts = new Array<number>(256).fill(0);
  for (let offset = 0; offset < image.data.length; offset += 4)
    counts[image.data[offset + 1]]++;
  return counts.indexOf(Math.max(...counts));
}

/** The pixels that are not of the grey: how many, and the columns and rows that are lines of them. */
function pixelsApart(image: ImageData, grey: number): { count: number, lines: string[] } {
  const columns = new Array<number>(image.width).fill(0);
  const rows = new Array<number>(image.height).fill(0);
  let count = 0;
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const offset = (y * image.width + x) * 4;
      if ([0, 1, 2].some(channel => Math.abs(image.data[offset + channel] - grey) > tolerance)) {
        count++;
        columns[x]++;
        rows[y]++;
      }
    }
  }
  const lines = [
    ...columns.flatMap((apart, x) => apart > image.height / 2 ? [`column ${x}`] : []),
    ...rows.flatMap((apart, y) => apart > image.width / 2 ? [`row ${y}`] : []),
  ];
  return { count, lines };
}

describe('decodeWholeImage', function () {
  before(async function () {
    // Chromium decodes HEVC only with the platform's decoder: not on Linux, nor on a Windows PC without a graphics
    // adapter that decodes it, such as the runners of CI, where the main process makes the thumbnails instead.
    if (!await pageDecodesHevc())
      this.skip();
  });

  const transformations: Array<Omit<HeifTransformations, 'crop'>> = [
    { rotation: 0 }, { rotation: 90 }, { rotation: 180 }, { rotation: 270 }, { rotation: 0, mirror: 0 },
    { rotation: 90, mirror: 1 },
  ];
  for (const transformation of transformations) {
    it(`draws the tiles with no line between them or along the edges, ${JSON.stringify(transformation)}`, async () => {
      const image = { ...await readWholeImage(uniformTiles), ...transformation };
      const pixels = await pixelsOf(await decodeWholeImage(image, 400));
      const sideways = transformation.rotation === 90 || transformation.rotation === 270;
      assert.deepStrictEqual([pixels.width, pixels.height], sideways ? [255, 400] : [400, 255]);
      const grey = greyOf(pixels);
      assert(Math.abs(grey - 200) <= tolerance, `The thumbnail is ${grey} of 255, not the photo's 200.`);
      assert.deepStrictEqual(pixelsApart(pixels, grey), { count: 0, lines: [] });
    });
  }

  it('makes the image at the longer side that it is given, the size that the settings choose', async () => {
    const image = await readWholeImage(uniformTiles);
    for (const [longerSide, height] of [[400, 255], [1000, 636]]) {
      const pixels = await pixelsOf(await decodeWholeImage(image, longerSide));
      assert.deepStrictEqual([pixels.width, pixels.height], [longerSide, height]);
    }
  });
});
