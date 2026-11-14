import { DateTimeOriginal } from './date-time-original.js';
import { Dimensions } from './dimensions.model.js';
import { GpsInfo } from './gps-info.model.js';
import { Thumbnail } from './thumbnail.model.js';

export class Exif {
  dateTimeOriginal?: DateTimeOriginal;
  gpsInfo?: GpsInfo;
  imageDimensions?: Dimensions;
  thumbnail?: Thumbnail;
  cameraMake?: string;
}
