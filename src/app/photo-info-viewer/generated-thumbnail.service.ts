import { Service, signal, untracked } from '@angular/core';
import { bridge } from '../../../src-shared/bridge/plm-bridge';
import { photoInfoViewerLogger as logger } from './photo-info-viewer-logger';
import { logged } from '../../../src-shared/log/logged-line';

/** How long after a check the next one asks about the thumbnails that are still being made. */
export const thumbnailCheckIntervalMs = 1000;

/**
 * The thumbnails that the main process makes of the photos that the page cannot show as they are, the HEIF photos:
 * where the file of each is, once the attempt to make it has finished.
 * TL;DR: One request asks the main process about all the awaited thumbnails together, at once for the first and then
 * every second while any is still being made. What is known of a thumbnail stays known until another folder is
 * opened.
 * Details: The main process checks its cache for the answer (src-main/thumbnail-generation/thumbnail-state.ts).
 * Before the viewer was a component, each element that showed such a photo asked for itself, every second from a
 * second after it was made, so a thumbnail that was in the cache already was shown a second late, and a folder of
 * such photos expanded in the tree sent a request per photo every second. A component that is made again, as a row
 * of the tree is when its folder is expanded again, finds the thumbnail here without asking.
 */
@Service()
export class GeneratedThumbnailService {
  /** The thumbnail's file by the photo's path, for the photos whose attempt has finished. */
  private readonly filePaths = signal<ReadonlyMap<string, string>>(new Map());
  private readonly awaitedPhotoPaths = new Set<string>();
  private timer: ReturnType<typeof setTimeout> | undefined;
  private isChecking = false;
  /** Counts the folders opened, so that an answer about the photos of the previous folder is dropped. */
  private folderNumber = 0;

  /**
   * The file of the photo's thumbnail, or undefined until the attempt to make it has finished, which watch() waits
   * for. The file is not there when the attempt failed.
   */
  public filePathOf(photoPath: string): string | undefined {
    return this.filePaths().get(photoPath);
  }

  /** Asks the main process about the photo's thumbnail until the attempt to make it has finished. */
  public watch(photoPath: string): void {
    // Not a dependency of the effect that calls this: it would run again for every thumbnail that is finished.
    if (untracked(this.filePaths).has(photoPath) || this.awaitedPhotoPaths.has(photoPath))
      return;

    this.awaitedPhotoPaths.add(photoPath);
    // The photos that are shown in the same turn, as the rows of a folder that is expanded, are asked about together.
    if (this.timer === undefined && !this.isChecking)
      this.checkAfter(0);
  }

  /** Forgets every thumbnail, for the photos of another folder. */
  public reset(): void {
    this.folderNumber++;
    clearTimeout(this.timer);
    this.timer = undefined;
    this.awaitedPhotoPaths.clear();
    this.filePaths.set(new Map());
  }

  private checkAfter(delayMs: number): void {
    this.timer = setTimeout(() => {
      this.timer = undefined;
      void this.check();
    }, delayMs);
  }

  /** One request about every awaited thumbnail. A check that takes longer than the interval is not overlapped. */
  private async check(): Promise<void> {
    const folderNumber = this.folderNumber;
    const photoPaths = [...this.awaitedPhotoPaths];
    if (photoPaths.length === 0)
      return;

    this.isChecking = true;
    try {
      const states = await bridge().thumbnails.state(photoPaths);
      if (folderNumber !== this.folderNumber)
        return;

      const finished = photoPaths.flatMap((photoPath, index) =>
        states[index]?.attemptFinished ? [[photoPath, states[index].thumbnailFilePath] as const] : []);
      if (finished.length === 0)
        return;

      for (const [photoPath] of finished)
        this.awaitedPhotoPaths.delete(photoPath);
      this.filePaths.update(filePaths => new Map([...filePaths, ...finished]));
    } catch (error) {
      logger.error(logged`Failed to check the thumbnails of ${photoPaths.length} photos.`, error);
    } finally {
      this.isChecking = false;
      // Photos of a folder that was opened during the check have waited for it to end.
      if (this.awaitedPhotoPaths.size > 0 && this.timer === undefined)
        this.checkAfter(folderNumber === this.folderNumber ? thumbnailCheckIntervalMs : 0);
    }
  }
}
