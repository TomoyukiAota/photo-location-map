import { Service } from '@angular/core';
import { FilenameExtension } from '../../../src-shared/filename-extension/filename-extension';
import { photoFileUrl } from '../../../src-shared/main-window-schemes';
import { Photo } from '../shared/model/photo.model';
import { yunetInputSize } from './yunet';

/**
 * Where the search for faces takes a photo's image from, by what the page can decode of it:
 * - 'photo': a JPEG or PNG file itself, the most detail, decoded down to the size that the detector takes.
 * - 'generatedThumbnail': the thumbnail that the app makes of a HEIF file, which the page cannot show as it is: 400
 *   pixels in high quality, the file's own small thumbnail, 320 pixels or more, in fast (src/app/heif-thumbnail/).
 * - 'exifThumbnail': the thumbnail in the photo's EXIF data, as of a TIFF file, which the page cannot decode either:
 *   160 pixels, in which only larger faces are found.
 * - 'none': a photo of which the page has no image.
 */
export type FaceSearchImageKind = 'photo' | 'generatedThumbnail' | 'exifThumbnail' | 'none';

export function faceSearchImageKindOf(photo: Photo): FaceSearchImageKind {
  if (FilenameExtension.isDisplayableInBrowser(photo.filenameExtension))
    return 'photo';
  if (FilenameExtension.isThumbnailGenerationAvailable(photo.filenameExtension))
    return 'generatedThumbnail';
  return photo.exif?.thumbnail ? 'exifThumbnail' : 'none';
}

/** The address of an image of the photo that the page can decode, for those of kind 'photo' and 'exifThumbnail'. */
export function faceSearchImageUrlOf(photo: Photo, kind: 'photo' | 'exifThumbnail'): string {
  return kind === 'photo' ? photoFileUrl(photo.path) : photo.exif.thumbnail.objectUrl;
}

/**
 * The image at `url`, decoded and scaled down, keeping its shape, so that its longer side is the detector's input
 * size, as the photo is shown: turned as its EXIF data says.
 * TL;DR: Through an img element with crossorigin, not fetch(), so that the file's data does not pile up.
 * Details:
 * - In a prototype, Blobs from fetch() stayed in Electron's main process until the page collected its garbage, which
 *   it did not need to do for objects as small as Blobs are on its side: 2.2 GB after 900 photos. Decoded through
 *   img elements, the main process stayed at 161 MB, and the page at 253 MB at most.
 * - crossorigin, with the CORS of plm-file: for the page's origin (src-main/file-server/photo-files.ts), so that the
 *   worker may read the pixels. An object URL of the page's own, as an EXIF thumbnail's, needs no CORS.
 * - Decoding a photo of 8 to 12 megapixels took 20 to 40 ms on an Apple M5, as long to any size: Chromium decodes
 *   it whole, then scales it.
 */
export async function decodeForFaceSearch(url: string, size = yunetInputSize): Promise<ImageBitmap> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = url;
  await image.decode();
  const scale = Math.min(1, size / Math.max(image.naturalWidth, image.naturalHeight));
  return createImageBitmap(image, {
    resizeWidth: Math.max(1, Math.round(image.naturalWidth * scale)),
    resizeHeight: Math.max(1, Math.round(image.naturalHeight * scale)),
    resizeQuality: 'medium',
  });
}

/** Decodes the images that the search looks at: a service, so that the unit tests can give images of their own. */
@Service()
export class FaceSearchImageDecoder {
  public decode(url: string): Promise<ImageBitmap> {
    return decodeForFaceSearch(url);
  }
}
