import { GpsInfo } from './gps-info.model';
import { Thumbnail } from './thumbnail.model';

export class Photo {
  name: string;
  path: string;
  exifParserResult: ExifParserResult;
  width: number;
  height: number;
  gpsInfo: GpsInfo;
  thumbnail: Thumbnail;
  dateTimeTaken: string;
}
