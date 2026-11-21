import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { Logger } from '../../../src-shared/log/logger';
import { photoFileUrl } from '../../../src-shared/main-window-schemes';
import { DirectoryTreeViewDataService } from '../directory-tree-view/directory-tree-view-data.service';
import { DirectoryTreeViewSelectionService } from '../directory-tree-view/directory-tree-view-selection.service';
import { HeifThumbnailService } from '../heif-thumbnail/heif-thumbnail.service';
import { Photo } from '../shared/model/photo.model';
import { Thumbnail } from '../shared/model/thumbnail.model';
import { Dimensions } from '../shared/model/dimensions.model';
import { SelectedPhotoService } from '../shared/service/selected-photo.service';
import { FaceDetectorError, FaceDetectorService } from './face-detector.service';
import { FaceSearchImageDecoder } from './face-search-image';
import { FaceSearchService } from './face-search.service';
import type { Mock } from 'vitest';

/** An image that the fake decoder gives: the address that it was decoded from. */
interface FakeImage { readonly url: string }

describe('FaceSearchService', () => {
  const dataReplaced = new Subject<unknown>();
  let service: FaceSearchService;
  let select: ReturnType<typeof vi.spyOn>;
  let updateMenu: ReturnType<typeof vi.spyOn>;
  let haveRegions: ReturnType<typeof vi.spyOn>;
  let open: Mock<() => unknown>;
  let close: Mock<() => void>;
  let score: Mock<(image: FakeImage) => Promise<number>>;
  /** The face score of each image, by the address that it is decoded from. An image without one cannot be looked at. */
  let scores: Map<string, number>;
  /** The addresses that cannot be decoded. */
  let undecodable: Set<string>;
  /** The addresses whose decoding waits until the promise of each resolves. */
  let decodingHeld: Map<string, Promise<void>>;
  /** The photos whose metadata marks a face. */
  let regions: Set<string>;
  /** The thumbnail of each HEIF photo, by the photo's path, once the attempt to make it has finished. */
  let thumbnails: Map<string, string>;

  /** A photo with a location, of the file's extension, with an EXIF thumbnail when `exifThumbnail` is given. */
  function photo(path: string, exifThumbnail?: string): Photo {
    const extension = path.slice(path.lastIndexOf('.')).toLowerCase();
    return Object.assign(new Photo(), {
      name: path.slice(path.lastIndexOf('/') + 1), path, filenameExtension: extension,
      exif: { gpsInfo: {}, thumbnail: exifThumbnail ? new Thumbnail(exifThumbnail, new Dimensions(160, 120)) : undefined },
    });
  }

  const selectPhotos = (photos: Photo[]) => TestBed.inject(SelectedPhotoService).setSelectedPhotos(photos);
  const state = () => service.dialogState();

  beforeEach(() => {
    scores = new Map();
    undecodable = new Set();
    decodingHeld = new Map();
    regions = new Set();
    thumbnails = new Map();
    close = vi.fn();
    // A dialog that says it has closed once it is closed, as MatDialog's does.
    open = vi.fn(() => {
      const closed = new Subject<void>();
      return { close: () => { close(); closed.next(); closed.complete(); }, afterClosed: () => closed.asObservable() };
    });
    score = vi.fn(async (image: FakeImage) => {
      const value = scores.get(image.url);
      if (value === undefined)
        throw new FaceDetectorError('No such image.', 'image');
      return value;
    });
    TestBed.configureTestingModule({
      providers: [
        { provide: MatDialog, useValue: { open } },
        { provide: DirectoryTreeViewDataService, useValue: { dataReplaced } },
        { provide: FaceDetectorService, useValue: { score } },
        {
          provide: FaceSearchImageDecoder,
          useValue: { decode: async (url: string) => {
            await decodingHeld.get(url);
            if (undecodable.has(url))
              throw new Error('The image cannot be decoded.');
            return { url, close: () => {} };
          } },
        },
        {
          provide: HeifThumbnailService,
          useValue: {
            watch: vi.fn(),
            stateOf: (path: string) => thumbnails.has(path) ? { kind: 'generated', filePath: thumbnails.get(path) }
              : { kind: 'pending', provisionalUrl: null },
          },
        },
      ],
    });
    select = vi.spyOn(TestBed.inject(DirectoryTreeViewSelectionService), 'select');
    updateMenu = vi.spyOn(window.plm.menus, 'updateNarrowDownToPhotosWithFaces');
    haveRegions = vi.spyOn(window.plm.faceRegions, 'have').mockImplementation(async paths => paths.map(path => regions.has(path)));
    service = TestBed.inject(FaceSearchService);
  });

  afterEach(() => vi.restoreAllMocks());

  it('keeps selected the photos in which a face is found, as one step that Undo takes back, and closes its dialog', async () => {
    const [a, b, c] = [photo('/trip/a.jpg'), photo('/trip/b.jpg'), photo('/trip/c.png')];
    scores.set(photoFileUrl(a.path), 0.93).set(photoFileUrl(b.path), 0.38).set(photoFileUrl(c.path), 0.8);
    selectPhotos([a, b, c]);

    await service.narrowDownSelectedPhotos();

    expect(select).toHaveBeenCalledTimes(1);
    expect(select).toHaveBeenCalledWith([a.path, c.path]);
    expect(open).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
    expect(state()).toEqual({ kind: 'searching', done: 3, total: 3, waitingForThumbnails: false });
  });

  it('takes a photo whose metadata marks a face as having one, without looking at it, for JPEG files only', async () => {
    const [tagged, other, heif] = [photo('/trip/tagged.JPG'), photo('/trip/other.jpg'), photo('/trip/c.heic')];
    regions.add(tagged.path).add(heif.path);
    scores.set(photoFileUrl(other.path), 0.1);
    thumbnails.set(heif.path, '/cache/c.heic.plm.jpg');
    scores.set(photoFileUrl('/cache/c.heic.plm.jpg'), 0.2);
    selectPhotos([tagged, other, heif]);

    await service.narrowDownSelectedPhotos();

    expect(haveRegions).toHaveBeenCalledWith([tagged.path, other.path]);
    expect(score.mock.calls.map(([image]) => image.url)).toEqual([photoFileUrl(other.path), photoFileUrl('/cache/c.heic.plm.jpg')]);
    expect(select).toHaveBeenCalledWith([tagged.path]);
  });

  it('asks about the metadata of 100 photos at a time', async () => {
    const photos = Array.from({ length: 250 }, (_, index) => photo(`/trip/${index}.jpg`));
    photos.forEach(each => regions.add(each.path));
    selectPhotos(photos);

    await service.narrowDownSelectedPhotos();

    expect(haveRegions.mock.calls.map(([paths]) => paths.length)).toEqual([100, 100, 50]);
    expect(score).not.toHaveBeenCalled();
    expect(select).toHaveBeenCalledWith(photos.map(each => each.path));
  });

  it('keeps what it found while the folder is open, and looks again once another folder is opened', async () => {
    const [a, b] = [photo('/trip/a.jpg'), photo('/trip/b.jpg')];
    scores.set(photoFileUrl(a.path), 0.9).set(photoFileUrl(b.path), 0.1);
    selectPhotos([a, b]);
    await service.narrowDownSelectedPhotos();
    expect(score).toHaveBeenCalledTimes(2);

    // Undo selects both again; the search knows them, so it narrows down at once, without a dialog.
    selectPhotos([a, b]);
    await service.narrowDownSelectedPhotos();
    expect(score).toHaveBeenCalledTimes(2);
    expect(open).toHaveBeenCalledTimes(1);
    expect(select).toHaveBeenLastCalledWith([a.path]);

    dataReplaced.next([]);
    await service.narrowDownSelectedPhotos();
    expect(score).toHaveBeenCalledTimes(4);
  });

  it('leaves the selection as it is when no selected photo has a face, and says so', async () => {
    const [a, b] = [photo('/trip/a.jpg'), photo('/trip/b.jpg')];
    scores.set(photoFileUrl(a.path), 0.1).set(photoFileUrl(b.path), 0.79);
    selectPhotos([a, b]);

    await service.narrowDownSelectedPhotos();

    expect(select).not.toHaveBeenCalled();
    expect(state()).toEqual({ kind: 'noFacesFound' });
    expect(close).not.toHaveBeenCalled();
  });

  it('deselects a photo that it could not look at, says how many, and looks at it again the next time', async () => {
    const [a, broken, unreadable] = [photo('/trip/a.jpg'), photo('/trip/broken.jpg'), photo('/trip/unreadable.jpg')];
    scores.set(photoFileUrl(a.path), 0.9).set(photoFileUrl(broken.path), 0.9);
    undecodable.add(photoFileUrl(broken.path));
    selectPhotos([a, broken, unreadable]);

    await service.narrowDownSelectedPhotos();

    expect(select).toHaveBeenCalledWith([a.path]);
    expect(state()).toEqual({ kind: 'notLookedAt', count: 2 });

    // What kept a photo from being looked at may pass: the file was being written, say.
    undecodable.clear();
    await service.narrowDownSelectedPhotos();
    expect(score.mock.calls.map(([image]) => image.url)).toEqual([
      photoFileUrl(a.path), photoFileUrl(unreadable.path), photoFileUrl(broken.path), photoFileUrl(unreadable.path)]);
    expect(select).toHaveBeenLastCalledWith([a.path, broken.path]);
    expect(state()).toEqual({ kind: 'notLookedAt', count: 1 });
  });

  it('looks at a TIFF file\'s EXIF thumbnail, and cannot look at one without', async () => {
    const [withThumbnail, without] = [photo('/trip/a.tif', 'blob:plm-app://app/thumbnail'), photo('/trip/b.tiff')];
    scores.set('blob:plm-app://app/thumbnail', 0.95);
    selectPhotos([withThumbnail, without]);

    await service.narrowDownSelectedPhotos();

    expect(select).toHaveBeenCalledWith([withThumbnail.path]);
    expect(state()).toEqual({ kind: 'notLookedAt', count: 1 });
  });

  it('waits for the thumbnail of a HEIF photo, and says so while it waits', async () => {
    const [jpeg, heif] = [photo('/trip/a.jpg'), photo('/trip/b.HEIC')];
    scores.set(photoFileUrl(jpeg.path), 0.1).set(photoFileUrl('/cache/b.HEIC.plm.jpg'), 0.9);
    selectPhotos([heif, jpeg]);

    const searching = service.narrowDownSelectedPhotos();
    await vi.waitFor(() => expect(state()).toEqual({ kind: 'searching', done: 1, total: 2, waitingForThumbnails: true }));
    thumbnails.set(heif.path, '/cache/b.HEIC.plm.jpg');
    await searching;

    expect(TestBed.inject(HeifThumbnailService).watch).toHaveBeenCalledWith(heif.path);
    expect(select).toHaveBeenCalledWith([heif.path]);
  });

  it('leaves the selection as it is when canceled, and keeps what it found until then', async () => {
    const [a, b] = [photo('/trip/a.jpg'), photo('/trip/b.jpg')];
    scores.set(photoFileUrl(a.path), 0.9).set(photoFileUrl(b.path), 0.9);
    let release: () => void;
    const held = new Promise<void>(resolve => release = resolve);
    score.mockImplementationOnce(async () => { await held; return 0.9; });
    selectPhotos([a, b]);

    const searching = service.narrowDownSelectedPhotos();
    await vi.waitFor(() => expect(score).toHaveBeenCalledTimes(2));
    service.cancel();
    release();
    await searching;

    expect(select).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledTimes(1);
    // The photos looked at before the search ended are not looked at again.
    await service.narrowDownSelectedPhotos();
    expect(score).toHaveBeenCalledTimes(2);
    expect(select).toHaveBeenCalledWith([a.path, b.path]);
  });

  it('does not keep what it found in a photo of a folder that is no longer open', async () => {
    const a = photo('/trip/a.jpg');
    scores.set(photoFileUrl(a.path), 0.9);
    let release: () => void;
    const held = new Promise<void>(resolve => release = resolve);
    score.mockImplementationOnce(async () => { await held; return 0.9; });
    selectPhotos([a]);

    const searching = service.narrowDownSelectedPhotos();
    await vi.waitFor(() => expect(score).toHaveBeenCalledTimes(1));
    // A folder of the same path opens while the photo is looked at: its photo may be another one.
    dataReplaced.next([]);
    release();
    await searching;
    expect(select).not.toHaveBeenCalled();

    await service.narrowDownSelectedPhotos();
    expect(score).toHaveBeenCalledTimes(2);
    expect(select).toHaveBeenCalledWith([a.path]);
  });

  it('stops looking at the other photo when the detector fails, and keeps saying that faces could not be looked for', async () => {
    const [a, b] = [photo('/trip/a.jpg'), photo('/trip/b.jpg')];
    scores.set(photoFileUrl(b.path), 0.9);
    let release: () => void;
    decodingHeld.set(photoFileUrl(b.path), new Promise<void>(resolve => release = resolve));
    score.mockRejectedValueOnce(new FaceDetectorError('TypeError: Failed to fetch', 'model'));
    selectPhotos([a, b]);

    const searching = service.narrowDownSelectedPhotos();
    await vi.waitFor(() => expect(score).toHaveBeenCalledTimes(1));
    // The search ends once the photo that is still decoded has stopped too: its end changes nothing that the dialog says.
    release();
    await searching;
    expect(score).toHaveBeenCalledTimes(1);
    expect(state()).toEqual({ kind: 'failed' });
    expect(select).not.toHaveBeenCalled();

    // The next search looks at both photos, as nothing was kept of them.
    decodingHeld.clear();
    scores.set(photoFileUrl(a.path), 0.1);
    await service.narrowDownSelectedPhotos();
    expect(score).toHaveBeenCalledTimes(3);
    expect(select).toHaveBeenCalledWith([b.path]);
  });

  it('keeps nothing of a photo whose decoding failed after the search had failed, and looks at it the next time', async () => {
    const [a, b] = [photo('/trip/a.jpg'), photo('/trip/b.jpg')];
    scores.set(photoFileUrl(a.path), 0.1).set(photoFileUrl(b.path), 0.9);
    let failDecoding: () => void;
    decodingHeld.set(photoFileUrl(b.path), new Promise<void>((_, reject) => failDecoding = () => reject(new Error('Busy.'))));
    score.mockRejectedValueOnce(new FaceDetectorError('TypeError: Failed to fetch', 'model'));
    selectPhotos([a, b]);

    const searching = service.narrowDownSelectedPhotos();
    await vi.waitFor(() => expect(score).toHaveBeenCalledTimes(1));
    failDecoding();
    await searching;
    expect(state()).toEqual({ kind: 'failed' });

    decodingHeld.clear();
    await service.narrowDownSelectedPhotos();
    expect(score).toHaveBeenCalledTimes(3);
    expect(select).toHaveBeenCalledWith([b.path]);
    expect(state()).toEqual({ kind: 'searching', done: 2, total: 2, waitingForThumbnails: false });
  });

  it('ignores the item while a search runs', async () => {
    const a = photo('/trip/a.jpg');
    scores.set(photoFileUrl(a.path), 0.9);
    selectPhotos([a]);

    await Promise.all([service.narrowDownSelectedPhotos(), service.narrowDownSelectedPhotos()]);

    expect(score).toHaveBeenCalledTimes(1);
    expect(select).toHaveBeenCalledTimes(1);
  });

  it('says that faces could not be looked for when the detector fails, and records the error without any photo', async () => {
    const error = vi.spyOn(Logger, 'error');
    const a = photo('/trip/a.jpg');
    score.mockRejectedValue(new FaceDetectorError('TypeError: Failed to fetch', 'model'));
    selectPhotos([a]);

    await service.narrowDownSelectedPhotos();

    expect(select).not.toHaveBeenCalled();
    expect(state()).toEqual({ kind: 'failed' });
    expect(error).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(error.mock.calls[0], (key, value) => value instanceof Error ? value.message : value)).not.toContain('/trip/');
  });

  it('enables the menu\'s item while a photo is selected', () => {
    TestBed.tick();
    expect(updateMenu).toHaveBeenLastCalledWith({ isEnabled: false });
    selectPhotos([photo('/trip/a.jpg')]);
    TestBed.tick();
    expect(updateMenu).toHaveBeenLastCalledWith({ isEnabled: true });
    selectPhotos([]);
    TestBed.tick();
    expect(updateMenu).toHaveBeenLastCalledWith({ isEnabled: false });
  });
});
