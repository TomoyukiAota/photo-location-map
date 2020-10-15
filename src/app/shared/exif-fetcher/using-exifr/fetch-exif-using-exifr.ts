import { Logger } from '../../../../../src-shared/log/logger';
import { Exif } from '../../model/exif.model';
import { Dimensions } from '../../model/dimensions.model';
import { GpsInfo } from '../../model/gps-info.model';
import { LatLng } from '../../model/lat-lng.model';
import { Thumbnail } from '../../model/thumbnail.model';
import * as imageRotator from '../../image-rotator';

// exifr in the main process is used because it runs faster than the one in the renderer process.
const exifr: typeof import('exifr') = window.require('electron').remote.require('exifr');

export function fetchExifUsingExifr(filePath: string): Promise<Exif> {
  const exifPromise = fetchExifrParseOutput(filePath)
    .then(async exifrParseOutput => {
      const exif = await createExifFromExifrParseOutput(exifrParseOutput, filePath);
      Logger.info(`[using exifr] Fetched EXIF of ${filePath} `, exifrParseOutput);
      return exif;
    })
    .catch(() => null );

  return exifPromise;
}

interface ExifrParseOutput {
  DateTimeOriginal?: any;
  latitude?: number;
  longitude?: number;
  ExifImageHeight?: number;
  ExifImageWidth?: number;
  Orientation?: number;
}

async function fetchExifrParseOutput(filePath: string): Promise<ExifrParseOutput> {
  const exifrParseOutput: ExifrParseOutput = await exifr.parse(filePath, {
    translateValues: false
  });
  return exifrParseOutput;
}

async function createExifFromExifrParseOutput(exifrParseOutput: ExifrParseOutput, filePath: string): Promise<Exif> {
  if (!exifrParseOutput)
    return;

  const exif = new Exif();

  if (exifrParseOutput.DateTimeOriginal) {
    exif.dateTimeOriginal = exifrParseOutput.DateTimeOriginal;
  }

  if (exifrParseOutput.ExifImageWidth && exifrParseOutput.ExifImageHeight) {
    exif.imageDimensions = new Dimensions(exifrParseOutput.ExifImageWidth, exifrParseOutput.ExifImageWidth);
  }

  if (exifrParseOutput.latitude && exifrParseOutput.longitude) {
    const gpsInfo = new GpsInfo();
    gpsInfo.latLng = new LatLng(exifrParseOutput.latitude, exifrParseOutput.longitude);
    exif.gpsInfo = gpsInfo;
  }

  const thumbnailBuffer = await exifr.thumbnail(filePath);
  if (thumbnailBuffer) {
    const orientation = exifrParseOutput.Orientation ?? 1;   // If orientation is not available, assume 1, and display thumbnail.
    const thumbnail = await createThumbnail(thumbnailBuffer, orientation);
    exif.thumbnail = thumbnail;
  }

  return exif;
}

async function createThumbnail(thumbnailBuffer: Uint8Array | Buffer, orientation: number) {
  const base64String = btoa(String.fromCharCode.apply(null, thumbnailBuffer));
  const dataUrl = `data:image/jpg;base64,${base64String}`;
  const rotatedImage = await imageRotator.correctRotation(dataUrl, orientation);
  const rotatedDimensions = new Dimensions(rotatedImage.width, rotatedImage.height);
  const thumbnail = new Thumbnail(rotatedImage.dataUrl, rotatedDimensions);
  return thumbnail;
}
