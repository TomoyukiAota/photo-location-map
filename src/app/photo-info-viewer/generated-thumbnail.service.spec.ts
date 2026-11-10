import { TestBed } from '@angular/core/testing';
import type { ThumbnailState } from '../../../src-shared/bridge/plm-bridge';
import { GeneratedThumbnailService, thumbnailCheckIntervalMs } from './generated-thumbnail.service';

describe('GeneratedThumbnailService', () => {
  let service: GeneratedThumbnailService;
  /** The photos whose thumbnails the main process has finished, which a test adds to. */
  let finishedPhotoPaths: Set<string>;
  let state: ReturnType<typeof vi.spyOn>;

  const stateOf = (photoPath: string): ThumbnailState =>
    ({ attemptFinished: finishedPhotoPaths.has(photoPath), cacheAvailable: finishedPhotoPaths.has(photoPath), thumbnailFilePath: `/cache${photoPath}.plm.jpg` });

  beforeEach(() => {
    vi.useFakeTimers();
    finishedPhotoPaths = new Set();
    state = vi.spyOn(window.plm.thumbnails, 'state').mockImplementation(async photoPaths => photoPaths.map(stateOf));
    service = TestBed.inject(GeneratedThumbnailService);
  });

  afterEach(() => vi.useRealTimers());

  it('asks the main process at once, in one request, about the photos that are watched in the same turn', async () => {
    finishedPhotoPaths.add('/photos/a.heic');
    service.watch('/photos/a.heic');
    service.watch('/photos/b.heic');
    service.watch('/photos/a.heic');
    expect(state).not.toHaveBeenCalled();
    expect(service.filePathOf('/photos/a.heic')).toBeUndefined();

    await vi.advanceTimersByTimeAsync(0);

    expect(state).toHaveBeenCalledExactlyOnceWith(['/photos/a.heic', '/photos/b.heic']);
    expect(service.filePathOf('/photos/a.heic')).toBe('/cache/photos/a.heic.plm.jpg');
    expect(service.filePathOf('/photos/b.heic')).toBeUndefined();
  });

  it('asks every second about the thumbnails that are still being made, and no longer once they are finished', async () => {
    service.watch('/photos/a.heic');
    service.watch('/photos/b.heic');
    await vi.advanceTimersByTimeAsync(0);
    expect(state).toHaveBeenCalledTimes(1);

    finishedPhotoPaths.add('/photos/a.heic');
    await vi.advanceTimersByTimeAsync(thumbnailCheckIntervalMs);
    expect(state).toHaveBeenCalledTimes(2);
    expect(service.filePathOf('/photos/a.heic')).toBe('/cache/photos/a.heic.plm.jpg');

    finishedPhotoPaths.add('/photos/b.heic');
    await vi.advanceTimersByTimeAsync(thumbnailCheckIntervalMs);
    // Only about the one that was still being made.
    expect(state).toHaveBeenLastCalledWith(['/photos/b.heic']);
    expect(service.filePathOf('/photos/b.heic')).toBe('/cache/photos/b.heic.plm.jpg');

    await vi.advanceTimersByTimeAsync(10 * thumbnailCheckIntervalMs);
    expect(state).toHaveBeenCalledTimes(3);
  });

  it('knows a finished thumbnail without asking again, and asks about one that is watched later', async () => {
    finishedPhotoPaths.add('/photos/a.heic');
    service.watch('/photos/a.heic');
    await vi.advanceTimersByTimeAsync(0);

    service.watch('/photos/a.heic');
    await vi.advanceTimersByTimeAsync(10 * thumbnailCheckIntervalMs);
    expect(state).toHaveBeenCalledTimes(1);

    finishedPhotoPaths.add('/photos/c.heic');
    service.watch('/photos/c.heic');
    await vi.advanceTimersByTimeAsync(0);
    expect(state).toHaveBeenLastCalledWith(['/photos/c.heic']);
    expect(service.filePathOf('/photos/c.heic')).toBe('/cache/photos/c.heic.plm.jpg');
  });

  it('does not ask again while the main process has not answered', async () => {
    let answer: (states: ThumbnailState[]) => void;
    state.mockImplementationOnce(() => new Promise<ThumbnailState[]>(resolve => { answer = resolve; }));
    service.watch('/photos/a.heic');
    await vi.advanceTimersByTimeAsync(5 * thumbnailCheckIntervalMs);
    expect(state).toHaveBeenCalledTimes(1);

    // A photo that is watched meanwhile waits for the answer, and is asked about in the next request.
    service.watch('/photos/b.heic');
    await vi.advanceTimersByTimeAsync(thumbnailCheckIntervalMs);
    expect(state).toHaveBeenCalledTimes(1);

    answer([stateOf('/photos/a.heic')]);
    await vi.advanceTimersByTimeAsync(thumbnailCheckIntervalMs);
    expect(state).toHaveBeenCalledTimes(2);
    expect(state).toHaveBeenLastCalledWith(['/photos/a.heic', '/photos/b.heic']);
  });

  it('goes on asking after a request has failed', async () => {
    state.mockRejectedValueOnce(new Error('The main process did not answer.'));
    finishedPhotoPaths.add('/photos/a.heic');
    service.watch('/photos/a.heic');
    await vi.advanceTimersByTimeAsync(0);
    expect(service.filePathOf('/photos/a.heic')).toBeUndefined();

    await vi.advanceTimersByTimeAsync(thumbnailCheckIntervalMs);
    expect(service.filePathOf('/photos/a.heic')).toBe('/cache/photos/a.heic.plm.jpg');
  });

  it('forgets every thumbnail for the photos of another folder, and stops asking about them', async () => {
    finishedPhotoPaths.add('/photos/a.heic');
    service.watch('/photos/a.heic');
    service.watch('/photos/b.heic');
    await vi.advanceTimersByTimeAsync(0);
    expect(service.filePathOf('/photos/a.heic')).toBeDefined();

    service.reset();

    expect(service.filePathOf('/photos/a.heic')).toBeUndefined();
    await vi.advanceTimersByTimeAsync(10 * thumbnailCheckIntervalMs);
    expect(state).toHaveBeenCalledTimes(1);
  });

  it('drops an answer about the previous folder, and asks about the new folder once that answer is in', async () => {
    let answer: (states: ThumbnailState[]) => void;
    state.mockImplementationOnce(() => new Promise<ThumbnailState[]>(resolve => { answer = resolve; }));
    service.watch('/previous/a.heic');
    await vi.advanceTimersByTimeAsync(0);

    service.reset();
    finishedPhotoPaths.add('/previous/a.heic').add('/next/b.heic');
    service.watch('/next/b.heic');
    answer([stateOf('/previous/a.heic')]);
    await vi.advanceTimersByTimeAsync(0);

    expect(service.filePathOf('/previous/a.heic')).toBeUndefined();
    expect(state).toHaveBeenLastCalledWith(['/next/b.heic']);
    expect(service.filePathOf('/next/b.heic')).toBe('/cache/next/b.heic.plm.jpg');
  });
});
