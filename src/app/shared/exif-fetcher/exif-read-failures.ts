import { FailureReasons } from '../../../../src-shared/analytics/failure-reasons.js';

/**
 * Why the photos of the folder being opened could not be read, recorded once its photos are read (ExifFetcher) as
 * "Opened Folder: EXIF Read Failed", one event per reason with how many files failed for it. Until then, such a photo
 * only counted as one without EXIF data. The statuses:
 * - read-failed: exifr could not parse the file in the main process, or the main process was not asked;
 * - thumbnail-failed: exifr could not extract the embedded thumbnail, so the photo has no EXIF data;
 * - exif-failed: the app could not make its model of what was read;
 * - rotate-failed: the embedded thumbnail could not be turned on a canvas, so the photo has no thumbnail of its EXIF
 *   data. Only a thumbnail that is not a JPEG of a frame that the page decodes is turned so; the page finds that
 *   another one cannot be decoded only once it shows it (createThumbnail() in using-exifr/fetch-exif-using-exifr.ts);
 * - thumbnail-cut-short: the embedded thumbnail is a JPEG without its end, as the EXIF data give its length too short,
 *   so the photo has no thumbnail of its EXIF data (src/app/shared/cut-short-jpeg.ts).
 */
export const exifReadFailures = new FailureReasons('Opened Folder Info', 'Opened Folder: EXIF Read Failed');

/** What failed while a photo's EXIF data was read, with the status of exifReadFailures and what the main process said. */
export class ExifReadError extends Error {
  constructor(public readonly status: 'read-failed' | 'thumbnail-failed', public readonly description: string) {
    super(description);
    this.name = 'ExifReadError';
  }
}
