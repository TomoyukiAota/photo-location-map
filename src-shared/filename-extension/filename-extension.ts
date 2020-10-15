export class FilenameExtension {
  public static readonly jpegExtensions: ReadonlyArray<string> = ['.jpeg', '.jpg', '.jpe', '.jfif', '.jfi', '.jif'];
  public static readonly tiffExtensions: ReadonlyArray<string> = ['.tiff', '.tif'];
  public static readonly heifExtensions: ReadonlyArray<string> = ['.heif', '.heic'];

  public static readonly extensionsSupportedByPlm = [
    ...FilenameExtension.jpegExtensions,
    ...FilenameExtension.heifExtensions,
  ];

  public static readonly extensionsDisplayableInBrowser = [
    ...FilenameExtension.jpegExtensions
  ];

  public static isSupportedByPlm(extension: string) {
    return this.extensionsSupportedByPlm.includes(extension);
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
