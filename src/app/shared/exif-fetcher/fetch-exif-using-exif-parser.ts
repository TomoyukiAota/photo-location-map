import * as exifParser from 'exif-parser';
import { Exif } from '../model/exif.model';
import { Logger } from '../../../../src-shared/log/logger';
import { Dimensions } from '../model/dimensions.model';
import { GpsInfo } from '../model/gps-info.model';
import { LatLng } from '../model/lat-lng.model';
import { createThumbnail } from './create-thumbnail-from-exif-parser-result';

export function fetchExifUsingExifParser(filePath: string): Promise<Exif> {
  const exifPromise = fetchExifParserResult(filePath)
    .then(async exifParserResult => await createExifFromExifParserResult(exifParserResult))
    .catch(() => null );

  return exifPromise;
}

function fetchExifParserResult(filePath: string): Promise<ExifParserResult> {
  return new Promise((resolve, reject) => {
    const bufferLengthRequiredToParseExif = 65635;
    window.require('fs-extra').open(filePath, 'r', (error, fd) => {
      if (error) {
        Logger.warn(`Failed to open ${filePath}`, error);
        reject(`Failed to open file ${filePath}`);
        return;
      }

      const buffer = Buffer.allocUnsafe(bufferLengthRequiredToParseExif);
      window.require('fs-extra').read(fd, buffer, 0, bufferLengthRequiredToParseExif, 0, (err, bytesRead) => {
        if (err) {
          Logger.warn(`Failed to read file content of ${filePath}`, err, fd);
          reject(`Failed to read file content of ${filePath}`);
          return;
        }

        try {
          const exifParserResult = exifParser.create(buffer).parse();
          Logger.info(`Fetched EXIF of ${filePath} `, exifParserResult);
          resolve(exifParserResult);
        } catch (error) {
          if (error.message === 'Invalid JPEG section offset') {
            Logger.info(`exif-parser reported "Invalid JPEG section offset" for "${filePath}" reading ${bytesRead} bytes.`);
          } else {
            Logger.warn(`Failed to fetch EXIF of ${filePath} `, error);
          }

          reject(`Failed to fetch EXIF of ${filePath}`);
        }

        window.require('fs-extra').close(fd, e => {
          if (e)
            Logger.warn(`Failed to close ${filePath}`, error);
        });
      });
    });
  });
}

async function createExifFromExifParserResult(exifParserResult: ExifParserResult): Promise<Exif> {
  const exif = new Exif();

  if (exifParserResult.tags && exifParserResult.tags.DateTimeOriginal) {
    exif.dateTimeOriginal = exifParserResult.tags.DateTimeOriginal;
  }

  if (exifParserResult.imageSize) {
    exif.imageDimensions = new Dimensions(exifParserResult.imageSize.width, exifParserResult.imageSize.height);
  }

  if (exifParserResult.tags && exifParserResult.tags.GPSLatitude && exifParserResult.tags.GPSLongitude) {
    const gpsInfo = new GpsInfo();
    gpsInfo.latLng = new LatLng(exifParserResult.tags.GPSLatitude, exifParserResult.tags.GPSLongitude);
    exif.gpsInfo = gpsInfo;
  }

  exif.thumbnail = await createThumbnail(exifParserResult);

  return exif;
}
