/**
 * The quality of the thumbnails, which the Thumbnails tab of the Settings dialog chooses:
 * - 'high': made from the whole photo, at the size that the settings choose (thumbnail-size.ts), 400 pixels on the
 *   longer side by default, as the app made them before it had a choice. A thumbnail that the photo holds is not
 *   stretched to the place that shows it: where it is smaller than that size, one is made from the photo, and the
 *   small one is shown until then. A JPEG's EXIF thumbnail is 160 x 120 from most cameras and phones, and a HEIF
 *   photo's thumbnail item 320 x 240 from an iPhone of 12 megapixels.
 * - 'fast': the thumbnails that the photos hold, shown right away, in the place of a thumbnail of 400 pixels; one of
 *   400 pixels is made only of a photo that holds none.
 * TL;DR: High quality by default, which the owner chose: the faster one is offered where the making is seen to take
 * time, the status bar of the generation of thumbnails.
 */
export type ThumbnailQuality = 'high' | 'fast';

export const thumbnailQualities: readonly ThumbnailQuality[] = ['high', 'fast'];
export const defaultThumbnailQuality: ThumbnailQuality = 'high';

export function isThumbnailQuality(value: unknown): value is ThumbnailQuality {
  return thumbnailQualities.includes(value as ThumbnailQuality);
}
