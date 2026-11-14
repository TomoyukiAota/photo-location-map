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
import { exifPerfStats } from '../exif-perf-stats.js';
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
    .finally(() => {
      exifPerfStats.files++;
      exifPerfStats.maxFileMs = Math.max(exifPerfStats.maxFileMs, performance.now() - startMs);
    });

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

  const read = result.parse === 'ok' ? { output: result.output, thumbnail: result.thumbnail, thumbnailError: result.thumbnailError } : null;
  Logger.info(`[using exifr] Fetched EXIF of ${filePath} `, read?.output);
  return read;
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

  Logger.info(`[using exifr] Created Exif class instance of ${filePath} `, exif);

  return exif;
}

async function createThumbnail(thumbnailBuffer: Uint8Array, orientation: number, filePath: string): Promise<Thumbnail> {
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
