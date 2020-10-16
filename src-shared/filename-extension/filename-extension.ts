import { exifFetchLibraryInUse } from '../exif-fetch-library-in-use/exif-fetch-library-in-use';
import { Logger } from '../log/logger';

export class FilenameExtension {
  public static readonly jpegExtensions: ReadonlyArray<string> = ['.jpeg', '.jpg', '.jpe', '.jfif', '.jfi', '.jif'];
  public static readonly tiffExtensions: ReadonlyArray<string> = ['.tiff', '.tif'];
  public static readonly heifExtensions: ReadonlyArray<string> = ['.heif', '.heic'];

  public static readonly extensionsSupportedByExifr = [
    ...FilenameExtension.jpegExtensions,
    ...FilenameExtension.heifExtensions,
  ];

  public static readonly extensionsSupportedByExifParser = [
    ...FilenameExtension.jpegExtensions,
  ];

  public static readonly extensionsDisplayableInBrowser = [
    ...FilenameExtension.jpegExtensions
  ];

  public static isSupportedByPlm(extension: string) {
    let supportedExtensions: Array<string>;

    if (exifFetchLibraryInUse === 'exifr') {
      supportedExtensions = this.extensionsSupportedByExifr;
    } else if (exifFetchLibraryInUse === 'exif-parser') {
      supportedExtensions = this.extensionsSupportedByExifParser;
    } else {
      Logger.error(`Specified value of exifFetchLibraryInUse is incorrect. The value is "${exifFetchLibraryInUse}"`);
    }

    return supportedExtensions.includes(extension);
  }

  public static isDisplayableInBrowser(extension: string) {
    return this.extensionsDisplayableInBrowser.includes(extension);
  }

  public static isJpeg(extension: string) {
    return this.jpegExtensions.includes(extension);
  }

  public static isTiff(extension: string) {
    return this.tiffExtensions.includes(extension);
  }

  public static isHeif(extension: string) {
    return this.heifExtensions.includes(extension);
  }
}
