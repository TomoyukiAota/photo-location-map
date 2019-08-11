export class FilenameExtension {
  public static readonly jpegExtensions: ReadonlyArray<string> = ['.jpeg', '.jpg', '.jpe', '.jfif', '.jfi', '.jif'];
  public static readonly tiffExtensions: ReadonlyArray<string> = ['.tiff', '.tif'];
  public static readonly supportedExtensions = [...FilenameExtension.jpegExtensions];

  public static isSupported(extension: string) {
    return this.supportedExtensions.includes(extension);
  }

  public static isJpeg(extension: string) {
    return this.jpegExtensions.includes(extension);
  }

  public static isTiff(extension: string) {
    return this.tiffExtensions.includes(extension);
  }
}
