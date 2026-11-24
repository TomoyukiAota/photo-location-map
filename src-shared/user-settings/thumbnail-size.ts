import type { ThumbnailQuality } from './thumbnail-quality.js';

/**
 * The sizes of the thumbnails at High quality, which the sliders of the Thumbnails tab of the Settings dialog choose,
 * one for the folder tree of the sidebar and one for the popups of the map: the longer side of a thumbnail, in pixels,
 * from 400 to 1,000 in steps of 100.
 * TL;DR: 400 by default, as the app made them before it had a choice. A place shows a thumbnail at half its size in CSS
 * pixels (thumbnailBoxOf), which a screen of 2 device pixels per CSS pixel shows sharp; a larger size is larger on the
 * screen, and slower to make, as the owner chose (docs/tasks/20261123_thumbnail-size/STATUS.md). The app makes one
 * thumbnail of each photo, at the larger of the two sizes (madeThumbnailLongerSide), which the other place shows
 * smaller.
 * Details: Nothing below 400, as a smaller thumbnail is made no faster: decoding the photo takes most of the time,
 * whatever the size. The Fast quality is the choice for speed, which shows the thumbnails that the photos hold, at
 * 400 in both places. A thumbnail made of each photo at each size would take twice the time and the cache.
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

/** The places that have a size of the thumbnails of their own: the folder tree of the sidebar, and the map's popups. */
export const thumbnailSizePlaces = ['sidebar', 'map'] as const;
export type ThumbnailSizePlace = typeof thumbnailSizePlaces[number];
/** The size that the settings choose for each place. */
export type ThumbnailSizes = Readonly<Record<ThumbnailSizePlace, number>>;

/**
 * The longer side of the thumbnails that the app makes from the photos, by the settings: at High quality the larger of
 * the two sizes, as one thumbnail of each photo serves both places; 400 at Fast, which makes them only of the photos
 * that hold no thumbnail.
 */
export function madeThumbnailLongerSide(quality: ThumbnailQuality, sizes: ThumbnailSizes): number {
  return quality === 'high' ? Math.max(sizes.sidebar, sizes.map) : minThumbnailSize;
}

/** The size at which a place shows the thumbnails: the one that the settings choose for it at High quality, 400 at Fast. */
export function shownThumbnailSize(quality: ThumbnailQuality, size: number): number {
  return quality === 'high' ? size : minThumbnailSize;
}

/** The box in which a place shows a thumbnail of a size, in CSS pixels: half the size. */
export function thumbnailBoxOf(size: number): number {
  return size / 2;
}
