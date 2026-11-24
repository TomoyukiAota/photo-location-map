import { TestBed } from '@angular/core/testing';
import { currentUserSettings } from '../../../../src-shared/user-settings/user-settings';
import { ThumbnailSizeService } from './thumbnail-size.service';

describe('ThumbnailSizeService', () => {
  let saved: Pick<typeof currentUserSettings, 'thumbnailQuality' | 'sidebarThumbnailSize' | 'mapThumbnailSize'>;

  beforeEach(() => {
    const { thumbnailQuality, sidebarThumbnailSize, mapThumbnailSize } = currentUserSettings;
    saved = { thumbnailQuality, sidebarThumbnailSize, mapThumbnailSize };
  });

  afterEach(() => Object.assign(currentUserSettings, saved));

  it('has the settings as they were when it was made: the size of the made thumbnails, and the box of each place as CSS takes it', () => {
    Object.assign(currentUserSettings, { thumbnailQuality: 'high', sidebarThumbnailSize: 600, mapThumbnailSize: 800 });
    const service = TestBed.inject(ThumbnailSizeService);
    expect([service.quality(), service.longerSide(), service.sidebarBox(), service.mapBox()]).toEqual(['high', 800, '300px', '400px']);
  });

  it('follows the settings once they are saved, and says whether the thumbnails that the app makes changed', () => {
    Object.assign(currentUserSettings, { thumbnailQuality: 'high', sidebarThumbnailSize: 400, mapThumbnailSize: 800 });
    const service = TestBed.inject(ThumbnailSizeService);

    expect(service.follow()).toBe(false);

    // The sidebar's box follows by itself, and the thumbnails stay at the map's size, the larger one.
    currentUserSettings.sidebarThumbnailSize = 600;
    expect(service.follow()).toBe(false);
    expect([service.longerSide(), service.sidebarBox(), service.mapBox()]).toEqual([800, '300px', '400px']);

    currentUserSettings.mapThumbnailSize = 1000;
    expect(service.follow()).toBe(true);
    expect([service.longerSide(), service.sidebarBox(), service.mapBox()]).toEqual([1000, '300px', '500px']);

    // Fast shows the thumbnails that the photos hold, in the box of 200 in either place, whatever the sizes.
    currentUserSettings.thumbnailQuality = 'fast';
    expect(service.follow()).toBe(true);
    expect([service.quality(), service.longerSide(), service.sidebarBox(), service.mapBox()]).toEqual(['fast', 400, '200px', '200px']);
  });
});
