export class LatLng {
  constructor(
    public latitude = 0,
    public longitude = 0) {}
}

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
