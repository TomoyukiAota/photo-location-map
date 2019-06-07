import * as moment from 'moment-timezone';
import { Photo } from './model/photo.model';

export class PhotoDateTimeTakenGenerator {
  public static generate(photo: Photo) {
    // No time zone support using EXIF's GPSDateStamp and GPSTimeStamp which are saved in UTC.
    // This is because GPSDateStamp does not exist in the photos taken with old cameras such as iPhone 4 and 5.
    // Also, EXIF's DateTimeOriginal is saved in local time, so application users should be happy if DateTimeOriginal is used.
    return PhotoDateTimeTakenGenerator.getDateTimeOriginal(photo);
  }

  private static getDateTimeOriginal(photo: Photo) {
    // EXIF's DateTimeOriginal is recorded in unix timestamp format although it is in local time when the photo was taken.
    // moment.js thinks that the time is in UTC (because it is in UTC format) and tried to convert the time zone.
    // This results in extra conversion which gives incorrect time.
    // In order to just use the local time avoiding such conversion,
    // the time zone of Moment instance is set to UTC because no conversion will occur when UTC time zone is used.

    if (!photo || !photo.exifParserResult || !photo.exifParserResult.tags || !photo.exifParserResult.tags.DateTimeOriginal)
      return null;

    const dateTimeOriginal = photo.exifParserResult.tags.DateTimeOriginal;
    return moment.unix(dateTimeOriginal).tz('UTC').format('YYYY/MM/DD ddd HH:mm:ss');
  }
}
