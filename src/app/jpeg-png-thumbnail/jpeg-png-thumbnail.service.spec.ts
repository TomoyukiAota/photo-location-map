import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { PhotoFileForThumbnail, ThumbnailState } from '../../../src-shared/bridge/plm-bridge';
import { Logger } from '../../../src-shared/log/logger';
import { ThumbnailQuality } from '../../../src-shared/user-settings/thumbnail-quality';
import { UndecodableThumbnailService } from '../photo-info-viewer/undecodable-thumbnail.service';
import { Dimensions } from '../shared/model/dimensions.model';
import { Exif } from '../shared/model/exif.model';
import { Photo } from '../shared/model/photo.model';
import { Thumbnail } from '../shared/model/thumbnail.model';
import { ThumbnailSizeService } from '../shared/thumbnail-size/thumbnail-size.service';
import { JpegPngImageSource } from './jpeg-png-image-source';
import { backgroundStartDelayMs, hasUsableExifThumbnail, JpegPngThumbnailService, needsMadeThumbnail } from './jpeg-png-thumbnail.service';

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

/**
 * EXIF data with a thumbnail of `width` x `height`, as a camera writes one of 160 x 120, at the object URL given: each
 * photo's thumbnail has one of its own (UndecodableThumbnailService).
 */
function exifWithThumbnail(width: number, height: number, objectUrl = 'blob:exif'): Exif {
  return { thumbnail: new Thumbnail(objectUrl, new Dimensions(width, height)) } as Exif;
}

/**
 * EXIF data whose thumbnail of `width` x `height` lies on its side against the photo, of 2448 x 3264 (portrait), as
 * Windows Photo Viewer left test/test-resources/actual-photos/Unga/IMG_2581.JPG when it turned its pixels
 * (isExifThumbnailOnItsSide).
 */
function exifWithThumbnailOnItsSide(width = 160, height = 120): Exif {
  return { ...exifWithThumbnail(width, height), imageDimensions: new Dimensions(2448, 3264) } as Exif;
}

const lastModified = '2026-11-23T01:02:03.000Z';
const cachePathOf = (photoPath: string) => `/cache${photoPath}.plm.jpg`;

describe('JpegPngThumbnailService', () => {
  let service: JpegPngThumbnailService;
  /** What the main process says of each photo's thumbnail in the cache, by the photo's path; none for the others. */
  let cacheStates: Map<string, Partial<ThumbnailState>>;
  /** What the main process waits for before it answers about the cache; nothing unless a test says otherwise. */
  let cacheAnswered: Promise<void>;
  /** The order in which the photos are read to be made, and what the reading gives, by the photo's path. */
  let read: string[];
  let reading: Map<string, Promise<PhotoFileForThumbnail | null>>;
  /** What the decoder makes of each photo; a thumbnail unless a test says otherwise. */
  let decoding: Map<string, () => Promise<Blob>>;
  /** What is kept in the cache, as the main process was asked: the photo, its time and whether it has a thumbnail. */
  let saved: [string, string, boolean][];
  let saveFails: boolean;
  let canMake: boolean;
  /** The settings, and the sizes that the cache was asked about, that thumbnails were made at and kept at. */
  let quality: ReturnType<typeof signal<ThumbnailQuality>>;
  let size: ReturnType<typeof signal<number>>;
  let sizesAsked: number[];
  let sizesMade: number[];
  let sizesSaved: number[];

  beforeEach(() => {
    vi.useFakeTimers();
    cacheStates = new Map();
    cacheAnswered = Promise.resolve();
    read = [];
    reading = new Map();
    decoding = new Map();
    saved = [];
    saveFails = false;
    canMake = true;
    quality = signal<ThumbnailQuality>('high');
    size = signal(400);
    sizesAsked = [];
    sizesMade = [];
    sizesSaved = [];
    let urls = 0;
    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:test/${++urls}`);
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    TestBed.configureTestingModule({
      providers: [{
        provide: JpegPngImageSource,
        useValue: {
          canMake: () => canMake,
          states: async (photoPaths: string[], longerSide: number) => {
            sizesAsked.push(longerSide);
            await cacheAnswered;
            return photoPaths.map((photoPath): ThumbnailState => ({
              attemptFinished: false, cacheAvailable: false, thumbnailFilePath: cachePathOf(photoPath), ...cacheStates.get(photoPath) }));
          },
          readPhoto: (photoPath: string) => {
            read.push(photoPath);
            return reading.get(photoPath) ?? Promise.resolve({ bytes: new Uint8Array([1, 2, 3]), lastModified });
          },
          makeThumbnail: (_bytes: Uint8Array, photoPath: string, longerSide: number) => {
            sizesMade.push(longerSide);
            return decoding.get(photoPath)?.() ?? Promise.resolve(new Blob(['jpeg']));
          },
          save: async (photoPath: string, time: string, jpeg: Uint8Array | null, longerSide: number) => {
            saved.push([photoPath, time, jpeg !== null]);
            sizesSaved.push(longerSide);
            if (saveFails)
              throw new Error('The disk is full.');
            return cachePathOf(photoPath);
          },
        },
      }, {
        provide: ThumbnailSizeService,
        useValue: { quality, longerSide: computed(() => quality() === 'high' ? size() : 400) },
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

  it('makes the thumbnails of the JPEG and PNG photos without one in their EXIF data, and at High quality of those whose EXIF thumbnail is smaller than the size', () => {
    const undecodable = TestBed.inject(UndecodableThumbnailService);
    for (const quality of ['high', 'fast'] as const) {
      expect(needsMadeThumbnail(photoAt('/photos/a.jpg'), quality, 400, undecodable)).toBe(true);
      expect(needsMadeThumbnail(photoAt('/photos/b.PNG'), quality, 400, undecodable)).toBe(true);
      expect(needsMadeThumbnail(photoAt('/photos/c.jpeg', {} as Exif), quality, 400, undecodable)).toBe(true);
      expect(needsMadeThumbnail(photoAt('/photos/e.heic'), quality, 400, undecodable)).toBe(false);
      expect(needsMadeThumbnail(photoAt('/photos/f.tif', exifWithThumbnail(160, 120)), quality, 400, undecodable)).toBe(false);
    }
    // A camera's EXIF thumbnail is smaller than any size, which High quality does not show stretched.
    expect(needsMadeThumbnail(photoAt('/photos/d.jpg', exifWithThumbnail(160, 120)), 'high', 400, undecodable)).toBe(true);
    expect(needsMadeThumbnail(photoAt('/photos/d.jpg', exifWithThumbnail(160, 120)), 'fast', 400, undecodable)).toBe(false);
    // One as large as the size, on its longer side, is shown as it is, whichever side that is.
    expect(needsMadeThumbnail(photoAt('/photos/g.jpg', exifWithThumbnail(512, 384)), 'high', 500, undecodable)).toBe(false);
    expect(needsMadeThumbnail(photoAt('/photos/g.jpg', exifWithThumbnail(384, 512)), 'high', 500, undecodable)).toBe(false);
    expect(needsMadeThumbnail(photoAt('/photos/g.jpg', exifWithThumbnail(512, 384)), 'high', 600, undecodable)).toBe(true);
  });

  it('makes the thumbnail of a JPEG or PNG photo whose EXIF thumbnail the page cannot decode at either quality, as of one without an EXIF thumbnail', () => {
    const undecodable = TestBed.inject(UndecodableThumbnailService);
    const camera = photoAt('/photos/d.jpg', exifWithThumbnail(160, 120));
    const large = photoAt('/photos/g.png', exifWithThumbnail(512, 384));
    const scan = photoAt('/photos/f.tif', exifWithThumbnail(160, 120));
    [camera, large, scan].forEach(photo => undecodable.add(photo.exif.thumbnail));

    for (const quality of ['high', 'fast'] as const) {
      expect(needsMadeThumbnail(camera, quality, 400, undecodable)).toBe(true);
      expect(needsMadeThumbnail(large, quality, 400, undecodable)).toBe(true);
      // The page shows no TIFF file, which the app makes no thumbnail of.
      expect(needsMadeThumbnail(scan, quality, 400, undecodable)).toBe(false);
    }
  });

  it('makes the thumbnail of a JPEG or PNG photo whose EXIF thumbnail lies on its side against the photo at either quality, as of one without an EXIF thumbnail', () => {
    const undecodable = TestBed.inject(UndecodableThumbnailService);
    const turned = photoAt('/photos/turned.jpg', exifWithThumbnailOnItsSide());
    const large = photoAt('/photos/turned.png', exifWithThumbnailOnItsSide(512, 384));
    const scan = photoAt('/photos/turned.tif', exifWithThumbnailOnItsSide());
    // A camera's portrait photo, whose orientation turns its thumbnail as it turns the photo.
    const portrait = photoAt('/photos/portrait.jpg', { ...exifWithThumbnail(120, 160), imageDimensions: new Dimensions(3024, 4032) } as Exif);

    for (const quality of ['high', 'fast'] as const) {
      expect(needsMadeThumbnail(turned, quality, 400, undecodable)).toBe(true);
      expect(needsMadeThumbnail(large, quality, 400, undecodable)).toBe(true);
      // The page shows no TIFF file, which the app makes no thumbnail of: its EXIF thumbnail is shown, even on its side.
      expect(needsMadeThumbnail(scan, quality, 400, undecodable)).toBe(false);
    }
    expect(needsMadeThumbnail(portrait, 'high', 400, undecodable)).toBe(true);
    expect(needsMadeThumbnail(portrait, 'fast', 400, undecodable)).toBe(false);
    expect([turned, large, portrait].map(photo => hasUsableExifThumbnail(photo, undecodable))).toEqual([false, false, true]);
  });

  it('makes the thumbnail of a JPEG photo whose EXIF thumbnail lies on its side at Fast too, at 400 pixels, as one of the folder\'s', async () => {
    quality.set('fast');
    const turned = photoAt('/photos/turned.jpg', exifWithThumbnailOnItsSide());
    const camera = photoAt('/photos/camera.jpg', exifWithThumbnail(160, 120));
    await service.prepare([turned, camera]);
    expect(service.stateOf(turned.path)).toEqual({ kind: 'pending' });

    // Made with the folder's other photos, as the folder took it when it was opened, though no place asked for it.
    service.startFolder();
    await pass(backgroundStartDelayMs);
    expect(read).toEqual([turned.path]);
    expect(sizesMade).toEqual([400]);
    expect(service.stateOf(turned.path)).toEqual({ kind: 'cached', filePath: '/cache/photos/turned.jpg.plm.jpg', longerSide: 400 });
  });

  it('makes the thumbnail of a JPEG photo whose EXIF thumbnail is smaller than the size, at High quality only', async () => {
    const photo = photoAt('/photos/camera.jpg', exifWithThumbnail(160, 120));
    await service.prepare([photo]);
    service.watch(photo.path);
    await pass();
    expect(service.stateOf(photo.path)).toEqual({ kind: 'cached', filePath: '/cache/photos/camera.jpg.plm.jpg', longerSide: 400 });

    service.reset();
    read = [];
    quality.set('fast');
    await service.prepare([photo]);
    service.watch(photo.path);
    service.startFolder();
    await pass(backgroundStartDelayMs);
    expect(read).toEqual([]);
  });

  it('asks the cache about the thumbnails at the size that the settings choose, and makes and keeps them at it', async () => {
    size.set(800);
    await service.prepare([photoAt('/photos/a.jpg')]);
    service.watch('/photos/a.jpg');
    await pass();

    expect(sizesAsked).toEqual([800]);
    expect(sizesMade).toEqual([800]);
    expect(sizesSaved).toEqual([800]);
  });

  it('makes the folder\'s thumbnails again at new settings, and the places that read a photo\'s state read its new one', async () => {
    const photo = photoAt('/photos/a.jpg');
    cacheStates.set(photo.path, { attemptFinished: true, cacheAvailable: true });
    await service.prepare([photo]);
    const shown = computed(() => service.stateOf(photo.path).kind);
    expect(shown()).toBe('cached');

    // At the new size, the cache has none.
    size.set(600);
    cacheStates.clear();
    await service.applySettings();
    expect(shown()).toBe('pending');
    expect(sizesAsked).toEqual([400, 600]);

    // The folder's photos are made again, as they were when it was opened.
    await pass(backgroundStartDelayMs);
    expect(read).toEqual([photo.path]);
    expect(sizesMade).toEqual([600]);
    expect(shown()).toBe('cached');
  });

  it('shows the thumbnail of the cache of a photo that has one, and makes none', async () => {
    cacheStates.set('/photos/a.jpg', { attemptFinished: true, cacheAvailable: true });
    await service.prepare([photoAt('/photos/a.jpg')]);

    expect(service.stateOf('/photos/a.jpg')).toEqual({ kind: 'cached', filePath: '/cache/photos/a.jpg.plm.jpg', longerSide: 400 });
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
    expect(service.stateOf('/photos/a.jpg')).toEqual({ kind: 'cached', filePath: '/cache/photos/a.jpg.plm.jpg', longerSide: 400 });
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

  it('makes the photos asked for in a turn nearest first, then in the order that they asked', async () => {
    const paths = ['/above-2.jpg', '/above-1.jpg', '/in-view-1.jpg', '/in-view-2.jpg', '/below-1.jpg'];
    // The first is read at once, as a lane is free: held, so that the others wait, and are taken by their order.
    const first = held<PhotoFileForThumbnail | null>();
    reading.set('/in-view-1.jpg', first.promise);
    await service.prepare(paths.map(path => photoAt(path)));

    // Rows that a jump brought near, in their order in the tree, each with how far it was from the window's middle.
    service.watch('/above-2.jpg', 900);
    service.watch('/above-1.jpg', 600);
    service.watch('/in-view-1.jpg', 50);
    service.watch('/in-view-2.jpg', 50);
    service.watch('/below-1.jpg', 500);
    await pass();
    first.resolve({ bytes: new Uint8Array([1]), lastModified });
    await pass();

    expect(read).toEqual(['/in-view-1.jpg', '/in-view-2.jpg', '/below-1.jpg', '/above-1.jpg', '/above-2.jpg']);
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

  describe('of a photo that the folder did not take, whose EXIF thumbnail the page then could not decode', () => {
    let undecodable: UndecodableThumbnailService;
    /** A camera's JPEG, whose EXIF thumbnail Fast shows as it is: the folder does not take it to make its thumbnail. */
    const cameraPhoto = (path = '/photos/camera.jpg', objectUrl = `blob:exif-of-${path}`) =>
      photoAt(path, exifWithThumbnail(160, 120, objectUrl));

    beforeEach(() => {
      quality.set('fast');
      undecodable = TestBed.inject(UndecodableThumbnailService);
    });

    it('is made as a place asks for it, kept in the cache and shown from there, as one without an EXIF thumbnail is', async () => {
      const photo = cameraPhoto();
      await service.prepare([photo]);
      // Not while its EXIF thumbnail is one to show.
      service.watch(photo.path);
      service.startFolder();
      await pass(backgroundStartDelayMs);
      expect(sizesAsked).toEqual([]);
      expect(read).toEqual([]);

      undecodable.add(photo.exif.thumbnail);
      service.watch(photo.path);
      expect(service.stateOf(photo.path)).toEqual({ kind: 'pending' });
      await pass();

      expect(sizesAsked).toEqual([400]);
      expect(read).toEqual([photo.path]);
      expect(saved).toEqual([[photo.path, lastModified, true]]);
      expect(service.stateOf(photo.path)).toEqual({ kind: 'cached', filePath: '/cache/photos/camera.jpg.plm.jpg', longerSide: 400 });
    });

    it('is made at High quality too, where its EXIF thumbnail was as large as the size', async () => {
      quality.set('high');
      const photo = photoAt('/photos/large.jpg', exifWithThumbnail(512, 384, 'blob:exif-of-large'));
      await service.prepare([photo]);
      undecodable.add(photo.exif.thumbnail);
      service.watch(photo.path);
      await pass();

      expect(read).toEqual([photo.path]);
      expect(service.stateOf(photo.path)).toEqual({ kind: 'cached', filePath: '/cache/photos/large.jpg.plm.jpg', longerSide: 400 });
    });

    it('shows the thumbnail of the cache, or the photo itself where none can be made, asking the cache once', async () => {
      const cached = cameraPhoto('/photos/cached.jpg');
      const refused = cameraPhoto('/photos/refused.jpg');
      cacheStates.set(cached.path, { attemptFinished: true, cacheAvailable: true });
      cacheStates.set(refused.path, { attemptFinished: true, cacheAvailable: false });
      await service.prepare([cached, refused]);
      for (const photo of [cached, refused]) {
        undecodable.add(photo.exif.thumbnail);
        // Asked for by a row and by a popup.
        service.watch(photo.path);
        service.watch(photo.path);
      }
      await pass();

      expect(sizesAsked).toEqual([400, 400]);
      expect(service.stateOf(cached.path)).toEqual({ kind: 'cached', filePath: '/cache/photos/cached.jpg.plm.jpg', longerSide: 400 });
      expect(service.stateOf(refused.path)).toEqual({ kind: 'photoItself' });
      expect(read).toEqual([]);
    });

    it('is made before the folder\'s others, which the log alone counts', async () => {
      const info = vi.spyOn(Logger, 'info');
      const files = new Map(['/photos/a.jpg', '/photos/b.jpg'].map(path => [path, held<PhotoFileForThumbnail | null>()]));
      files.forEach((file, path) => reading.set(path, file.promise));
      const photo = cameraPhoto();
      await service.prepare([photoAt('/photos/a.jpg'), photoAt('/photos/b.jpg'), photo]);
      service.startFolder();
      await pass(backgroundStartDelayMs);
      expect(read).toEqual(['/photos/a.jpg']);

      undecodable.add(photo.exif.thumbnail);
      service.watch(photo.path);
      await pass();
      expect(read).toEqual(['/photos/a.jpg', photo.path]);

      const madeTheFolder = () => info.mock.calls.filter(([message]) => String(message).includes('Made the thumbnails of the folder'));
      files.get('/photos/a.jpg').resolve({ bytes: new Uint8Array([1]), lastModified });
      await pass();
      expect(read).toEqual(['/photos/a.jpg', photo.path, '/photos/b.jpg']);
      expect(madeTheFolder()).toEqual([]);
      files.get('/photos/b.jpg').resolve({ bytes: new Uint8Array([1]), lastModified });
      await pass();
      expect(madeTheFolder()).toHaveLength(1);
    });

    it('is taken by the folder itself once the settings are applied again', async () => {
      const photo = cameraPhoto();
      await service.prepare([photo]);
      undecodable.add(photo.exif.thumbnail);

      await service.applySettings();
      expect(service.stateOf(photo.path)).toEqual({ kind: 'pending' });
      await pass(backgroundStartDelayMs);
      expect(read).toEqual([photo.path]);
    });

    it('is not taken for a photo of another folder, nor for one whose EXIF thumbnail the page decodes, as that of the folder at the same path', async () => {
      // Rows of the previous folder, shown until the next one's tree is, one of them of a photo that the next folder has
      // too, with an EXIF thumbnail of its own, as the folder's EXIF data are read again.
      const previous = [cameraPhoto('/photos/camera.jpg', 'blob:previous-1'), cameraPhoto('/old/photo.jpg', 'blob:previous-2')];
      previous.forEach(photo => undecodable.add(photo.exif.thumbnail));
      await service.prepare([cameraPhoto('/photos/camera.jpg', 'blob:next-1')]);
      previous.forEach(photo => service.watch(photo.path));
      await pass();

      expect(sizesAsked).toEqual([]);
      expect(read).toEqual([]);
    });

    it('drops the answer of the cache that comes after another folder opens', async () => {
      const answered = held<void>();
      const photo = cameraPhoto('/old/camera.jpg');
      await service.prepare([photo]);
      cacheAnswered = answered.promise;
      undecodable.add(photo.exif.thumbnail);
      service.watch(photo.path);

      service.reset();
      await service.prepare([cameraPhoto('/new/b.jpg')]);
      answered.resolve();
      await pass(backgroundStartDelayMs);

      expect(read).toEqual([]);
      expect(service.stateOf(photo.path)).toEqual({ kind: 'pending' });
    });
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
