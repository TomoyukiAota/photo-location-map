import { Logger } from '../../../../../src-shared/log/logger';
import { DateTimeOriginal } from '../../model/date-time-original';
import { Dimensions } from '../../model/dimensions.model';
import { Exif } from '../../model/exif.model';
import { GpsInfo } from '../../model/gps-info.model';
import { LatLng } from '../../model/lat-lng.model';
import { Thumbnail } from '../../model/thumbnail.model';
import { rotateImage, getRotatedSize } from '../../image-rotation';

// exifr in the main process is used.
// With exifr in the renderer process, 1) it is slower, and 2) loading files fails when many files are loaded.
const exifr: typeof import('exifr') = window.require('@electron/remote').require('exifr');

export function fetchExifUsingExifr(filePath: string): Promise<Exif> {
  const exifPromise = fetchExifrParseOutput(filePath)
    .catch(error => {
      Logger.info(`[using exifr] Failed to fetch EXIF from ${filePath}`, error);
      return null;
    })
    .then(async exifrParseOutput => await createExifFromExifrParseOutput(exifrParseOutput, filePath))
    .catch(error => {
      Logger.info(`[using exifr] Failed to create Exif class instance of ${filePath}`, error);
      return null;
    });

  return exifPromise;
}

interface ExifrParseOutput {
  DateTimeOriginal?: Date;
  ExifImageHeight?: number;
  ExifImageWidth?: number;
  latitude?: number;
  longitude?: number;
  Orientation?: number;
}

async function fetchExifrParseOutput(filePath: string): Promise<ExifrParseOutput> {
  const exifrParseOutput: ExifrParseOutput = await exifr.parse(filePath, {
    translateValues: false,
    pick: [
      'DateTimeOriginal',
      'ExifImageHeight',
      'ExifImageWidth',
      'GPSLatitude',     // Required for exifrParseOutput.latitude
      'GPSLatitudeRef',  // Required for exifrParseOutput.latitude to be correctly calculated
      'GPSLongitude',    // Required for exifrParseOutput.longitude
      'GPSLongitudeRef', // Required for exifrParseOutput.longitude to be correctly calculated
      'Orientation'
    ]
  });
  Logger.info(`[using exifr] Fetched EXIF of ${filePath} `, exifrParseOutput);
  return exifrParseOutput;
}

async function createExifFromExifrParseOutput(exifrParseOutput: ExifrParseOutput, filePath: string): Promise<Exif> {
  if (!exifrParseOutput)
    return null;

  const exif = new Exif();

  if (exifrParseOutput.DateTimeOriginal) {
    exif.dateTimeOriginal = new DateTimeOriginal(exifrParseOutput.DateTimeOriginal);
  }

  if (exifrParseOutput.ExifImageWidth && exifrParseOutput.ExifImageHeight) {
    const rotatedSize = getRotatedSize(exifrParseOutput.ExifImageWidth, exifrParseOutput.ExifImageHeight, exifrParseOutput.Orientation);
    exif.imageDimensions = new Dimensions(rotatedSize.width, rotatedSize.height);
  }

  if (exifrParseOutput.latitude && exifrParseOutput.longitude) {
    const gpsInfo = new GpsInfo();
    gpsInfo.latLng = new LatLng(exifrParseOutput.latitude, exifrParseOutput.longitude);
    exif.gpsInfo = gpsInfo;
  }

  const thumbnailBuffer = await exifr.thumbnail(filePath);
  if (thumbnailBuffer) {
    const orientation = exifrParseOutput.Orientation ?? 1;   // If orientation is not available, assume 1, and display thumbnail.
    const thumbnail = await createThumbnail(thumbnailBuffer, orientation, filePath);
    exif.thumbnail = thumbnail;
  }

  Logger.info(`[using exifr] Created Exif class instance of ${filePath} `, exif);

  return exif;
}

async function createThumbnail(thumbnailBuffer: Uint8Array | Buffer, orientation: number, filePath: string): Promise<Thumbnail> {
  const base64String = btoa(String.fromCharCode.apply(null, thumbnailBuffer));
  const dataUrl = `data:image/jpg;base64,${base64String}`;
  const thumbnail = rotateImage(dataUrl, orientation)
    .then(rotatedImage => new Thumbnail(rotatedImage.objectUrl, rotatedImage.dimensions))
    .catch((errorEvent: ErrorEvent) => {
      Logger.info(`[using exifr] Failed to rotate the thumbnail of "${filePath}". ErrorEvent: `, errorEvent);
      return null;
    });
  return thumbnail;
}
