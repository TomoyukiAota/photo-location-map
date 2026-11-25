import { Service, signal } from '@angular/core';
import { Thumbnail } from '../shared/model/thumbnail.model';

/**
 * The thumbnails of EXIF data that the page could not decode, in place of which the viewers show what they show for a
 * photo without such a thumbnail: for a JPEG or PNG photo, the thumbnail that the app makes of it, at either quality
 * (needsMadeThumbnail in src/app/jpeg-png-thumbnail/jpeg-png-thumbnail.service.ts).
 * TL;DR: Found as the error of a viewer's img element, once it shows the thumbnail, as nothing decodes the thumbnails
 * while a folder opens (createThumbnail() in src/app/shared/exif-fetcher/using-exifr/fetch-exif-using-exifr.ts). Kept
 * here, apart from the viewers, so that a viewer made again for the photo, as a row of the tree is when its folder is
 * expanded again, shows what it shows for a photo without one at once.
 * Details:
 * - A thumbnail is known by its object URL, which no other thumbnail has: those of a folder opened before are
 *   revoked, and nothing asks about them again.
 * - Chromium fires the error only for a JPEG whose tables or headers it cannot read, as one with a Huffman or
 *   quantization table of a number that JPEG does not have, a sampling factor of 0, a frame of 2 components or a scan of
 *   a component that the frame does not have: the header of a frame that orientedJpeg() reads is not enough. A
 *   thumbnail whose image data are damaged loads, and shows what Chromium could decode of it, part of it or nothing:
 *   cut short, with bytes overwritten, without its end or without its quantization tables. Seen in Electron 45, with
 *   copies of a fixture's EXIF thumbnail damaged in each way (docs/tasks/20261125_undecodable-exif-thumbnails/STATUS.md).
 *   One cut short, or without its end, is left out while the folder opens (isCutShort() in
 *   src/app/shared/cut-short-jpeg.ts).
 */
@Service()
export class UndecodableThumbnailService {
  private readonly objectUrls = signal<ReadonlySet<string>>(new Set());

  /** Whether the page could not decode the thumbnail. */
  public isUndecodable(thumbnail: Thumbnail): boolean {
    return this.objectUrls().has(thumbnail.objectUrl);
  }

  /** Remembers that the page could not decode the thumbnail. */
  public add(thumbnail: Thumbnail): void {
    if (!this.objectUrls().has(thumbnail.objectUrl))
      this.objectUrls.update(objectUrls => new Set(objectUrls).add(thumbnail.objectUrl));
  }
}
