import { inject, Service, signal, WritableSignal } from '@angular/core';
import { FilenameExtension } from '../../../src-shared/filename-extension/filename-extension';
import { createPrependedLogger } from '../../../src-shared/log/create-prepended-logger';
import { logged } from '../../../src-shared/log/logged-line';
import { isFilePathTooLongOnWindows } from '../../../src-shared/max-file-path-length-on-windows/max-file-path-length-on-windows';
import { Photo } from '../shared/model/photo.model';
import { JpegPngImageSource } from './jpeg-png-image-source';

const logger = createPrependedLogger('[JPEG/PNG Thumbnail]');

/** What a JPEG or PNG photo without a thumbnail in its EXIF data shows as its thumbnail. */
export type JpegPngThumbnailState =
  /** Not made yet: it waits to be made, or is being made. */
  | { readonly kind: 'pending' }
  /** Made, and in the cache. */
  | { readonly kind: 'cached', readonly filePath: string }
  /** Made, but not in the cache, which could not be written: an object URL of the JPEG, kept for the folder. */
  | { readonly kind: 'decoded', readonly url: string }
  /**
   * The photo itself, as every such photo showed before: the page cannot make a thumbnail, the file could not be
   * decoded, or the thumbnail's path would be too long for Windows.
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

/** Whether the app makes the photo's thumbnail: a JPEG or PNG file without one in its EXIF data. */
export function needsMadeThumbnail(photo: Photo): boolean {
  return FilenameExtension.isDisplayableInBrowser(photo.filenameExtension) && !photo.exif?.thumbnail;
}

/** Whether the decoder refused the file's data, which would be refused again until the file changes. */
function isRefusedData(error: unknown): boolean {
  return error instanceof DOMException && (error.name === 'EncodingError' || error.name === 'NotSupportedError');
}

/**
 * The thumbnails of the opened folder's JPEG and PNG photos that have none in their EXIF data, which the page made
 * by showing the whole photo: made in the page, kept in the cache, and shown from it.
 * TL;DR: Those that a place shows are made first, the last asked for first; then the folder's others, one at a time,
 * so that the next time it is opened every thumbnail is in the cache.
 * Details:
 * - Each photo shown loaded its whole file into the page, which kept it for the rest of the session: 8.7 GB for a
 *   folder of 2,000 photos of 12 megapixels, which Chromium kept in a file of its own, and in memory where it could
 *   not write that file, as on a full disk (docs/tasks/20261121_full-file-thumbnails/STATUS.md). A thumbnail of the
 *   cache is 50 to 70 KB.
 * - The main process reads the photo, and the page decodes it to a JPEG of 400 pixels (jpeg-png-image-decoding.ts):
 *   25 ms for 12 megapixels on an Apple M5, 75 ms for 48. The main process keeps the JPEG in the cache, beside the
 *   thumbnails of HEIF photos, with the time that the photo had when it was read
 *   (src-main/thumbnail-generation/jpeg-png-thumbnail-files.ts).
 * - A place asks for its photo once it comes near the view: a row of the tree or a tile of a cluster's popup by its
 *   NearViewDirective, a marker's popup at once. The photos asked for in one turn are made in the order that they
 *   asked, the first rows of a folder expanded first, and those of a later turn before them, as a scroll brings
 *   them nearer.
 * - Each photo has a signal of its own, so that a thumbnail made renders only the places of its photo.
 * - A photo whose thumbnail cannot be made shows itself, as before; the cache says so for one whose file the decoder
 *   refused, so that it is not tried again until the file changes.
 */
@Service()
export class JpegPngThumbnailService {
  private readonly source = inject(JpegPngImageSource);

  private states = new Map<string, WritableSignal<JpegPngThumbnailState>>();
  /** The photos whose thumbnails wait to be made. */
  private readonly waiting = new Set<string>();
  /** The photos that the places asked for in this turn, in the order that they asked. */
  private readonly askedInThisTurn: string[] = [];
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
    return this.signalOf(photoPath)();
  }

  /**
   * Finds which of the folder's photos have their thumbnails in the cache, before the tree shows them: the others
   * wait to be made, for which watch() and startFolder() start. Never rejects: a photo that cannot be checked shows
   * itself.
   */
  public async prepare(photos: readonly Photo[]): Promise<void> {
    const generation = this.generation;
    const photoPaths = photos.filter(needsMadeThumbnail).map(photo => photo.path);
    if (photoPaths.length === 0)
      return;
    if (!this.source.canMake()) {
      logger.warn('The page has no ImageDecoder, so the JPEG and PNG photos without a thumbnail in their EXIF data show themselves.');
      photoPaths.forEach(photoPath => this.set(photoPath, photoItself));
      return;
    }

    const states = [];
    try {
      for (let start = 0; start < photoPaths.length; start += photosPerStateRequest)
        states.push(...await this.source.states(photoPaths.slice(start, start + photosPerStateRequest)));
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
        this.set(photoPath, { kind: 'cached', filePath: thumbnailFilePath });
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
    logger.info(`Of ${photoPaths.length} JPEG and PNG photos without a thumbnail in their EXIF data, ${cached} have theirs `
      + `in the cache, and ${toMake.length} are to be made.`);
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

  /** Makes the photo's thumbnail before the folder's others, as a place shows it, unless it is made or being made. */
  public watch(photoPath: string): void {
    if (!this.waiting.has(photoPath))
      return;
    this.askedInThisTurn.push(photoPath);
    if (this.askedInThisTurn.length === 1)
      queueMicrotask(() => this.takeAskedInThisTurn());
  }

  /** Forgets every thumbnail, for another folder: those being made are dropped once their step ends. */
  public reset(): void {
    this.generation++;
    clearTimeout(this.folderTimer);
    this.states = new Map();
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
    const asked = this.askedInThisTurn.splice(0);
    for (let index = asked.length - 1; index >= 0; index--)
      this.asked.push(asked[index]);
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
        jpeg = await this.source.makeThumbnail(photo.bytes, photoPath);
      } catch (error) {
        logger.warn(logged`The thumbnail of "${photoPath}" could not be made, so the photo itself is shown: ${error}`);
        if (isRefusedData(error))
          await this.source.save(photoPath, photo.lastModified, null);
        show(photoItself);
        return;
      }

      const bytes = new Uint8Array(await jpeg.arrayBuffer());
      if (generation !== this.generation)
        return;
      try {
        show({ kind: 'cached', filePath: await this.source.save(photoPath, photo.lastModified, bytes) });
      } catch (error) {
        logger.warn(logged`The thumbnail of "${photoPath}" could not be kept in the cache, so it is shown until another folder is opened: ${error}`);
        if (generation === this.generation) {
          const url = URL.createObjectURL(jpeg);
          this.objectUrls.add(url);
          show({ kind: 'decoded', url });
        }
      }
    } catch (error) {
      logger.error(logged`Failed to make the thumbnail of "${photoPath}", so the photo itself is shown.`, error);
      show(photoItself);
    }
  }
}
