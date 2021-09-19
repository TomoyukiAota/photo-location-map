import { FilenameExtension } from '../../../../src-shared/filename-extension/filename-extension';
import { Exif } from './exif.model';

export class Photo {
  name: string;
  path: string;
  filenameExtension: string;
  exif: Exif;

  get isJpeg(): boolean { return FilenameExtension.isJpeg(this.filenameExtension); }
  get isHeif(): boolean { return FilenameExtension.isHeif(this.filenameExtension); }
  get isTiff(): boolean { return FilenameExtension.isTiff(this.filenameExtension); }
  get isPng(): boolean { return FilenameExtension.isPng(this.filenameExtension); }
  get isWebp(): boolean { return FilenameExtension.isWebp(this.filenameExtension); }
  get hasExif(): boolean { return !!this.exif; }
  get hasGpsInfo(): boolean { return !!this.exif?.gpsInfo; }
}
