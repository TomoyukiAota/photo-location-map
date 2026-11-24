import { Service } from '@angular/core';
import { bridge } from '../../../src-shared/bridge/plm-bridge';
import { createPrependedLogger } from '../../../src-shared/log/create-prepended-logger';
import { logged } from '../../../src-shared/log/logged-line';
import { decodeEmbeddedThumbnail, decodeWholeImage, isSupported, pageDecodesHevc } from './heif-image-decoding';

const logger = createPrependedLogger('[HEIF Thumbnail]');

/**
 * The images of a HEIF photo as JPEGs for its thumbnail, which the page makes: a service, so that the unit tests can
 * give images of their own, as WebCodecs is not in their page.
 */
@Service()
export class HeifImageSource {
  /** Whether the page decodes HEVC (heif-image-decoding.ts). */
  public pageDecodesHevc(): Promise<boolean> {
    return pageDecodesHevc();
  }

  /**
   * The small thumbnail that the photo holds: decoded in the page where it can, else by libheif in the main process.
   * Null when the photo has none, or it cannot be decoded.
   */
  public async embeddedThumbnail(photoPath: string): Promise<Blob | null> {
    const thumbnail = await bridge().heif.embeddedThumbnail(photoPath);
    if (!thumbnail)
      return null;
    if (thumbnail.kind === 'jpeg' || await isSupported(thumbnail.hevc)) {
      try {
        return await decodeEmbeddedThumbnail(thumbnail);
      } catch (error) {
        logger.warn(logged`The thumbnail item of "${photoPath}" could not be decoded in the page: ${error}`);
      }
    }
    if (thumbnail.kind !== 'hevc')
      return null;
    const jpeg = await bridge().heif.embeddedThumbnailJpeg(photoPath);
    return jpeg ? new Blob([jpeg as BlobPart], { type: 'image/jpeg' }) : null;
  }

  /**
   * The thumbnail of high quality, from the whole image, `longerSide` pixels on its longer side, where the page decodes
   * its tiles. Null when it cannot, which leaves it to the main process.
   */
  public async wholeImage(photoPath: string, longerSide: number): Promise<Blob | null> {
    if (!await pageDecodesHevc())
      return null;
    const image = await bridge().heif.wholeImage(photoPath);
    if (!image || !await isSupported(image.hevc))
      return null;
    try {
      return await decodeWholeImage(image, longerSide);
    } catch (error) {
      logger.warn(logged`The image of "${photoPath}" could not be decoded in the page: ${error}`);
      return null;
    }
  }
}
