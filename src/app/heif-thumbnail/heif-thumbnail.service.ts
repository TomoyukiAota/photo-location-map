import { inject, Service, signal } from '@angular/core';
import { createPrependedLogger } from '../../../src-shared/log/create-prepended-logger';
import { logged } from '../../../src-shared/log/logged-line';
import { currentUserSettings } from '../../../src-shared/user-settings/user-settings';
import { GeneratedThumbnailService } from '../photo-info-viewer/generated-thumbnail.service';
import { ThumbnailGenerationService } from '../thumbnail-generation/service/thumbnail-generation.service';
import { HeifImageSource } from './heif-image-source';

const logger = createPrependedLogger('[HEIF Thumbnail]');

/** What a HEIF photo's thumbnail is now. */
export type HeifThumbnailState =
  /** Being made; the photo's small thumbnail is shown meanwhile, once the page has it. */
  | { readonly kind: 'pending', readonly provisionalUrl: string | null }
  /** Made by the page: an object URL of a JPEG. */
  | { readonly kind: 'decoded', readonly url: string }
  /** Made by the main process, in the cache; the file is not there when it could not be made. */
  | { readonly kind: 'generated', readonly filePath: string };

interface PhotoState {
  readonly provisionalUrl?: string;
  readonly decodedUrl?: string;
  /** Whether the thumbnail is the main process's. */
  readonly generated?: boolean;
}

/** How many photos the page makes the images of at a time: two keep the decoder busy while one is read. */
const lanes = 2;

/**
 * The thumbnails of the HEIF photos of the opened folder, which the page cannot show as they are: made when a place
 * shows a photo (watch), and kept until another folder opens or the setting of their quality changes.
 * TL;DR: The photo's small thumbnail first, which takes a few milliseconds; then, for the high quality, the whole image
 * at 400 pixels, which the page decodes with WebCodecs where it can, in 20 to 35 ms, and the main process makes where
 * it cannot, in 0.6 to 2 seconds, as it always did (ThumbnailGenerationService). A thumbnail in the cache is shown as
 * it is.
 * Details:
 * - The fast quality keeps the small thumbnail: 320x240 for an iPhone's photo of 12 megapixels, 416x312 for 24 and
 *   576x432 for 48. A photo that holds none, as one converted by macOS's sips, gets its thumbnail from the whole image
 *   either way; 0.5% of the iPhone photos looked at had none, which seemed to have been edited.
 * - The photos wait in two stacks, the small thumbnails before the whole images, the photo shown last first: the rows
 *   that a scroll brings near are made before those that it passed, and every shown photo has its small thumbnail
 *   before any has its whole image.
 * - The thumbnails are JPEGs of quality 0.92, as the generation's, kept as object URLs, about 23 KB each for the small
 *   thumbnail of a 12-megapixel photo and 50 KB at 400 pixels, as the Exif thumbnails of JPEG photos are kept.
 */
@Service()
export class HeifThumbnailService {
  private readonly generatedThumbnailService = inject(GeneratedThumbnailService);
  private readonly thumbnailGenerationService = inject(ThumbnailGenerationService);
  private readonly images = inject(HeifImageSource);

  private readonly photos = signal<ReadonlyMap<string, PhotoState>>(new Map());
  private readonly watched = new Set<string>();
  private readonly smallThumbnailsToMake: string[] = [];
  private readonly wholeImagesToMake: string[] = [];
  private busyLanes = 0;
  /** Counts the folders and settings, so that what was being made for the previous one is dropped. */
  private generation = 0;
  private readonly objectUrls = new Set<string>();

  /** The photo's thumbnail now; watch() makes it. */
  public stateOf(photoPath: string): HeifThumbnailState {
    const state = this.photos().get(photoPath);
    if (state?.decodedUrl)
      return { kind: 'decoded', url: state.decodedUrl };
    if (state?.generated) {
      const filePath = this.generatedThumbnailService.filePathOf(photoPath);
      // A thumbnail that the main process could not make leaves the small one, which it would otherwise replace.
      if (filePath !== undefined && state.provisionalUrl && this.generatedThumbnailService.hasFailed(photoPath))
        return { kind: 'decoded', url: state.provisionalUrl };
      if (filePath !== undefined)
        return { kind: 'generated', filePath };
    }
    return { kind: 'pending', provisionalUrl: state?.provisionalUrl ?? null };
  }

  /** Whether the photo's thumbnail is made: shown at its quality, or failed to be made by the main process. */
  public isFinished(photoPath: string): boolean {
    return this.stateOf(photoPath).kind !== 'pending';
  }

  /** Makes the photo's thumbnail, unless it is made or being made. */
  public watch(photoPath: string): void {
    if (this.watched.has(photoPath))
      return;
    this.watched.add(photoPath);
    if (this.thumbnailGenerationService.isCached(photoPath)) {
      this.useGenerated(photoPath);
      return;
    }
    this.smallThumbnailsToMake.push(photoPath);
    this.makeNext();
  }

  /** Forgets every thumbnail, for another folder. */
  public reset(): void {
    this.generation++;
    this.watched.clear();
    this.smallThumbnailsToMake.length = 0;
    this.wholeImagesToMake.length = 0;
    for (const url of this.objectUrls)
      URL.revokeObjectURL(url);
    this.objectUrls.clear();
    this.photos.set(new Map());
  }

  /**
   * Remakes the thumbnails for a new setting of their quality. The main process follows it first, dropping the
   * thumbnails that wait to be made or making the folder's, as the setting asks
   * (ThumbnailGenerationService.applyThumbnailQuality); then the shown photos ask for theirs again.
   * TL;DR: The thumbnails are forgotten only once the main process has followed the setting, as a photo asked for
   * before is made for the setting that the main process still has.
   * Details: The places that show a photo ask for its thumbnail again as soon as it is forgotten (watch). When the
   * fast thumbnails were chosen while the main process made the folder's, the photos were forgotten before it had
   * answered, and a photo asked for again was still one that the main process made (ThumbnailGenerationService.isMade).
   * It waited for its thumbnail of high quality and showed it once made, rather than the small one that the photo
   * holds, or waited for ever for one that the main process had dropped. The end-to-end test of the fast thumbnails
   * failed so once in CI, on Linux.
   */
  public async applyThumbnailQuality(): Promise<boolean> {
    logger.info(`The thumbnails of HEIF photos are made again, of the quality ${currentUserSettings.thumbnailQuality}.`);
    try {
      return await this.thumbnailGenerationService.applyThumbnailQuality();
    } finally {
      // Not before either: a photo that a place showed meanwhile may wait for a thumbnail that is no longer made.
      this.generatedThumbnailService.stopWaiting();
      this.reset();
    }
  }

  private update(photoPath: string, change: PhotoState): void {
    this.photos.update(photos => new Map(photos).set(photoPath, { ...photos.get(photoPath), ...change }));
  }

  private objectUrlOf(blob: Blob): string {
    const url = URL.createObjectURL(blob);
    this.objectUrls.add(url);
    return url;
  }

  private revoke(url: string | undefined): void {
    if (url === undefined)
      return;
    URL.revokeObjectURL(url);
    this.objectUrls.delete(url);
  }

  private useGenerated(photoPath: string): void {
    this.update(photoPath, { generated: true });
    this.generatedThumbnailService.watch(photoPath);
  }

  private makeNext(): void {
    while (this.busyLanes < lanes) {
      const smallThumbnail = this.smallThumbnailsToMake.pop();
      const wholeImage = smallThumbnail === undefined ? this.wholeImagesToMake.pop() : undefined;
      if (smallThumbnail === undefined && wholeImage === undefined)
        return;
      this.busyLanes++;
      const generation = this.generation;
      const made = smallThumbnail !== undefined ? this.makeSmallThumbnail(smallThumbnail, generation)
        : this.makeWholeImage(wholeImage, generation);
      void made
        .catch(error => logger.error(logged`Failed to make the thumbnail of "${smallThumbnail ?? wholeImage}".`, error))
        .finally(() => {
          this.busyLanes--;
          this.makeNext();
        });
    }
  }

  private async makeSmallThumbnail(photoPath: string, generation: number): Promise<void> {
    const isMadeByMainProcess = this.thumbnailGenerationService.isMade(photoPath);
    const blob = await this.images.embeddedThumbnail(photoPath);
    if (generation !== this.generation)
      return;
    const url = blob ? this.objectUrlOf(blob) : undefined;
    if (url && currentUserSettings.thumbnailQuality === 'fast' && !isMadeByMainProcess) {
      this.update(photoPath, { decodedUrl: url });
      return;
    }
    if (url)
      this.update(photoPath, { provisionalUrl: url });
    if (isMadeByMainProcess) {
      this.useGenerated(photoPath);
      return;
    }
    this.wholeImagesToMake.push(photoPath);
  }

  private async makeWholeImage(photoPath: string, generation: number): Promise<void> {
    const blob = await this.images.wholeImage(photoPath);
    if (generation !== this.generation)
      return;
    if (blob) {
      const provisionalUrl = this.photos().get(photoPath)?.provisionalUrl;
      this.update(photoPath, { decodedUrl: this.objectUrlOf(blob), provisionalUrl: undefined });
      this.revoke(provisionalUrl);
      return;
    }
    // The page cannot decode the image: the main process makes the thumbnail, while the small one stays shown.
    this.thumbnailGenerationService.generate(photoPath);
    this.useGenerated(photoPath);
  }
}
