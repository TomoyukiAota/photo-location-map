import { TestBed } from '@angular/core/testing';
import type { PhotoFileForThumbnail, ThumbnailState } from '../../../src-shared/bridge/plm-bridge';
import { Dimensions } from '../shared/model/dimensions.model';
import { Exif } from '../shared/model/exif.model';
import { Photo } from '../shared/model/photo.model';
import { Thumbnail } from '../shared/model/thumbnail.model';
import { JpegPngImageSource } from './jpeg-png-image-source';
import { backgroundStartDelayMs, JpegPngThumbnailService, needsMadeThumbnail } from './jpeg-png-thumbnail.service';

/** A promise with its resolve, for a step that a test lets finish when it chooses. */
function held<T>() {
  let resolve: (value: T) => void;
  const promise = new Promise<T>(r => { resolve = r; });
  return { promise, resolve: (value: T) => resolve(value) };
}

/** A photo at a path, with the EXIF data given. */
function photoAt(path: string, exif?: Exif): Photo {
  const name = path.slice(path.lastIndexOf('/') + 1);
  return Object.assign(new Photo(), { name, path, filenameExtension: name.slice(name.lastIndexOf('.')).toLowerCase(), exif });
}

const lastModified = '2026-11-23T01:02:03.000Z';
const cachePathOf = (photoPath: string) => `/cache${photoPath}.plm.jpg`;

describe('JpegPngThumbnailService', () => {
  let service: JpegPngThumbnailService;
  /** What the main process says of each photo's thumbnail in the cache, by the photo's path; none for the others. */
  let cacheStates: Map<string, Partial<ThumbnailState>>;
  /** The order in which the photos are read to be made, and what the reading gives, by the photo's path. */
  let read: string[];
  let reading: Map<string, Promise<PhotoFileForThumbnail | null>>;
  /** What the decoder makes of each photo; a thumbnail unless a test says otherwise. */
  let decoding: Map<string, () => Promise<Blob>>;
  /** What is kept in the cache, as the main process was asked: the photo, its time and whether it has a thumbnail. */
  let saved: [string, string, boolean][];
  let saveFails: boolean;
  let canMake: boolean;

  beforeEach(() => {
    vi.useFakeTimers();
    cacheStates = new Map();
    read = [];
    reading = new Map();
    decoding = new Map();
    saved = [];
    saveFails = false;
    canMake = true;
    let urls = 0;
    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:test/${++urls}`);
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    TestBed.configureTestingModule({
      providers: [{
        provide: JpegPngImageSource,
        useValue: {
          canMake: () => canMake,
          states: async (photoPaths: string[]) => photoPaths.map((photoPath): ThumbnailState => ({
            attemptFinished: false, cacheAvailable: false, thumbnailFilePath: cachePathOf(photoPath), ...cacheStates.get(photoPath) })),
          readPhoto: (photoPath: string) => {
            read.push(photoPath);
            return reading.get(photoPath) ?? Promise.resolve({ bytes: new Uint8Array([1, 2, 3]), lastModified });
          },
          makeThumbnail: (_bytes: Uint8Array, photoPath: string) => decoding.get(photoPath)?.() ?? Promise.resolve(new Blob(['jpeg'])),
          save: async (photoPath: string, time: string, jpeg: Uint8Array | null) => {
            saved.push([photoPath, time, jpeg !== null]);
            if (saveFails)
              throw new Error('The disk is full.');
            return cachePathOf(photoPath);
          },
        },
      }],
    });
    service = TestBed.inject(JpegPngThumbnailService);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  /** Lets what was started finish, the timers included. */
  const pass = (milliseconds = 0) => vi.advanceTimersByTimeAsync(milliseconds);

  it('makes the thumbnails of the JPEG and PNG photos without one in their EXIF data only', () => {
    const exifThumbnail = { thumbnail: new Thumbnail('blob:exif', new Dimensions(160, 120)) } as Exif;
    expect(needsMadeThumbnail(photoAt('/photos/a.jpg'))).toBe(true);
    expect(needsMadeThumbnail(photoAt('/photos/b.PNG'))).toBe(true);
    expect(needsMadeThumbnail(photoAt('/photos/c.jpeg', {} as Exif))).toBe(true);
    expect(needsMadeThumbnail(photoAt('/photos/d.jpg', exifThumbnail))).toBe(false);
    expect(needsMadeThumbnail(photoAt('/photos/e.heic'))).toBe(false);
    expect(needsMadeThumbnail(photoAt('/photos/f.tif'))).toBe(false);
  });

  it('shows the thumbnail of the cache of a photo that has one, and makes none', async () => {
    cacheStates.set('/photos/a.jpg', { attemptFinished: true, cacheAvailable: true });
    await service.prepare([photoAt('/photos/a.jpg')]);

    expect(service.stateOf('/photos/a.jpg')).toEqual({ kind: 'cached', filePath: '/cache/photos/a.jpg.plm.jpg' });
    service.watch('/photos/a.jpg');
    service.startFolder();
    await pass(backgroundStartDelayMs);
    expect(read).toEqual([]);
  });

  it('makes a photo\'s thumbnail as a place asks for it, keeps it in the cache with the time of the photo that was read, and shows it from there', async () => {
    await service.prepare([photoAt('/photos/a.jpg')]);
    expect(service.stateOf('/photos/a.jpg')).toEqual({ kind: 'pending' });

    service.watch('/photos/a.jpg');
    await pass();

    expect(read).toEqual(['/photos/a.jpg']);
    expect(saved).toEqual([['/photos/a.jpg', lastModified, true]]);
    expect(service.stateOf('/photos/a.jpg')).toEqual({ kind: 'cached', filePath: '/cache/photos/a.jpg.plm.jpg' });
  });

  it('makes the photos that the places ask for in a turn in their order, a later turn\'s first, two at a time', async () => {
    const paths = ['/a.jpg', '/b.jpg', '/c.jpg', '/d.jpg', '/e.jpg', '/f.jpg'];
    const files = new Map(paths.map(path => [path, held<PhotoFileForThumbnail | null>()]));
    files.forEach((file, path) => reading.set(path, file.promise));
    await service.prepare(paths.map(path => photoAt(path)));

    // The rows of a folder expanded, the first first.
    ['/a.jpg', '/b.jpg', '/c.jpg'].forEach(path => service.watch(path));
    await pass();
    expect(read).toEqual(['/a.jpg', '/b.jpg']);

    // Rows that a scroll brought near, in a later turn, before the third of the first turn.
    ['/d.jpg', '/e.jpg'].forEach(path => service.watch(path));
    await pass();
    files.get('/a.jpg').resolve({ bytes: new Uint8Array([1]), lastModified });
    await pass();
    expect(read).toEqual(['/a.jpg', '/b.jpg', '/d.jpg']);
    files.get('/b.jpg').resolve({ bytes: new Uint8Array([1]), lastModified });
    await pass();
    expect(read).toEqual(['/a.jpg', '/b.jpg', '/d.jpg', '/e.jpg']);
    files.get('/d.jpg').resolve({ bytes: new Uint8Array([1]), lastModified });
    await pass();
    expect(read).toEqual(['/a.jpg', '/b.jpg', '/d.jpg', '/e.jpg', '/c.jpg']);
    // A photo asked for again, or made already, is not made again; one that no place asks for waits for the folder.
    service.watch('/a.jpg');
    service.watch('/e.jpg');
    await pass();
    expect(read).toHaveLength(5);
  });

  it('makes the folder\'s other photos in its order, one at a time, once its tree has shown its first', async () => {
    const paths = ['/a.png', '/b.png', '/c.png'];
    const files = new Map(paths.map(path => [path, held<PhotoFileForThumbnail | null>()]));
    files.forEach((file, path) => reading.set(path, file.promise));
    await service.prepare(paths.map(path => photoAt(path)));

    service.startFolder();
    await pass(backgroundStartDelayMs - 1);
    expect(read).toEqual([]);
    await pass(1);
    expect(read).toEqual(['/a.png']);

    // One that a place asks for takes the other lane at once.
    service.watch('/c.png');
    await pass();
    expect(read).toEqual(['/a.png', '/c.png']);

    files.get('/a.png').resolve({ bytes: new Uint8Array([1]), lastModified });
    await pass();
    expect(read).toEqual(['/a.png', '/c.png', '/b.png']);
    files.get('/b.png').resolve({ bytes: new Uint8Array([1]), lastModified });
    files.get('/c.png').resolve({ bytes: new Uint8Array([1]), lastModified });
    await pass();
    expect(paths.map(path => service.stateOf(path).kind)).toEqual(['cached', 'cached', 'cached']);
  });

  it('shows the photo itself for a photo whose file the decoder refuses, and keeps that in the cache, so that it is not tried again', async () => {
    decoding.set('/photos/cut-short.jpg', () => Promise.reject(new DOMException('Failed to decode frame at index 0', 'EncodingError')));
    decoding.set('/photos/slow.jpg', () => Promise.reject(new Error('The decoding took too long.')));
    await service.prepare([photoAt('/photos/cut-short.jpg'), photoAt('/photos/slow.jpg')]);

    service.watch('/photos/cut-short.jpg');
    service.watch('/photos/slow.jpg');
    await pass();

    expect(service.stateOf('/photos/cut-short.jpg')).toEqual({ kind: 'photoItself' });
    expect(service.stateOf('/photos/slow.jpg')).toEqual({ kind: 'photoItself' });
    // A decoding that took too long may not next time.
    expect(saved).toEqual([['/photos/cut-short.jpg', lastModified, false]]);
  });

  it('shows the photo itself for a photo whose attempt failed before, without trying again', async () => {
    cacheStates.set('/photos/a.jpg', { attemptFinished: true, cacheAvailable: false });
    await service.prepare([photoAt('/photos/a.jpg')]);

    expect(service.stateOf('/photos/a.jpg')).toEqual({ kind: 'photoItself' });
    service.watch('/photos/a.jpg');
    await pass();
    expect(read).toEqual([]);
  });

  it('shows the photo itself for a photo that cannot be read, and where the page has no decoder', async () => {
    reading.set('/photos/gone.jpg', Promise.resolve(null));
    await service.prepare([photoAt('/photos/gone.jpg')]);
    service.watch('/photos/gone.jpg');
    await pass();
    expect(service.stateOf('/photos/gone.jpg')).toEqual({ kind: 'photoItself' });

    service.reset();
    canMake = false;
    await service.prepare([photoAt('/photos/a.jpg')]);
    expect(service.stateOf('/photos/a.jpg')).toEqual({ kind: 'photoItself' });
  });

  it('shows the thumbnail that was made until another folder opens, when the cache cannot be written', async () => {
    saveFails = true;
    await service.prepare([photoAt('/photos/a.jpg')]);
    service.watch('/photos/a.jpg');
    await pass();

    expect(service.stateOf('/photos/a.jpg')).toEqual({ kind: 'decoded', url: 'blob:test/1' });
    service.reset();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test/1');
  });

  it('drops what was being made for the previous folder, and changes nothing of the next one with it', async () => {
    const file = held<PhotoFileForThumbnail | null>();
    reading.set('/old/a.jpg', file.promise);
    await service.prepare([photoAt('/old/a.jpg')]);
    service.watch('/old/a.jpg');
    service.startFolder();
    await pass();

    service.reset();
    await service.prepare([photoAt('/new/b.jpg')]);
    file.resolve({ bytes: new Uint8Array([1]), lastModified });
    await pass(backgroundStartDelayMs);

    // The previous folder's photo is neither kept nor shown, and its folder's timer makes nothing.
    expect(saved).toEqual([]);
    expect(service.stateOf('/old/a.jpg')).toEqual({ kind: 'pending' });
    expect(read).toEqual(['/old/a.jpg']);
  });
});
