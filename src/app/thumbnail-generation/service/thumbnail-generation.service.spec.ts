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

  it('starts nothing for a folder without HEIF files', () => {
    expect(service.startThumbnailGeneration(folder('a.jpg'))).toBe(false);
    expect(service.status()).toEqual(idleThumbnailGenerationStatus);
    expect(service.isGenerating()).toBe(false);
  });

  it('reports a generation from its start, and its progress from the poll every 5 seconds', () => {
    // These files exist nowhere, so no thumbnail is in the cache and none gets made.
    expect(service.startThumbnailGeneration(folder('a.heic', 'b.heic', 'c.jpg'))).toBe(true);
    expect(service.isGenerating()).toBe(true);
    expect(service.status()).toEqual({
      phase: 'generating', numOfAllHeifFiles: 2, numOfCacheAvailableThumbnails: 0, numOfGenerationRequiredThumbnails: 2,
      numOfProcessedThumbnails: 0, progressPercent: 0, result: null,
    });

    vi.advanceTimersByTime(5000);
    expect(service.status()).toMatchObject({ phase: 'generating', numOfProcessedThumbnails: 0, progressPercent: 0 });
  });
});
