import { Service, signal } from '@angular/core';
import { Thumbnail } from '../shared/model/thumbnail.model';

/**
 * The thumbnails of EXIF data that the page could not decode, in place of which the viewers show what they show for a
 * photo without such a thumbnail: the photo itself where the page can show it.
 * TL;DR: Found as the error of a viewer's img element, once it shows the thumbnail, as nothing decodes the thumbnails
 * while a folder opens (createThumbnail() in src/app/shared/exif-fetcher/using-exifr/fetch-exif-using-exifr.ts). Kept
 * here, apart from the viewers, so that a viewer made again for the photo, as a row of the tree is when its folder is
 * expanded again, shows the photo itself at once.
 * Details: A thumbnail is known by its object URL, which no other thumbnail has: those of a folder opened before are
 * revoked, and nothing asks about them again.
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
