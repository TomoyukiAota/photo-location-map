import { Service } from '@angular/core';
import { bridge, PhotoFileForThumbnail, ThumbnailState } from '../../../src-shared/bridge/plm-bridge';
import { makeThumbnailJpeg, pageHasImageDecoder } from './jpeg-png-image-decoding';

/**
 * What JpegPngThumbnailService reads, makes and keeps through: the main process for the files and the cache, and the
 * page's decoder. A service, so that the unit tests can give their own, as the main process is not in their page.
 */
@Service()
export class JpegPngImageSource {
  /** Whether the page can make thumbnails (jpeg-png-image-decoding.ts). */
  public canMake(): boolean {
    return pageHasImageDecoder();
  }

  /** Where the thumbnail of each photo is in the cache, if it is there at `longerSide`. */
  public states(photoPaths: string[], longerSide: number): Promise<ThumbnailState[]> {
    return bridge().thumbnails.state(photoPaths, longerSide);
  }

  /** The photo's file as it is now; null when it cannot be read. */
  public readPhoto(photoPath: string): Promise<PhotoFileForThumbnail | null> {
    return bridge().jpegPngThumbnails.readPhoto(photoPath);
  }

  /**
   * A JPEG of the photo's thumbnail, `longerSide` pixels on its longer side, which takes the bytes' buffer; rejects when
   * the file cannot be decoded.
   */
  public makeThumbnail(bytes: Uint8Array, photoPath: string, longerSide: number): Promise<Blob> {
    return makeThumbnailJpeg(bytes, photoPath, longerSide);
  }

  /** Keeps the thumbnail of `longerSide` in the cache, or that none could be made: where the thumbnail is. */
  public save(photoPath: string, lastModified: string, jpeg: Uint8Array | null, longerSide: number): Promise<string> {
    return bridge().jpegPngThumbnails.save(photoPath, lastModified, jpeg, longerSide);
  }
}
