import { TestBed } from '@angular/core/testing';
import { currentUserSettings } from '../../../../src-shared/user-settings/user-settings';
import { ThumbnailSizeService } from './thumbnail-size.service';

describe('ThumbnailSizeService', () => {
  let saved: { thumbnailQuality: typeof currentUserSettings.thumbnailQuality, thumbnailSize: number };

  beforeEach(() => {
    saved = { thumbnailQuality: currentUserSettings.thumbnailQuality, thumbnailSize: currentUserSettings.thumbnailSize };
  });

  afterEach(() => Object.assign(currentUserSettings, saved));

  it('has the settings as they were when it was made: the size of the made thumbnails, and their box as CSS takes it', () => {
    Object.assign(currentUserSettings, { thumbnailQuality: 'high', thumbnailSize: 600 });
    const service = TestBed.inject(ThumbnailSizeService);
    expect([service.quality(), service.longerSide(), service.box()]).toEqual(['high', 600, '300px']);
  });

  it('follows the settings once they are saved, and says whether they changed', () => {
    Object.assign(currentUserSettings, { thumbnailQuality: 'high', thumbnailSize: 400 });
    const service = TestBed.inject(ThumbnailSizeService);

    expect(service.follow()).toBe(false);

    currentUserSettings.thumbnailSize = 1000;
    expect(service.follow()).toBe(true);
    expect([service.longerSide(), service.box()]).toEqual([1000, '500px']);

    // Fast shows the thumbnails that the photos hold, in the box of 200, whatever the size.
    currentUserSettings.thumbnailQuality = 'fast';
    expect(service.follow()).toBe(true);
    expect([service.quality(), service.longerSide(), service.box()]).toEqual(['fast', 400, '200px']);
  });
});
