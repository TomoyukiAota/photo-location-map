import { Dimensions } from './model/dimensions.model.js';
import { Exif } from './model/exif.model.js';

/**
 * How many times as long as its shorter side a shape's longer side is at least, for the shape to be landscape or
 * portrait rather than square (isExifThumbnailOnItsSide).
 */
const leastRatioOfLandscapeOrPortrait = 1.1;

/** Which way a shape lies: 1 where it is landscape, -1 where it is portrait, and 0 where it is square or nearly. */
function lieOf({ width, height }: Dimensions): number {
  if (!(width > 0 && height > 0))
    return 0;
  // A quotient, which is 1.1 itself for sides of 11 to 10: 10 * 1.1 is a little more than 11.
  if (width / height >= leastRatioOfLandscapeOrPortrait)
    return 1;
  return height / width >= leastRatioOfLandscapeOrPortrait ? -1 : 0;
}

/**
 * Whether the thumbnail in a photo's EXIF data lies on its side against the photo, as both are shown, turned as the
 * photo's orientation says: one of them is landscape, and the other portrait. The app then makes the photo's thumbnail
 * as it does of a photo without an EXIF thumbnail (hasUsableExifThumbnail in
 * src/app/jpeg-png-thumbnail/jpeg-png-thumbnail.service.ts).
 * TL;DR: An app that turns a photo's pixels, rather than its orientation, can leave the photo's thumbnail as it was,
 * which then shows the photo on its side: Windows Photo Viewer of Windows 7 did, as in
 * test/test-resources/actual-photos/Unga/IMG_2581.JPG, whose pixels stand portrait at the orientation 1, while its
 * thumbnail is still the landscape one of before. Nothing says which way such a thumbnail is to be turned, so it is not
 * shown, rather than turned.
 * Details:
 * - The photo's shape is that of its pixels, turned as the photo is (exif.imageDimensions): for a JPEG, the size in
 *   its frame header, which the main process reads with its EXIF data (jpegFrameSize in
 *   src-shared/jpeg/jpeg-segments.ts); for another photo, the size in its EXIF data, PixelXDimension and
 *   PixelYDimension. An app that turns the pixels may leave that size as it was: Windows Photo Viewer wrote it anew,
 *   but a JPEG whose app did not is found by its frame. The thumbnail's shape is the size that it is shown at, turned
 *   so too (createThumbnail() in exif-fetcher/using-exifr/fetch-exif-using-exifr.ts). A photo of which neither size is
 *   known keeps its thumbnail, as before.
 * - A shape is landscape or portrait only where its longer side is at least 1.1 times as long as its shorter one. A
 *   square shape, or one nearly square, as a square photo's thumbnail can be a pixel off, says nothing of how the other
 *   is turned. Photos that are not square are 7:6 (1.17) or longer, as 5:4, 4:3, 3:2 and 16:9 are.
 * - A thumbnail that shows the photo upright between bars, in the other shape, as one of 160 x 120 would hold a
 *   portrait photo, counts as on its side too, as only the shapes are compared. The app then makes one of the photo, as
 *   High quality does of a thumbnail of 160 pixels anyway: that costs its making at Fast, and shows nothing wrong.
 */
export function isExifThumbnailOnItsSide(exif: Exif | null | undefined): boolean {
  const thumbnail = exif?.thumbnail?.dimensions;
  const photo = exif?.imageDimensions;
  return !!thumbnail && !!photo && lieOf(thumbnail) * lieOf(photo) === -1;
}
