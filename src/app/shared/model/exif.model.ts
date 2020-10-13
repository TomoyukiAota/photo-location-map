import { Dimensions } from './dimensions.model';
import { GpsInfo } from './gps-info.model';
import { Thumbnail } from './thumbnail.model';

export class Exif {
  dateTimeOriginal?: number;
  gpsInfo?: GpsInfo;
  imageDimensions?: Dimensions;
  thumbnail?: Thumbnail;
}
