import { GpsInfo } from './gps-info.model';
import { Thumbnail } from './thumbnail.model';
import { Dimensions } from './dimensions.model';

export class Photo {
  name: string;
  path: string;
  exifParserResult: ExifParserResult;
  dimensions: Dimensions;
  gpsInfo: GpsInfo;
  thumbnail: Thumbnail;
  dateTimeTaken: string;
}
