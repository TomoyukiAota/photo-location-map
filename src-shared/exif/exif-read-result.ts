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
 * its message anyway, and the renderer handles each failure as it did when it called exifr itself:
 * - 'failed': parsing threw; the photo has no Exif.
 * - 'empty': the photo has no EXIF; it has no Exif.
 * - 'ok': parsed. The embedded thumbnail was then extracted, or `thumbnailError` says why it could not be.
 */
export type ExifReadResult =
  | { parse: 'failed'; error: string }
  | { parse: 'empty' }
  | { parse: 'ok'; output: ExifReadOutput; thumbnail: Uint8Array | null; thumbnailError?: string;
      /** How long parsing and extracting took in the main process, for the performance comparisons. */
      parseMs: number; thumbnailMs: number };
