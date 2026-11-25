import { isExifThumbnailOnItsSide } from './exif-thumbnail-on-its-side.js';
import { Dimensions } from './model/dimensions.model.js';
import { Exif } from './model/exif.model.js';
import { Thumbnail } from './model/thumbnail.model.js';

/** EXIF data with the photo's size and the thumbnail's, as each is shown, turned as the photo is; or without either. */
function exifOf(photo: [number, number] | null, thumbnail: [number, number] | null): Exif {
  return {
    imageDimensions: photo ? new Dimensions(...photo) : undefined,
    thumbnail: thumbnail ? new Thumbnail('blob:thumbnail', new Dimensions(...thumbnail)) : undefined,
  } as Exif;
}

describe('isExifThumbnailOnItsSide', () => {
  it('is true of a landscape thumbnail of a portrait photo, and of a portrait thumbnail of a landscape photo', () => {
    // Windows Photo Viewer turned the pixels of test/test-resources/actual-photos/Unga/IMG_2581.JPG, and left its
    // thumbnail as it was.
    expect(isExifThumbnailOnItsSide(exifOf([2448, 3264], [160, 120]))).toBe(true);
    expect(isExifThumbnailOnItsSide(exifOf([4032, 3024], [120, 160]))).toBe(true);
    expect(isExifThumbnailOnItsSide(exifOf([1080, 1920], [512, 384]))).toBe(true);
  });

  it('is false of a thumbnail that lies as the photo does', () => {
    expect(isExifThumbnailOnItsSide(exifOf([4032, 3024], [160, 120]))).toBe(false);
    // A camera's portrait photo, whose orientation turns its thumbnail as it turns the photo.
    expect(isExifThumbnailOnItsSide(exifOf([3024, 4032], [120, 160]))).toBe(false);
    // A camera's thumbnail of 4:3 has bars above and below a photo of 16:9.
    expect(isExifThumbnailOnItsSide(exifOf([1920, 1080], [160, 120]))).toBe(false);
  });

  it('is false where either is square, or nearly, which says nothing of how the other is turned', () => {
    expect(isExifThumbnailOnItsSide(exifOf([3024, 3024], [160, 120]))).toBe(false);
    expect(isExifThumbnailOnItsSide(exifOf([2448, 3264], [160, 160]))).toBe(false);
    expect(isExifThumbnailOnItsSide(exifOf([3024, 3025], [160, 159]))).toBe(false);
    // Less than a tenth longer on one side than on the other.
    expect(isExifThumbnailOnItsSide(exifOf([2448, 3264], [160, 146]))).toBe(false);
    expect(isExifThumbnailOnItsSide(exifOf([3000, 3290], [160, 120]))).toBe(false);
    // A tenth longer, or more, as 7:6 is, the squarest shape of the photos that are not square.
    expect(isExifThumbnailOnItsSide(exifOf([2448, 3264], [110, 100]))).toBe(true);
    expect(isExifThumbnailOnItsSide(exifOf([3000, 3300], [160, 120]))).toBe(true);
    expect(isExifThumbnailOnItsSide(exifOf([6000, 7000], [160, 137]))).toBe(true);
  });

  it('is false where the EXIF data have no size of the photo, no thumbnail or no EXIF data at all, as before', () => {
    expect(isExifThumbnailOnItsSide(exifOf(null, [160, 120]))).toBe(false);
    expect(isExifThumbnailOnItsSide(exifOf([2448, 3264], null))).toBe(false);
    expect(isExifThumbnailOnItsSide(exifOf([0, 0], [160, 120]))).toBe(false);
    expect(isExifThumbnailOnItsSide(exifOf([2448, 3264], [0, 0]))).toBe(false);
    expect(isExifThumbnailOnItsSide(null)).toBe(false);
    expect(isExifThumbnailOnItsSide(undefined)).toBe(false);
  });
});
