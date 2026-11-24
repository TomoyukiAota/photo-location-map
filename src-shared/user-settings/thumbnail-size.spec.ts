import {
  isThumbnailSize,
  madeThumbnailLongerSide,
  shownThumbnailSize,
  thumbnailBoxOf,
  thumbnailSizeOf,
  thumbnailSizes
} from './thumbnail-size.js';

describe('The size of the thumbnails', () => {
  it('can be chosen from 400 to 1,000 pixels in steps of 100', () => {
    expect(thumbnailSizes).toEqual([400, 500, 600, 700, 800, 900, 1000]);
    expect(isThumbnailSize(700)).toBe(true);
    for (const value of [300, 450, 1100, '400', null, undefined])
      expect(isThumbnailSize(value)).toBe(false);
  });

  it('is read from a saved setting, which no size that can be chosen leaves undefined', () => {
    expect(thumbnailSizeOf('800')).toBe(800);
    for (const text of ['', '800px', '8e2', ' 800', '350', 'undefined'])
      expect(thumbnailSizeOf(text)).toBeUndefined();
  });

  it('of the thumbnails that the app makes is the larger of the sidebar\'s and the map\'s at High quality, and 400 at Fast', () => {
    expect(madeThumbnailLongerSide('high', { sidebar: 600, map: 800 })).toBe(800);
    expect(madeThumbnailLongerSide('high', { sidebar: 1000, map: 400 })).toBe(1000);
    expect(madeThumbnailLongerSide('fast', { sidebar: 600, map: 800 })).toBe(400);
  });

  it('that a place shows is its own at High quality, and 400 at Fast, in a box of half that', () => {
    expect(shownThumbnailSize('high', 600)).toBe(600);
    expect(shownThumbnailSize('fast', 600)).toBe(400);
    expect(thumbnailBoxOf(400)).toBe(200);
    expect(thumbnailBoxOf(1000)).toBe(500);
  });
});
