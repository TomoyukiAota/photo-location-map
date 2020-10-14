import { Logger } from '../../../../../src-shared/log/logger';
import { Exif } from '../../model/exif.model';
import { Dimensions } from '../../model/dimensions.model';
import { GpsInfo } from '../../model/gps-info.model';
import { LatLng } from '../../model/lat-lng.model';
import { Thumbnail } from '../../model/thumbnail.model';
import * as imageRotator from '../../image-rotator';

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
}

async function fetchExifrParseOutput(filePath: string): Promise<ExifrParseOutput> {
  const exifrResult: ExifrParseOutput = await exifr.parse(filePath);
  return exifrResult;
}

async function createExifFromExifrParseOutput(exifrResult: ExifrParseOutput, filePath: string): Promise<Exif> {
  if (!exifrResult)
    return;

  const exif = new Exif();

  if (exifrResult.DateTimeOriginal) {
    exif.dateTimeOriginal = exifrResult.DateTimeOriginal;
  }

  if (exifrResult.ExifImageWidth && exifrResult.ExifImageHeight) {
    exif.imageDimensions = new Dimensions(exifrResult.ExifImageWidth, exifrResult.ExifImageWidth);
  }

  if (exifrResult.latitude && exifrResult.longitude) {
    const gpsInfo = new GpsInfo();
    gpsInfo.latLng = new LatLng(exifrResult.latitude, exifrResult.longitude);
    exif.gpsInfo = gpsInfo;
  }

  const thumbnailBuffer = await exifr.thumbnail(filePath);
  if (thumbnailBuffer) {
    const thumbnail = await createThumbnail(thumbnailBuffer, filePath);
    exif.thumbnail = thumbnail;
  }

  return exif;
}

async function createThumbnail(thumbnailBuffer: Uint8Array | Buffer, filePath: string) {
  const base64String = btoa(String.fromCharCode.apply(null, thumbnailBuffer));
  const dataUrl = `data:image/jpg;base64,${base64String}`;
  const orientation = await exifr.orientation(filePath);
  const rotatedImage = await imageRotator.correctRotation(dataUrl, orientation);
  const rotatedDimensions = new Dimensions(rotatedImage.width, rotatedImage.height);
  const thumbnail = new Thumbnail(rotatedImage.dataUrl, rotatedDimensions);
  return thumbnail;
}
