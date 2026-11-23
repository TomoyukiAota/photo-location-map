import { bridge } from '../../../../../src-shared/bridge/plm-bridge.js';
import { ExifReadOutput, ExifReadResult } from '../../../../../src-shared/exif/exif-read-result.js';
import { Logger } from '../../../../../src-shared/log/logger.js';
import { DateTimeOriginal } from '../../model/date-time-original.js';
import { Dimensions } from '../../model/dimensions.model.js';
import { Exif } from '../../model/exif.model.js';
import { GpsInfo } from '../../model/gps-info.model.js';
import { LatLng } from '../../model/lat-lng.model.js';
import { Thumbnail } from '../../model/thumbnail.model.js';
import { rotateImage, getRotatedSize } from '../../image-rotation.js';
import { orientedJpeg } from '../../oriented-jpeg.js';
import { ThumbnailObjectUrlStorage } from '../../thumbnail-object-url-storage.js';
import { addExifFileTime, exifPerfStats } from '../exif-perf-stats.js';
import { ExifReadError, exifReadFailures } from '../exif-read-failures.js';

// exifr runs in the main process (src-main/exif/read-exif.ts), which also extracts the embedded thumbnail.
// With exifr in the renderer process, 1) it is slower, and 2) loading files fails when many files are loaded.
// One request per photo: the parse and the thumbnail together.
async function readExifInMainProcess(filePath: string): Promise<ExifReadResult> {
  const startMs = performance.now();
  const result: ExifReadResult = await bridge().exif.read(filePath);
  exifPerfStats.readMs += performance.now() - startMs;
  if (result.parse === 'ok') {
    exifPerfStats.parseMs += result.parseMs;
    exifPerfStats.thumbnailMs += result.thumbnailMs;
  }
  return result;
}

export function fetchExifUsingExifr(filePath: string): Promise<Exif> {
  const startMs = performance.now();
  const exifPromise = fetchExifrParseOutput(filePath)
    .catch(error => {
      Logger.info(`[using exifr] Failed to fetch EXIF from ${filePath}`, error);
      exifReadFailures.add('read-failed', error instanceof ExifReadError ? error.description : error);
      return null;
    })
    .then(async read => await createExifFromExifrParseOutput(read, filePath))
    .catch(error => {
      Logger.info(`[using exifr] Failed to create Exif class instance of ${filePath}`, error);
      if (error instanceof ExifReadError)
        exifReadFailures.add(error.status, error.description);
      else
        exifReadFailures.add('exif-failed', error);
      return null;
    })
    // Counted for the log's line of the folder, which takes the place of a line per photo (exifSummaryLine).
    .finally(() => addExifFileTime(filePath, performance.now() - startMs));

  return exifPromise;
}

interface ExifrRead {
  output: ExifReadOutput;
  thumbnail: Uint8Array | null;
  thumbnailError?: string;
}

/** The parsed EXIF, or null for a photo without EXIF. Throws, as exifr.parse did, when parsing failed. */
async function fetchExifrParseOutput(filePath: string): Promise<ExifrRead | null> {
  const result = await readExifInMainProcess(filePath);
  if (result.parse === 'failed')
    throw new ExifReadError('read-failed', result.error);

  return result.parse === 'ok' ? { output: result.output, thumbnail: result.thumbnail, thumbnailError: result.thumbnailError } : null;
}

/**
 * The app's Exif of what the main process read with exifr: the date, the size as shown, the location, the camera's make
 * and the thumbnail. Null when nothing was read; throws when the thumbnail could not be extracted.
 */
async function createExifFromExifrParseOutput(read: ExifrRead | null, filePath: string): Promise<Exif> {
  if (!read)
    return null;

  const exifrParseOutput = read.output;
  const exif = new Exif();

  if (exifrParseOutput.DateTimeOriginal) {
    exif.dateTimeOriginal = new DateTimeOriginal(exifrParseOutput.DateTimeOriginal);
  }

  if (exifrParseOutput.ExifImageWidth && exifrParseOutput.ExifImageHeight) {
    const rotatedSize = getRotatedSize(exifrParseOutput.ExifImageWidth, exifrParseOutput.ExifImageHeight, exifrParseOutput.Orientation);
    exif.imageDimensions = new Dimensions(rotatedSize.width, rotatedSize.height);
  }

  if (LatLng.isLocation(exifrParseOutput.latitude, exifrParseOutput.longitude)) {
    const gpsInfo = new GpsInfo();
    gpsInfo.latLng = new LatLng(exifrParseOutput.latitude, exifrParseOutput.longitude);
    exif.gpsInfo = gpsInfo;
  }

  if (typeof exifrParseOutput.Make === 'string' && exifrParseOutput.Make.trim()) {
    exif.cameraMake = exifrParseOutput.Make.trim();
  }

  // Extracting the thumbnail failed: the photo has no Exif, as when the renderer extracted it and exifr threw.
  if (read.thumbnailError)
    throw new ExifReadError('thumbnail-failed', read.thumbnailError);

  const thumbnailBuffer = read.thumbnail;
  if (thumbnailBuffer) {
    const orientation = exifrParseOutput.Orientation ?? 1;   // If orientation is not available, assume 1, and display thumbnail.
    const rotateStartMs = performance.now();
    const thumbnail = await createThumbnail(thumbnailBuffer, orientation, filePath);
    exifPerfStats.rotateMs += performance.now() - rotateStartMs;
    exif.thumbnail = thumbnail;
  }

  return exif;
}

/**
 * The thumbnail that the camera wrote into the photo's EXIF data, turned as the photo is.
 * TL;DR: A JPEG thumbnail is kept as it is, with the photo's orientation in an EXIF segment of its own, which the img
 * element applies as it shows it (orientedJpeg()). Only another thumbnail is turned on a canvas, as every one was,
 * which took most of the time that a folder of photos took to open: its rows of 10,000 photos came after 18.6 s, and
 * come after 3.2 s now.
 * Details:
 * - canvas.toBlob() encodes the PNG in an idle task of the page, which Chromium runs only in the idle time after a
 *   frame, and the page draws a frame every 16.7 ms while a folder opens. So a photo's thumbnail came after the next
 *   frame, and with the 10 photos that ExifFetcher reads at once, at most 10 came in a frame: 16.7 s for 10,000
 *   photos. The call also read the canvas back from the GPU, for 0.8 ms a photo on the page's thread. Measured on
 *   macOS, November 2026 (docs/tasks/20261122_exif-thumbnail-orientation-tag/STATUS.md).
 * - Nothing decodes the thumbnail while the folder opens, as the canvas did, so one that the page cannot decode is
 *   found once it is shown: the viewers then show what they show for a photo without one, the photo itself where the
 *   page can show it (UndecodableThumbnailService). The canvas left such a photo without a thumbnail ('rotate-failed').
 */
async function createThumbnail(thumbnailBuffer: Uint8Array, orientation: number, filePath: string): Promise<Thumbnail> {
  const oriented = orientedJpeg(thumbnailBuffer, orientation);
  if (oriented) {
    const objectUrl = URL.createObjectURL(new Blob(oriented.parts as BlobPart[], { type: 'image/jpeg' }));
    ThumbnailObjectUrlStorage.add(objectUrl);
    return new Thumbnail(objectUrl, oriented.dimensions);
  }

  const base64String = btoa(String.fromCharCode.apply(null, thumbnailBuffer));
  const dataUrl = `data:image/jpg;base64,${base64String}`;
  const thumbnail = rotateImage(dataUrl, orientation)
    .then(rotatedImage => new Thumbnail(rotatedImage.objectUrl, rotatedImage.dimensions))
    .catch((errorEvent: ErrorEvent) => {
      Logger.info(`[using exifr] Failed to rotate the thumbnail of "${filePath}". ErrorEvent: `, errorEvent);
      exifReadFailures.add('rotate-failed', errorEvent);
      return null;
    });
  return thumbnail;
}
