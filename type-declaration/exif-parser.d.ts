declare module 'exif-parser' {
  export function create(buffer: Buffer): ExifParser;

  export interface ExifParser {
    parse(): ExifParserResult;
  }
}

interface ExifParserResult {
  imageSize?: {
    width?: number,
    height?: number
  };
  tags?: {
    Make?: string,
    Model?: string,
    Orientation?: number,
    XResolution?: number,
    YResolution?: number,
    ResolutionUnit?: number,
    Software?: string,
    ModifyDate?: number,
    YCbCrPositioning?: number,
    GPSLatitudeRef?: string,
    GPSLatitude?: number,
    GPSLongitudeRef?: string,
    GPSLongitude?: number,
    GPSAltitudeRef?: number,
    GPSAltitude?: number,
    GPSTimeStamp?: number[],
    GPSSpeedRef?: string,
    GPSSpeed?: number,
    GPSImgDirectionRef?: string,
    GPSImgDirection?: number,
    GPSDestBearingRef?: string,
    GPSDestBearing?: number,
    GPSDateStamp?: string,
    GPSHPositioningError?: number,
    ExposureTime?: number,
    FNumber?: number,
    ExposureProgram?: number,
    ISO?: number,
    DateTimeOriginal?: number,
    CreateDate?: number,
    ShutterSpeedValue?: number,
    ApertureValue?: number,
    BrightnessValue?: number,
    ExposureCompensation?: number,
    MeteringMode?: number,
    Flash?: number,
    FocalLength?: number,
    SubjectArea?: number[],
    SubSecTimeOriginal?: string,
    SubSecTimeDigitized?: string,
    ColorSpace?: number,
    ExifImageWidth?: number,
    ExifImageHeight?: number,
    SensingMethod?: number,
    ExposureMode?: number,
    WhiteBalance?: number,
    FocalLengthIn35mmFormat?: number,
    SceneCaptureType?: number,
    LensInfo?: number[],
    LensMake?: string,
    LensModel?: string
  };

  hasThumbnail(mimeType: string): boolean;

  getThumbnailBuffer(): Buffer;
}
