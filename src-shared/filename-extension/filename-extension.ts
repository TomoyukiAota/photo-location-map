import { exifFetchLibraryInUse } from '../exif-fetch-library-in-use/exif-fetch-library-in-use';
import { Logger } from '../log/logger';

export class FilenameExtension {
  private static readonly jpegExtensions: ReadonlyArray<string> = ['.jpeg', '.jpg', '.jpe', '.jfif', '.jfi', '.jif'];
  private static readonly tiffExtensions: ReadonlyArray<string> = ['.tiff', '.tif'];
  private static readonly pngExtensions:  ReadonlyArray<string> = ['.png'];
  private static readonly heifExtensions: ReadonlyArray<string> = ['.heif', '.heic'];
  private static readonly webpExtensions: ReadonlyArray<string> = ['.webp'];

  public static isJpeg(extension: string) { return this.jpegExtensions.includes(extension); }
  public static isTiff(extension: string) { return this.tiffExtensions.includes(extension); }
  public static isPng (extension: string) { return this.pngExtensions.includes(extension);  }
  public static isHeif(extension: string) { return this.heifExtensions.includes(extension); }
  public static isWebp(extension: string) { return this.webpExtensions.includes(extension); }

  private static readonly extensionsSupportedByExifr: ReadonlyArray<string> = [
    ...FilenameExtension.jpegExtensions,
    ...FilenameExtension.tiffExtensions,
    ...FilenameExtension.pngExtensions,
    ...FilenameExtension.heifExtensions,
  ];

  private static readonly extensionsSupportedByExifParser: ReadonlyArray<string> = [
    ...FilenameExtension.jpegExtensions,
  ];

  private static readonly extensionsDisplayableInBrowser: ReadonlyArray<string> = [
    ...FilenameExtension.jpegExtensions,
    ...FilenameExtension.pngExtensions,
  ];

  public static isSupportedByPlm(extension: string) {
    let supportedExtensions: ReadonlyArray<string>;

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

  public static isThumbnailGenerationAvailable(extension: string) {
    return this.isHeif(extension);
  }
}
