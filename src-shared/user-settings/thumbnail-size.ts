import type { ThumbnailQuality } from './thumbnail-quality.js';

/**
 * The size of the thumbnails at High quality, which the slider of the Thumbnails tab of the Settings dialog chooses:
 * the longer side of the image that the app makes of a photo, in pixels, from 400 to 1,000 in steps of 100.
 * TL;DR: 400 by default, as the app made them before it had a choice. A place shows a thumbnail at half its size in CSS
 * pixels (thumbnailBoxOf), which a screen of 2 device pixels per CSS pixel shows sharp; a larger size is larger on the
 * screen, and slower to make, as the owner chose (docs/tasks/20261123_thumbnail-size/STATUS.md).
 * Details: Nothing below 400, as a smaller thumbnail is made no faster: decoding the photo takes most of the time,
 * whatever the size. The Fast quality is the choice for speed, which shows the thumbnails that the photos hold.
 */
export const minThumbnailSize = 400;
export const maxThumbnailSize = 1000;
export const thumbnailSizeStep = 100;
export const defaultThumbnailSize = minThumbnailSize;

/** The sizes that can be chosen, from the smallest. */
export const thumbnailSizes: readonly number[] = Array.from(
  { length: (maxThumbnailSize - minThumbnailSize) / thumbnailSizeStep + 1 },
  (_, index) => minThumbnailSize + index * thumbnailSizeStep);

export function isThumbnailSize(value: unknown): value is number {
  return thumbnailSizes.includes(value as number);
}

/** The size that a saved setting holds as text, or undefined when it is no size that can be chosen. */
export function thumbnailSizeOf(text: string): number | undefined {
  const size = /^\d+$/.test(text) ? Number(text) : NaN;
  return isThumbnailSize(size) ? size : undefined;
}

/**
 * The longer side of the thumbnails that the app makes from the photos, by the settings: the chosen size at High
 * quality; 400 at Fast, which makes them only of the photos that hold no thumbnail.
 */
export function madeThumbnailLongerSide(quality: ThumbnailQuality, size: number): number {
  return quality === 'high' ? size : minThumbnailSize;
}

/** The box in which the folder tree and the map's popups show a thumbnail, in CSS pixels: half its longer side. */
export function thumbnailBoxOf(longerSide: number): number {
  return longerSide / 2;
}
