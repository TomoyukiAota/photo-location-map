import * as exifParser from 'exif-parser';
import * as moment from 'moment-timezone';
import { Exif } from '../../model/exif.model';
import { Logger } from '../../../../../src-shared/log/logger';
import { DateTimeOriginal } from '../../model/date-time-original';
import { Dimensions } from '../../model/dimensions.model';
import { GpsInfo } from '../../model/gps-info.model';
import { LatLng } from '../../model/lat-lng.model';
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
        Logger.warn(`[using exif-parser] Failed to open ${filePath}`, error);
        reject(`Failed to open file ${filePath}`);
        return;
      }

      const buffer = Buffer.allocUnsafe(bufferLengthRequiredToParseExif);
      window.require('fs-extra').read(fd, buffer, 0, bufferLengthRequiredToParseExif, 0, (err, bytesRead) => {
        if (err) {
          Logger.warn(`[using exif-parser] Failed to read file content of ${filePath}`, err, fd);
          reject(`Failed to read file content of ${filePath}`);
          return;
        }

        try {
          const exifParserResult = exifParser.create(buffer).parse();
          Logger.info(`[using exif-parser] Fetched EXIF of ${filePath} `, exifParserResult);
          resolve(exifParserResult);
        } catch (error) {
          if (error.message === 'Invalid JPEG section offset') {
            Logger.info(`[using exif-parser] exif-parser reported "Invalid JPEG section offset" for "${filePath}" reading ${bytesRead} bytes.`);
          } else {
            Logger.warn(`[using exif-parser] Failed to fetch EXIF of ${filePath} `, error);
          }

          reject(`Failed to fetch EXIF of ${filePath}`);
        }

        window.require('fs-extra').close(fd, e => {
          if (e)
            Logger.warn(`[using exif-parser] Failed to close ${filePath}`, error);
        });
      });
    });
  });
}

async function createExifFromExifParserResult(exifParserResult: ExifParserResult): Promise<Exif> {
  const exif = new Exif();

  if (exifParserResult?.tags?.DateTimeOriginal) {
    // DateTimeOriginal gotten from exif-parser is recorded in unix timestamp format although the time is in local time when the photo was taken.
    // moment.js thinks that the time is in UTC (because it is in UTC format) and tries to convert the time zone.
    // This results in applying the time-zone conversion to the time which is already in local time, which ends up in incorrect time.
    // In order to correctly use the local time without such conversion,
    // the time zone of Moment instance is set to UTC because no conversion will occur when UTC time zone is used.
    const momentFromExifParserResult = moment.unix(exifParserResult.tags.DateTimeOriginal).tz('UTC');
    exif.dateTimeOriginal = new DateTimeOriginal(momentFromExifParserResult);
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
