/* SystemJS module definition */
declare var nodeModule: NodeModule;
interface NodeModule {
  id: string;
}

interface NodeRequireFunction {
  // Add overloads here in order to add return types of global.require and window.require functions.
  (id: 'child_process'): typeof import('child_process');
  (id: 'fs'): typeof import('fs');
  (id: 'fs-extra'): typeof import('fs-extra');
  (id: 'os'): typeof import('os');
  (id: 'path'): typeof import('path');
}

declare namespace Electron {
  interface Remote {
    // Add overloads here in order to add return types of window.require('electron').remote.require function.
    require(module: 'fs-extra'): typeof import('fs-extra');
    require(module: 'os'): typeof import('os');
  }
}

declare var window: Window;
interface Window {
  process: NodeJS.Process;
  require: NodeRequire;
}

type DirectoryTree = ReturnType<typeof import('directory-tree')>;

declare module 'exif-parser';
interface ExifParserResult {
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
}

declare var __karma__: any;
declare var __electronMochaMain__: any;
declare var __electronMochaRenderer__: any;
