import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ThumbnailQuality } from '../../../../src-shared/user-settings/thumbnail-quality';
import { ThumbnailSizeService } from '../../shared/thumbnail-size/thumbnail-size.service';
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
  /** The settings, as ThumbnailSizeService has them. */
  let quality: ReturnType<typeof signal<ThumbnailQuality>>;
  let size: ReturnType<typeof signal<number>>;

  beforeEach(() => {
    vi.useFakeTimers();
    quality = signal<ThumbnailQuality>('high');
    size = signal(400);
    TestBed.configureTestingModule({
      providers: [{ provide: ThumbnailSizeService, useValue: { quality, longerSide: computed(() => quality() === 'high' ? size() : 400) } }],
    });
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
    expect(generate).toHaveBeenCalledExactlyOnceWith(['/photos/a.heic', '/photos/b.heic'], ['/photos/a.heic', '/photos/b.heic'], 400);
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
    beforeEach(() => quality.set('fast'));

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
      expect(generate).toHaveBeenCalledExactlyOnceWith(['/photos/a.heic', '/photos/b.heic', '/photos/c.heic'], ['/photos/a.heic', '/photos/b.heic'], 400);
      expect(service.status()).toMatchObject({ phase: 'generating', numOfGenerationRequiredThumbnails: 2, isWholeFolder: false });
      expect(statusBar.visible()).toBe(true);

      service.generate('/photos/c.heic');
      await Promise.resolve();
      expect(generate).toHaveBeenLastCalledWith(['/photos/a.heic', '/photos/b.heic', '/photos/c.heic'], ['/photos/c.heic'], 400);
      expect(service.status()).toMatchObject({ phase: 'generating', numOfGenerationRequiredThumbnails: 3 });
    });
  });

  it('drops the thumbnails that wait to be made once the fast ones are chosen, and makes the folder\'s once the high quality is', async () => {
    await service.startThumbnailGeneration(await service.checkThumbnailCache(folder('a.heic', 'b.heic')));
    const cancel = vi.spyOn(window.plm.thumbnails, 'cancel');
    const generate = vi.spyOn(window.plm.thumbnails, 'generate');

    quality.set('fast');
    expect(service.thumbnailQuality()).toBe('fast');
    expect(await service.applyThumbnailSettings()).toBe(false);
    expect(cancel).toHaveBeenCalledOnce();
    expect(service.status()).toEqual(idleThumbnailGenerationStatus);
    expect(service.isMade('/photos/a.heic')).toBe(false);

    quality.set('high');
    expect(await service.applyThumbnailSettings()).toBe(true);
    expect(generate).toHaveBeenCalledExactlyOnceWith(['/photos/a.heic', '/photos/b.heic'], ['/photos/a.heic', '/photos/b.heic'], 400);
    expect(service.isGenerating()).toBe(true);
  });

  it('looks up the thumbnails of the cache again at Fast, so that one at another size is not taken for cached', async () => {
    // At the folder's open, the cache has a's thumbnail at 800 pixels, b's at 400 and 800, c's at neither.
    const cachedAt = new Map([['/photos/a.heic', [800]], ['/photos/b.heic', [400, 800]], ['/photos/c.heic', []]]);
    vi.spyOn(window.plm.thumbnails, 'state').mockImplementation(async (filePaths, longerSide) => filePaths.map(filePath => ({
      attemptFinished: cachedAt.get(filePath).includes(longerSide), cacheAvailable: cachedAt.get(filePath).includes(longerSide),
      thumbnailFilePath: `${filePath}.plm.jpg`,
    })));
    size.set(800);
    await service.startThumbnailGeneration(await service.checkThumbnailCache(folder('a.heic', 'b.heic', 'c.heic')));
    expect(['a', 'b', 'c'].map(name => service.isCached(`/photos/${name}.heic`))).toEqual([true, true, false]);
    // The main process makes c's at 800 meanwhile, and the cache happens to have one of 400 too: one of this session.
    cachedAt.set('/photos/c.heic', [400, 800]);

    quality.set('fast');
    expect(await service.applyThumbnailSettings()).toBe(false);
    // a's is not at 400, which Fast asks for; c's was not in the cache when the folder was opened.
    expect(['a', 'b', 'c'].map(name => service.isCached(`/photos/${name}.heic`))).toEqual([false, true, false]);
  });

  it('drops the thumbnails that wait to be made at the previous size, and makes the folder\'s at the new size', async () => {
    const state = vi.spyOn(window.plm.thumbnails, 'state');
    await service.startThumbnailGeneration(await service.checkThumbnailCache(folder('a.heic', 'b.heic')));
    expect(state).toHaveBeenLastCalledWith(['/photos/a.heic', '/photos/b.heic'], 400);
    const cancel = vi.spyOn(window.plm.thumbnails, 'cancel');
    const generate = vi.spyOn(window.plm.thumbnails, 'generate');

    size.set(800);
    expect(await service.applyThumbnailSettings()).toBe(true);
    expect(cancel).toHaveBeenCalledOnce();
    expect(state).toHaveBeenLastCalledWith(['/photos/a.heic', '/photos/b.heic'], 800);
    expect(generate).toHaveBeenCalledExactlyOnceWith(['/photos/a.heic', '/photos/b.heic'], ['/photos/a.heic', '/photos/b.heic'], 800);
    expect(service.isGenerating()).toBe(true);
  });
});
