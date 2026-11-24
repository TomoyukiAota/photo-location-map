import { inject, Service, signal, untracked, WritableSignal } from '@angular/core';
import { FilenameExtension } from '../../../src-shared/filename-extension/filename-extension';
import { createPrependedLogger } from '../../../src-shared/log/create-prepended-logger';
import { logged } from '../../../src-shared/log/logged-line';
import { isFilePathTooLongOnWindows } from '../../../src-shared/max-file-path-length-on-windows/max-file-path-length-on-windows';
import { ThumbnailQuality } from '../../../src-shared/user-settings/thumbnail-quality';
import { Photo } from '../shared/model/photo.model';
import { ThumbnailSizeService } from '../shared/thumbnail-size/thumbnail-size.service';
import { JpegPngImageSource } from './jpeg-png-image-source';

const logger = createPrependedLogger('[JPEG/PNG Thumbnail]');

/** What a JPEG or PNG photo whose thumbnail the app makes shows as its thumbnail (needsMadeThumbnail). */
export type JpegPngThumbnailState =
  /** Not made yet: it waits to be made, or is being made. */
  | { readonly kind: 'pending' }
  /** Made, and in the cache, at `longerSide`, which its address says (madeThumbnailUrl). */
  | { readonly kind: 'cached', readonly filePath: string, readonly longerSide: number }
  /** Made, but not in the cache, which could not be written: an object URL of the JPEG, kept for the folder. */
  | { readonly kind: 'decoded', readonly url: string }
  /**
   * The photo itself, as every such photo without an EXIF thumbnail showed before, or the EXIF thumbnail of one that
   * has one: the page cannot make a thumbnail, the file could not be decoded, or the thumbnail's path would be too long
   * for Windows.
   */
  | { readonly kind: 'photoItself' };

const pending: JpegPngThumbnailState = { kind: 'pending' };
const photoItself: JpegPngThumbnailState = { kind: 'photoItself' };

/** How many thumbnails are made at a time: two keep the decoder busy while the next photo is read. */
const lanes = 2;
/** How many of them the photos that no place shows may take: a photo that comes into view then waits for none. */
const backgroundLanes = 1;
/** How long after the folder's tree is shown its other photos start to be made: once the tree's first are. */
export const backgroundStartDelayMs = 1000;
/** How many photos one request asks the main process about, so that it answers other requests between them. */
const photosPerStateRequest = 1000;

/**
 * Whether the app makes the photo's thumbnail, of `longerSide` pixels at `quality`: a JPEG or PNG file without one in
 * its EXIF data, and at High quality one whose EXIF thumbnail is smaller than that, which a place would show stretched
 * (src-shared/user-settings/thumbnail-quality.ts). A camera's is 160 x 120 in most photos.
 */
export function needsMadeThumbnail(photo: Photo, quality: ThumbnailQuality, longerSide: number): boolean {
  if (!FilenameExtension.isDisplayableInBrowser(photo.filenameExtension))
    return false;
  const exifThumbnail = photo.exif?.thumbnail;
  if (!exifThumbnail)
    return true;
  const { width, height } = exifThumbnail.dimensions ?? { width: 0, height: 0 };
  return quality === 'high' && Math.max(width, height) < longerSide;
}

/** Whether the decoder refused the file's data, which would be refused again until the file changes. */
function isRefusedData(error: unknown): boolean {
  return error instanceof DOMException && (error.name === 'EncodingError' || error.name === 'NotSupportedError');
}

/**
 * The thumbnails that the app makes of the opened folder's JPEG and PNG photos (needsMadeThumbnail): of those that have
 * none in their EXIF data, which the page made by showing the whole photo, and at High quality of those whose EXIF
 * thumbnail is smaller than the chosen size; made in the page, kept in the cache, and shown from it.
 * TL;DR: Those that a place shows are made first, the last asked for first; then the folder's others, one at a time,
 * so that the next time it is opened every thumbnail is in the cache. They are made at the size that the settings
 * chose when the folder was opened, or when the settings were saved since (applySettings).
 * Details:
 * - Each photo shown loaded its whole file into the page, which kept it for the rest of the session: 8.7 GB for a
 *   folder of 2,000 photos of 12 megapixels, which Chromium kept in a file of its own, and in memory where it could
 *   not write that file, as on a full disk (docs/tasks/20261121_full-file-thumbnails/STATUS.md). A thumbnail of the
 *   cache is 50 to 70 KB.
 * - The main process reads the photo, and the page decodes it to a JPEG of the chosen size, 400 pixels by default
 *   (jpeg-png-image-decoding.ts): 25 ms for 12 megapixels on an Apple M5, 75 ms for 48. The main process keeps the
 *   JPEG in the cache, beside the thumbnails of HEIF photos, with the time that the photo had when it was read and the
 *   size (src-main/thumbnail-generation/jpeg-png-thumbnail-files.ts).
 * - A place asks for its photo once it comes near the view: a row of the tree or a tile of a cluster's popup by its
 *   NearViewDirective, a marker's popup at once. The photos asked for in one turn are made nearest first, as a row
 *   tells how far it was from the window's middle, then in the order that they asked: the rows in view before those
 *   that a jump brought near above them, the first tiles of a popup first. Those of a later turn are made before
 *   them, as a scroll brings them nearer.
 * - Each photo has a signal of its own, so that a thumbnail made renders only the places of its photo.
 * - A photo whose thumbnail cannot be made shows itself, as before, or its EXIF thumbnail where it has one; the cache
 *   says so for one whose file the decoder refused, so that it is not tried again until the file or the size
 *   changes.
 */
@Service()
export class JpegPngThumbnailService {
  private readonly source = inject(JpegPngImageSource);
  private readonly thumbnailSizeService = inject(ThumbnailSizeService);

  private states = new Map<string, WritableSignal<JpegPngThumbnailState>>();
  /**
   * Changes when the photos' states are made anew, for another folder or new settings, so that the places that read
   * a photo's state read its new one: each photo's signal is a new one then.
   */
  private readonly epoch = signal(0);
  /** The folder's photos, which the thumbnails are made of again for new settings. */
  private photos: readonly Photo[] = [];
  /** The quality and the size that the folder's thumbnails are made at, which the settings had when they were asked. */
  private madeAt: { readonly quality: ThumbnailQuality, readonly longerSide: number } = { quality: 'high', longerSide: 400 };
  /** The photos whose thumbnails wait to be made. */
  private readonly waiting = new Set<string>();
  /** The photos that the places asked for in this turn, in the order that they asked, with how near each was. */
  private readonly askedInThisTurn: { photoPath: string, distance: number }[] = [];
  /** The photos that the places asked for, taken from the end: each turn's put on in reverse. */
  private readonly asked: string[] = [];
  /** The folder's photos to make, in its order, which are made from `nextOfFolder` on once no place asks for any. */
  private ofFolder: readonly string[] = [];
  private nextOfFolder = 0;
  private isFolderStarted = false;
  private folderTimer: ReturnType<typeof setTimeout> | undefined;
  private busyLanes = 0;
  private busyFolderLanes = 0;
  /** Counts the folders, so that what was being made for the previous one changes nothing of this one. */
  private generation = 0;
  private readonly objectUrls = new Set<string>();
  /** For the log: how many of the folder's photos are left to be made, and when they started. */
  private left = 0;
  private startedAt = 0;

  /** The photo's thumbnail now. */
  public stateOf(photoPath: string): JpegPngThumbnailState {
    this.epoch();
    return this.signalOf(photoPath)();
  }

  /**
   * Finds which of the folder's photos have their thumbnails in the cache, at the size that the settings choose,
   * before the tree shows them: the others wait to be made, for which watch() and startFolder() start. Never rejects:
   * a photo that cannot be checked shows itself, or its EXIF thumbnail.
   */
  public async prepare(photos: readonly Photo[]): Promise<void> {
    const generation = this.generation;
    this.photos = photos;
    const quality = untracked(this.thumbnailSizeService.quality);
    const longerSide = untracked(this.thumbnailSizeService.longerSide);
    this.madeAt = { quality, longerSide };
    const photoPaths = photos.filter(photo => needsMadeThumbnail(photo, quality, longerSide)).map(photo => photo.path);
    if (photoPaths.length === 0)
      return;
    if (!this.source.canMake()) {
      logger.warn('The page has no ImageDecoder, so the JPEG and PNG photos whose thumbnails the app makes show themselves, or their EXIF thumbnails.');
      photoPaths.forEach(photoPath => this.set(photoPath, photoItself));
      return;
    }

    const states = [];
    try {
      for (let start = 0; start < photoPaths.length; start += photosPerStateRequest)
        states.push(...await this.source.states(photoPaths.slice(start, start + photosPerStateRequest), longerSide));
    } catch (error) {
      logger.error(logged`Failed to check the thumbnail cache for ${photoPaths.length} JPEG and PNG photos, which show themselves.`, error);
      if (generation === this.generation)
        photoPaths.forEach(photoPath => this.set(photoPath, photoItself));
      return;
    }
    if (generation !== this.generation)
      return;

    const toMake: string[] = [];
    let cached = 0;
    photoPaths.forEach((photoPath, index) => {
      const { cacheAvailable, attemptFinished, thumbnailFilePath } = states[index];
      if (isFilePathTooLongOnWindows(thumbnailFilePath)) {
        this.set(photoPath, photoItself);
      } else if (cacheAvailable) {
        this.set(photoPath, { kind: 'cached', filePath: thumbnailFilePath, longerSide });
        cached++;
      } else if (attemptFinished) {
        this.set(photoPath, photoItself);
      } else {
        this.waiting.add(photoPath);
        toMake.push(photoPath);
      }
    });
    this.ofFolder = toMake;
    this.nextOfFolder = 0;
    this.left = toMake.length;
    this.startedAt = performance.now();
    logger.info(`Of ${photoPaths.length} JPEG and PNG photos whose thumbnails are made at ${longerSide} pixels (${quality}), `
      + `${cached} have theirs in the cache, and ${toMake.length} are to be made.`);
    this.epoch.update(epoch => epoch + 1);
  }

  /**
   * Makes the folder's thumbnails again for the settings as they were saved, as when the size changed: those in the
   * cache at the new size are shown from it, and the others are made, those that a place shows first.
   */
  public async applySettings(): Promise<void> {
    const photos = this.photos;
    this.reset();
    await this.prepare(photos);
    this.startFolder();
  }

  /** Starts making the thumbnails of the folder's photos that no place asks for, once its tree has shown its first. */
  public startFolder(): void {
    const generation = this.generation;
    clearTimeout(this.folderTimer);
    this.folderTimer = setTimeout(() => {
      if (generation !== this.generation)
        return;
      this.isFolderStarted = true;
      this.makeNext();
    }, backgroundStartDelayMs);
  }

  /**
   * Makes the photo's thumbnail before the folder's others, as a place shows it, unless it is made or being made:
   * before those asked for in the same turn that are farther than `distance` from what is shown, in pixels.
   */
  public watch(photoPath: string, distance = 0): void {
    if (!this.waiting.has(photoPath))
      return;
    this.askedInThisTurn.push({ photoPath, distance });
    if (this.askedInThisTurn.length === 1)
      queueMicrotask(() => this.takeAskedInThisTurn());
  }

  /** Forgets every thumbnail, for another folder: those being made are dropped once their step ends. */
  public reset(): void {
    this.generation++;
    clearTimeout(this.folderTimer);
    this.states = new Map();
    this.photos = [];
    this.epoch.update(epoch => epoch + 1);
    this.waiting.clear();
    this.askedInThisTurn.length = 0;
    this.asked.length = 0;
    this.ofFolder = [];
    this.nextOfFolder = 0;
    this.isFolderStarted = false;
    this.left = 0;
    for (const url of this.objectUrls)
      URL.revokeObjectURL(url);
    this.objectUrls.clear();
  }

  private signalOf(photoPath: string): WritableSignal<JpegPngThumbnailState> {
    if (!this.states.has(photoPath))
      this.states.set(photoPath, signal(pending));
    return this.states.get(photoPath);
  }

  private set(photoPath: string, state: JpegPngThumbnailState): void {
    this.signalOf(photoPath).set(state);
  }

  private takeAskedInThisTurn(): void {
    // The nearest first, and those as near in the order that they asked, as sort() keeps it.
    const asked = this.askedInThisTurn.splice(0).sort((a, b) => a.distance - b.distance);
    for (let index = asked.length - 1; index >= 0; index--)
      this.asked.push(asked[index].photoPath);
    this.makeNext();
  }

  private nextAsked(): string | undefined {
    while (this.asked.length > 0) {
      const photoPath = this.asked.pop();
      if (this.waiting.has(photoPath))
        return photoPath;
    }
    return undefined;
  }

  private nextOfFolderToMake(): string | undefined {
    while (this.nextOfFolder < this.ofFolder.length) {
      const photoPath = this.ofFolder[this.nextOfFolder++];
      if (this.waiting.has(photoPath))
        return photoPath;
    }
    return undefined;
  }

  private makeNext(): void {
    while (this.busyLanes < lanes) {
      let photoPath = this.nextAsked();
      const isOfFolder = photoPath === undefined;
      if (isOfFolder) {
        if (!this.isFolderStarted || this.busyFolderLanes >= backgroundLanes)
          return;
        photoPath = this.nextOfFolderToMake();
        if (photoPath === undefined)
          return;
      }
      this.waiting.delete(photoPath);
      this.busyLanes++;
      if (isOfFolder)
        this.busyFolderLanes++;
      const generation = this.generation;
      void this.make(photoPath, generation).finally(() => {
        this.busyLanes--;
        if (isOfFolder)
          this.busyFolderLanes--;
        if (generation === this.generation && --this.left === 0)
          logger.info(`Made the thumbnails of the folder's JPEG and PNG photos in ${Math.round(performance.now() - this.startedAt)} ms.`);
        this.makeNext();
      });
    }
  }

  /** Makes the photo's thumbnail, keeps it in the cache and shows it, unless another folder is opened meanwhile. */
  private async make(photoPath: string, generation: number): Promise<void> {
    const { longerSide } = this.madeAt;
    const show = (state: JpegPngThumbnailState) => {
      if (generation === this.generation)
        this.set(photoPath, state);
    };
    try {
      const photo = await this.source.readPhoto(photoPath);
      if (generation !== this.generation)
        return;
      if (!photo) {
        show(photoItself);
        return;
      }

      let jpeg: Blob;
      try {
        jpeg = await this.source.makeThumbnail(photo.bytes, photoPath, longerSide);
      } catch (error) {
        logger.warn(logged`The thumbnail of "${photoPath}" could not be made, so the photo itself, or its EXIF thumbnail, is shown: ${error}`);
        if (isRefusedData(error))
          await this.source.save(photoPath, photo.lastModified, null, longerSide);
        show(photoItself);
        return;
      }

      const bytes = new Uint8Array(await jpeg.arrayBuffer());
      if (generation !== this.generation)
        return;
      try {
        show({ kind: 'cached', filePath: await this.source.save(photoPath, photo.lastModified, bytes, longerSide), longerSide });
      } catch (error) {
        logger.warn(logged`The thumbnail of "${photoPath}" could not be kept in the cache, so it is shown until another folder is opened: ${error}`);
        if (generation === this.generation) {
          const url = URL.createObjectURL(jpeg);
          this.objectUrls.add(url);
          show({ kind: 'decoded', url });
        }
      }
    } catch (error) {
      logger.error(logged`Failed to make the thumbnail of "${photoPath}", so the photo itself, or its EXIF thumbnail, is shown.`, error);
      show(photoItself);
    }
  }
}
