/**
 * The quality of the thumbnails of HEIF photos, which the Thumbnails tab of the Settings dialog chooses
 * (src/app/heif-thumbnail/heif-thumbnail.service.ts):
 * - 'high': made from the whole photo, 400 pixels on the longer side, as the app made them before it had a choice;
 *   the small thumbnail that the file holds is shown until then.
 * - 'fast': that small thumbnail: 320x240 for an iPhone's photo of 12 megapixels, 416x312 for 24, 576x432 for 48.
 * TL;DR: High quality by default, which the owner chose: the faster one is offered where the making is seen to take
 * time, the status bar of the generation of thumbnails.
 */
export type ThumbnailQuality = 'high' | 'fast';

export const thumbnailQualities: readonly ThumbnailQuality[] = ['high', 'fast'];
export const defaultThumbnailQuality: ThumbnailQuality = 'high';

export function isThumbnailQuality(value: unknown): value is ThumbnailQuality {
  return thumbnailQualities.includes(value as ThumbnailQuality);
}
