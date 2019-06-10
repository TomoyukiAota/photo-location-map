import { GpsInfo } from './gps-info.model';
import { Thumbnail } from './thumbnail.model';

export class Photo {
  name: string;
  path: string;
  exifParserResult: ExifParserResult;
  gpsInfo: GpsInfo;
  thumbnail: Thumbnail;
  dateTimeTaken: string;
}
