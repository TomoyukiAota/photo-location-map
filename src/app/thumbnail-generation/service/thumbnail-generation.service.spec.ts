import { TestBed } from '@angular/core/testing';

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
    expect(service.startThumbnailGeneration(await service.checkThumbnailCache(folder('a.jpg')))).toBe(false);
    expect(state).not.toHaveBeenCalled();
    expect(service.status()).toEqual(idleThumbnailGenerationStatus);
    expect(service.isGenerating()).toBe(false);
  });

  it('reports a generation from its start, and its progress from the poll every 5 seconds', async () => {
    // The main process says that these files have no thumbnail in the cache, and makes none (test/angular/bridge-double.ts).
    const generate = vi.spyOn(window.plm.thumbnails, 'generate');
    expect(service.startThumbnailGeneration(await service.checkThumbnailCache(folder('a.heic', 'b.heic', 'c.jpg')))).toBe(true);
    expect(generate).toHaveBeenCalledExactlyOnceWith(['/photos/a.heic', '/photos/b.heic'], ['/photos/a.heic', '/photos/b.heic']);
    expect(service.isGenerating()).toBe(true);
    expect(service.status()).toEqual({
      phase: 'generating', numOfAllHeifFiles: 2, numOfCacheAvailableThumbnails: 0, numOfGenerationRequiredThumbnails: 2,
      numOfProcessedThumbnails: 0, progressPercent: 0, result: null,
    });

    await vi.advanceTimersByTimeAsync(5000);
    expect(service.status()).toMatchObject({ phase: 'generating', numOfProcessedThumbnails: 0, progressPercent: 0 });
  });

  it('is done once the main process says that every thumbnail was attempted, and lists those not in the cache', async () => {
    service.startThumbnailGeneration(await service.checkThumbnailCache(folder('a.heic', 'b.heic')));
    vi.spyOn(window.plm.thumbnails, 'state').mockImplementation(async filePaths => filePaths.map(filePath => ({
      attemptFinished: true, cacheAvailable: filePath.endsWith('a.heic'), thumbnailFilePath: `${filePath}.plm.jpg`,
    })));

    await vi.advanceTimersByTimeAsync(5000);
    expect(service.status()).toMatchObject({
      phase: 'done', numOfProcessedThumbnails: 2, progressPercent: 100,
      result: { errorOccurred: true, filePathsWithoutThumbnail: ['/photos/b.heic'] },
    });
  });
});
