import assert from 'assert';
import * as fs from 'fs';
import { imageTypeOf, makeThumbnailJpeg, thumbnailLongerSide } from '../../../../src/app/jpeg-png-thumbnail/jpeg-png-image-decoding.js';
import { repositoryPath } from '../../../test-util/repository.js';

// The thumbnails that the page makes of JPEG and PNG photos without one in their EXIF data, with Chromium's decoder,
// which only a page has: decoded as Chromium shows the photo, at 400 pixels on the longer side.

/** Photos of 4032x3024 as an iPhone writes them: one turned by its EXIF orientation (6), one not (1). */
const turnedPhoto = repositoryPath('test', 'test-resources', 'actual-photos', 'Apple Park', 'IMG_5769.JPG');
const uprightPhoto = repositoryPath('test', 'test-resources', 'actual-photos', 'Kobe', 'IMG_4676.JPG');

const bytesOf = (filePath: string) => new Uint8Array(fs.readFileSync(filePath));

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

/** The colour of the pixel at x, y, without its alpha. */
function colourAt(image: ImageData, x: number, y: number): number[] {
  const offset = (y * image.width + x) * 4;
  return Array.from(image.data.slice(offset, offset + 3));
}

/** An image drawn by `draw` on a canvas of `width` x `height`, encoded as `type`. */
async function imageFile(width: number, height: number, type: string, draw: (context: OffscreenCanvasRenderingContext2D) => void): Promise<Uint8Array> {
  const canvas = new OffscreenCanvas(width, height);
  draw(canvas.getContext('2d'));
  return new Uint8Array(await (await canvas.convertToBlob({ type, quality: 1 })).arrayBuffer());
}

describe('makeThumbnailJpeg', function () {
  it('makes a JPEG of 400 pixels on the longer side of a photo of 12 megapixels', async () => {
    const jpeg = await makeThumbnailJpeg(bytesOf(uprightPhoto), uprightPhoto);
    assert.strictEqual(jpeg.type, 'image/jpeg');
    const pixels = await pixelsOf(jpeg);
    assert.deepStrictEqual([pixels.width, pixels.height], [thumbnailLongerSide, 300]);
  });

  it('turns the thumbnail as the photo\'s EXIF orientation says, as an img element shows the photo', async () => {
    const pixels = await pixelsOf(await makeThumbnailJpeg(bytesOf(turnedPhoto), turnedPhoto));
    assert.deepStrictEqual([pixels.width, pixels.height], [300, thumbnailLongerSide]);
  });

  it('keeps a photo smaller than a thumbnail at its own size', async () => {
    const small = await imageFile(300, 200, 'image/jpeg', context => {
      context.fillStyle = '#336699';
      context.fillRect(0, 0, 300, 200);
    });
    const pixels = await pixelsOf(await makeThumbnailJpeg(small, '/photos/small.jpg'));
    assert.deepStrictEqual([pixels.width, pixels.height], [300, 200]);
  });

  it('shows what a PNG leaves transparent white, as the page around the thumbnail is, rather than black', async () => {
    // The left half transparent, the right half red.
    const png = await imageFile(800, 600, 'image/png', context => {
      context.fillStyle = '#ff0000';
      context.fillRect(400, 0, 400, 600);
    });
    const pixels = await pixelsOf(await makeThumbnailJpeg(png, '/photos/sticker.png'));
    assert.deepStrictEqual([pixels.width, pixels.height], [400, 300]);
    const [left, right] = [colourAt(pixels, 50, 150), colourAt(pixels, 350, 150)];
    assert(left.every(channel => channel >= 250), `The transparent half is ${left}, not white.`);
    assert(right[0] >= 240 && right[1] <= 15 && right[2] <= 15, `The red half is ${right}.`);
  });

  it('decodes a file by what its bytes are, whatever its name says', async () => {
    assert.strictEqual(imageTypeOf(bytesOf(uprightPhoto), '/photos/named-as.png'), 'image/jpeg');
    const pixels = await pixelsOf(await makeThumbnailJpeg(bytesOf(uprightPhoto), '/photos/named-as.png'));
    assert.deepStrictEqual([pixels.width, pixels.height], [400, 300]);
    const png = await imageFile(10, 10, 'image/png', () => {});
    assert.strictEqual(imageTypeOf(png, '/photos/named-as.jpg'), 'image/png');
    // Neither: by its name.
    assert.strictEqual(imageTypeOf(new Uint8Array([0, 0, 0, 0]), '/photos/a.PNG'), 'image/png');
    assert.strictEqual(imageTypeOf(new Uint8Array([0, 0, 0, 0]), '/photos/a.jpg'), 'image/jpeg');
  });

  it('rejects a photo whose file is cut short, which the decoder refuses', async () => {
    const cutShort = bytesOf(uprightPhoto).slice(0, 2_000_000);
    await assert.rejects(makeThumbnailJpeg(cutShort, uprightPhoto), (error: unknown) => error instanceof DOMException && error.name === 'EncodingError');
  });
});
