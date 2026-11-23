import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { bridge } from '../../../../src-shared/bridge/plm-bridge.js';
import { rotateImage } from '../../../../src/app/shared/image-rotation.js';
import { orientedJpeg } from '../../../../src/app/shared/oriented-jpeg.js';
import { ThumbnailObjectUrlStorage } from '../../../../src/app/shared/thumbnail-object-url-storage.js';
import { repositoryPath } from '../../../test-util/repository.js';

type Quarter = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

/** The colour of each quarter of the JPEG that shows where each quarter is shown. */
const quarterColours: Readonly<Record<Quarter, readonly number[]>> = {
  topLeft: [200, 40, 40], topRight: [40, 160, 40], bottomLeft: [40, 40, 200], bottomRight: [220, 200, 40],
};

/**
 * Which quarter of the JPEG each quarter of the image shows, top left, top right, bottom left and bottom right, for
 * each orientation of EXIF: 2 mirrors it, 3 turns it by a half, 4 flips it, 5 mirrors it along its diagonal from the
 * top left, 6 turns it clockwise by a quarter, 7 mirrors it along its other diagonal, and 8 turns it anticlockwise.
 */
const shownQuarters: Readonly<Record<number, readonly Quarter[]>> = {
  1: ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'],
  2: ['topRight', 'topLeft', 'bottomRight', 'bottomLeft'],
  3: ['bottomRight', 'bottomLeft', 'topRight', 'topLeft'],
  4: ['bottomLeft', 'bottomRight', 'topLeft', 'topRight'],
  5: ['topLeft', 'bottomLeft', 'topRight', 'bottomRight'],
  6: ['bottomLeft', 'topLeft', 'bottomRight', 'topRight'],
  7: ['bottomRight', 'topRight', 'bottomLeft', 'topLeft'],
  8: ['topRight', 'bottomRight', 'topLeft', 'bottomLeft'],
};

/** A JPEG of 160x120 in four colours, one for each quarter, as a camera's thumbnail is of 160x120. */
async function jpegOfQuarters(): Promise<Uint8Array> {
  const canvas = new OffscreenCanvas(160, 120);
  const context = canvas.getContext('2d');
  const quarters: [Quarter, number, number][] = [['topLeft', 0, 0], ['topRight', 80, 0], ['bottomLeft', 0, 60], ['bottomRight', 80, 60]];
  for (const [quarter, x, y] of quarters) {
    context.fillStyle = `rgb(${quarterColours[quarter].join(', ')})`;
    context.fillRect(x, y, 80, 60);
  }
  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 1 });
  return new Uint8Array(await blob.arrayBuffer());
}

/** The object URL of the JPEG that orientedJpeg() makes, which must be one. */
function urlOfOrientedJpeg(jpeg: Uint8Array, orientation: number): string {
  const oriented = orientedJpeg(jpeg, orientation);
  assert(oriented, 'orientedJpeg() took the JPEG');
  return URL.createObjectURL(new Blob(oriented.parts as BlobPart[], { type: 'image/jpeg' }));
}

/** An img element that has decoded the image at `url`, as a viewer's does. */
async function decodedImage(url: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = url;
  await image.decode();
  return image;
}

/** The pixels of an image as it is drawn: turned as an img element shows it, for an img element. */
function pixelsOf(image: HTMLImageElement | ImageBitmap): ImageData {
  const width = image instanceof HTMLImageElement ? image.naturalWidth : image.width;
  const height = image instanceof HTMLImageElement ? image.naturalHeight : image.height;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0);
  return context.getImageData(0, 0, width, height);
}

/** The quarter of the JPEG that each quarter of the pixels shows, by its colour at the quarter's middle. */
function quartersShown(pixels: ImageData): Quarter[] {
  const middles = [[1, 1], [3, 1], [1, 3], [3, 3]].map(([x, y]) => [Math.floor(pixels.width * x / 4), Math.floor(pixels.height * y / 4)]);
  return middles.map(([x, y]) => {
    const offset = (y * pixels.width + x) * 4;
    const colour = [0, 1, 2].map(channel => pixels.data[offset + channel]);
    const quarter = (Object.keys(quarterColours) as Quarter[])
      .find(candidate => quarterColours[candidate].every((value, channel) => Math.abs(value - colour[channel]) <= 16));
    assert(quarter, `the colour ${colour.join(', ')} at ${x}, ${y} is one of the quarters'`);
    return quarter;
  });
}

/** The largest difference between two images' values of a channel, which must be of one size. */
function largestDifference(actual: ImageData, expected: ImageData): number {
  assert.deepStrictEqual([actual.width, actual.height], [expected.width, expected.height]);
  let largest = 0;
  for (let offset = 0; offset < actual.data.length; offset++)
    largest = Math.max(largest, Math.abs(actual.data[offset] - expected.data[offset]));
  return largest;
}

describe('orientedJpeg', () => {
  afterEach(() => ThumbnailObjectUrlStorage.revokeObjectUrls());

  it('gives a JPEG that an img element shows turned as each orientation of EXIF says, with its size as shown', async () => {
    const jpeg = await jpegOfQuarters();
    for (const orientation of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const url = urlOfOrientedJpeg(jpeg, orientation);
      const image = await decodedImage(url);
      const expectedSize = orientation > 4 ? [120, 160] : [160, 120];
      assert.deepStrictEqual([image.naturalWidth, image.naturalHeight], expectedSize, `the size of orientation ${orientation}`);
      assert.deepStrictEqual(Object.values(orientedJpeg(jpeg, orientation).dimensions), expectedSize);
      assert.deepStrictEqual(quartersShown(pixelsOf(image)), shownQuarters[orientation], `the quarters of orientation ${orientation}`);
      URL.revokeObjectURL(url);
    }
  });

  // The search for faces decodes a TIFF file's EXIF thumbnail so (decodeForFaceSearch() in src/app/face-search/).
  it('gives a JPEG that createImageBitmap() of its img element turns as the img element does', async () => {
    const jpeg = await jpegOfQuarters();
    for (const orientation of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const url = urlOfOrientedJpeg(jpeg, orientation);
      const bitmap = await createImageBitmap(await decodedImage(url));
      assert.deepStrictEqual(quartersShown(pixelsOf(bitmap)), shownQuarters[orientation], `the quarters of orientation ${orientation}`);
      bitmap.close();
      URL.revokeObjectURL(url);
    }
  });

  it('gives a camera\'s thumbnail as rotateImage() turned it on a canvas, for each orientation', async () => {
    const photos = ['Apple Park/IMG_5769.JPG', 'Gold Coast/IMG_1579.JPG', 'Kobe/IMG_4676.JPG', 'Unga/IMG_2581.JPG']
      .map(photo => repositoryPath('test', 'test-resources', 'actual-photos', ...photo.split('/')));
    for (const photo of photos) {
      assert(fs.existsSync(photo), photo);
      // As the page reads a photo's thumbnail, from the main process (src/app/shared/exif-fetcher/using-exifr/).
      const read = await bridge().exif.read(photo);
      assert(read.parse === 'ok' && read.thumbnail, `${path.basename(photo)} has a thumbnail`);
      const dataUrl = `data:image/jpg;base64,${btoa(String.fromCharCode(...read.thumbnail))}`;
      for (const orientation of [1, 2, 3, 4, 5, 6, 7, 8]) {
        const url = urlOfOrientedJpeg(read.thumbnail, orientation);
        const shown = pixelsOf(await decodedImage(url));
        const onCanvas = pixelsOf(await decodedImage((await rotateImage(dataUrl, orientation)).objectUrl));
        // The same decoder of JPEG, and the same pixels moved: no difference on an Apple M5.
        assert(largestDifference(shown, onCanvas) <= 2, `${path.basename(photo)}, orientation ${orientation}`);
        URL.revokeObjectURL(url);
      }
    }
  });
});
