import { TestBed } from '@angular/core/testing';
import { currentUserSettings } from '../../../../src-shared/user-settings/user-settings';
import { ThumbnailGenerationStatusBarService } from '../status-bar/service/thumbnail-generation-status-bar.service';

import { idleThumbnailGenerationStatus, ThumbnailGenerationService } from './thumbnail-generation.service';

function folder(...fileNames: string[]): DirectoryTree {
  return {
    path: '/photos', name: 'photos', type: 'directory',
    children: fileNames.map(name => ({ path: `/photos/${name}`, name, type: 'file', extension: name.slice(name.lastIndexOf('.')) })),
  } as DirectoryTree;
}

describe('ThumbnailGenerationService', () => {
  let service: ThumbnailGenerationService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThumbnailGenerationService);
  });

  afterEach(() => vi.useRealTimers());

  it('starts nothing for a folder without HEIF files', async () => {
    const state = vi.spyOn(window.plm.thumbnails, 'state');
    expect(await service.startThumbnailGeneration(await service.checkThumbnailCache(folder('a.jpg')))).toBe(false);
    expect(state).not.toHaveBeenCalled();
    expect(service.status()).toEqual(idleThumbnailGenerationStatus);
    expect(service.isGenerating()).toBe(false);
  });

  it('reports a generation from its start, and its progress from the poll every 5 seconds', async () => {
    // The main process says that these files have no thumbnail in the cache, and makes none (test/angular/bridge-double.ts).
    // The page of a unit test has no WebCodecs, so the main process makes the thumbnails of high quality.
    const generate = vi.spyOn(window.plm.thumbnails, 'generate');
    expect(await service.startThumbnailGeneration(await service.checkThumbnailCache(folder('a.heic', 'b.heic', 'c.jpg')))).toBe(true);
    expect(generate).toHaveBeenCalledExactlyOnceWith(['/photos/a.heic', '/photos/b.heic'], ['/photos/a.heic', '/photos/b.heic']);
    expect(service.isGenerating()).toBe(true);
    expect(service.status()).toEqual({
      phase: 'generating', numOfAllHeifFiles: 2, numOfCacheAvailableThumbnails: 0, numOfGenerationRequiredThumbnails: 2,
      numOfProcessedThumbnails: 0, progressPercent: 0, result: null, isWholeFolder: true,
    });
    expect(service.isMade('/photos/a.heic')).toBe(true);
    expect(service.isCached('/photos/a.heic')).toBe(false);

    await vi.advanceTimersByTimeAsync(5000);
    expect(service.status()).toMatchObject({ phase: 'generating', numOfProcessedThumbnails: 0, progressPercent: 0 });
  });

  it('is done once the main process says that every thumbnail was attempted, and lists those not in the cache', async () => {
    await service.startThumbnailGeneration(await service.checkThumbnailCache(folder('a.heic', 'b.heic')));
    vi.spyOn(window.plm.thumbnails, 'state').mockImplementation(async filePaths => filePaths.map(filePath => ({
      attemptFinished: true, cacheAvailable: filePath.endsWith('a.heic'), thumbnailFilePath: `${filePath}.plm.jpg`,
    })));

    await vi.advanceTimersByTimeAsync(5000);
    expect(service.status()).toMatchObject({
      phase: 'done', numOfProcessedThumbnails: 2, progressPercent: 100,
      result: { errorOccurred: true, filePathsWithoutThumbnail: ['/photos/b.heic'] },
    });
  });

  describe('with the fast thumbnails', () => {
    let quality: typeof currentUserSettings.thumbnailQuality;
    beforeEach(() => { quality = currentUserSettings.thumbnailQuality; currentUserSettings.thumbnailQuality = 'fast'; });
    afterEach(() => { currentUserSettings.thumbnailQuality = quality; });

    it('makes nothing for the folder, which the page makes the thumbnails of', async () => {
      const generate = vi.spyOn(window.plm.thumbnails, 'generate');
      expect(await service.startThumbnailGeneration(await service.checkThumbnailCache(folder('a.heic')))).toBe(false);
      expect(generate).not.toHaveBeenCalled();
      expect(service.isMade('/photos/a.heic')).toBe(false);
    });

    it('makes the thumbnails that the page could not, together, and shows them on the status bar', async () => {
      await service.startThumbnailGeneration(await service.checkThumbnailCache(folder('a.heic', 'b.heic', 'c.heic')));
      const generate = vi.spyOn(window.plm.thumbnails, 'generate');
      const statusBar = TestBed.inject(ThumbnailGenerationStatusBarService);
      service.generate('/photos/a.heic');
      service.generate('/photos/b.heic');
      service.generate('/photos/a.heic');
      await Promise.resolve();
      expect(generate).toHaveBeenCalledExactlyOnceWith(['/photos/a.heic', '/photos/b.heic', '/photos/c.heic'], ['/photos/a.heic', '/photos/b.heic']);
      expect(service.status()).toMatchObject({ phase: 'generating', numOfGenerationRequiredThumbnails: 2, isWholeFolder: false });
      expect(statusBar.visible()).toBe(true);

      service.generate('/photos/c.heic');
      await Promise.resolve();
      expect(generate).toHaveBeenLastCalledWith(['/photos/a.heic', '/photos/b.heic', '/photos/c.heic'], ['/photos/c.heic']);
      expect(service.status()).toMatchObject({ phase: 'generating', numOfGenerationRequiredThumbnails: 3 });
    });
  });

  it('drops the thumbnails that wait to be made once the fast ones are chosen, and makes the folder\'s once the high quality is', async () => {
    await service.startThumbnailGeneration(await service.checkThumbnailCache(folder('a.heic', 'b.heic')));
    const cancel = vi.spyOn(window.plm.thumbnails, 'cancel');
    const generate = vi.spyOn(window.plm.thumbnails, 'generate');
    const quality = currentUserSettings.thumbnailQuality;
    try {
      currentUserSettings.thumbnailQuality = 'fast';
      expect(await service.applyThumbnailQuality()).toBe(false);
      expect(cancel).toHaveBeenCalledOnce();
      expect(service.status()).toEqual(idleThumbnailGenerationStatus);
      expect(service.isMade('/photos/a.heic')).toBe(false);

      currentUserSettings.thumbnailQuality = 'high';
      expect(await service.applyThumbnailQuality()).toBe(true);
      expect(generate).toHaveBeenCalledExactlyOnceWith(['/photos/a.heic', '/photos/b.heic'], ['/photos/a.heic', '/photos/b.heic']);
      expect(service.isGenerating()).toBe(true);
    } finally {
      currentUserSettings.thumbnailQuality = quality;
    }
  });
});
