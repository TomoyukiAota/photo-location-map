export class SupportedFilenameExtensions {
  public static readonly jpegExtensions: ReadonlyArray<string> = ['.jpeg', '.jpg', '.jpe', '.jfif', '.jfi', '.jif'];
  public static readonly supportedExtensions = SupportedFilenameExtensions.jpegExtensions;

  public static isSupported(extension: string) {
    const isSupportedExtension = this.supportedExtensions.includes(extension);
    return isSupportedExtension;
  }

  public static isJpeg(extension: string) {
    return this.jpegExtensions.includes(extension);
  }
}
