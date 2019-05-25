export class GpsInfo {
  gpsLatitude: number;
  gpsLongitude: number;
}

export class Photo {
  name: string;
  path: string;
  exifParserResult: ExifParserResult;
  gpsInfo: GpsInfo;
}
