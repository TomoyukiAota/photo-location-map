import type { FrameSize } from '../jpeg/jpeg-segments.js';

/**
 * The EXIF fields that the app uses, as exifr gives them with `translateValues: false` and its `pick` option
 * (src-main/exif/read-exif.ts). Plain data, which IPC copies as it is; Date stays a Date.
 */
export interface ExifReadOutput {
  DateTimeOriginal?: Date;
  ExifImageHeight?: number;
  ExifImageWidth?: number;
  latitude?: number;
  longitude?: number;
  Orientation?: number;
  Make?: string;
}

/**
 * What the main process read from one photo. A failure is described in `error`, as an IPC rejection would keep only
 * its message anyway, and the renderer handles each failure as it did when it called exifr itself, but the thumbnail's:
 * - 'failed': parsing threw; the photo has no Exif.
 * - 'empty': the photo has no EXIF; it has no Exif.
 * - 'ok': parsed. The embedded thumbnail was then extracted, or `thumbnailError` says why it could not be, and the
 *   photo has the rest of its Exif without it (createExifFromExifrParseOutput in fetch-exif-using-exifr.ts). `frame` is
 *   the size of a JPEG's frame, its pixels as they are stored, before the orientation turns them, which the EXIF data
 *   may not give as it is (jpegFrameSize in src-shared/jpeg/jpeg-segments.ts); null for another file, or one whose
 *   frame header was not found.
 */
export type ExifReadResult =
  | { parse: 'failed'; error: string }
  | { parse: 'empty' }
  | { parse: 'ok'; output: ExifReadOutput; frame?: FrameSize | null; thumbnail: Uint8Array | null; thumbnailError?: string;
      /** How long parsing and extracting took in the main process, for the performance comparisons. */
      parseMs: number; thumbnailMs: number };
