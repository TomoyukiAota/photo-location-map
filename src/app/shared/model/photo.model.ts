import { GpsInfo } from './gps-info.model';

export class Photo {
  name: string;
  path: string;
  exifParserResult: ExifParserResult;
  gpsInfo: GpsInfo;
  dateTimeTaken: string;
}
