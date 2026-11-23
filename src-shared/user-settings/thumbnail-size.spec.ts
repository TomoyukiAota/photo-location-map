import { isThumbnailSize, madeThumbnailLongerSide, thumbnailBoxOf, thumbnailSizeOf, thumbnailSizes } from './thumbnail-size';

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

  it('is that of the thumbnails that the app makes at High quality, and 400 at Fast, shown in a box of half that', () => {
    expect(madeThumbnailLongerSide('high', 800)).toBe(800);
    expect(madeThumbnailLongerSide('fast', 800)).toBe(400);
    expect(thumbnailBoxOf(400)).toBe(200);
    expect(thumbnailBoxOf(1000)).toBe(500);
  });
});
