import { Exif } from './exif.model';

export class Photo {
  name: string;
  path: string;
  filenameExtension: string;
  exif: Exif;
}
