export class SupportedFilenameExtensions {
  public static readonly jpegExtensions = ['.jpeg', '.jpg', '.jpe', '.jfif', '.jfi', '.jif'];
  public static readonly supportedExtensions = SupportedFilenameExtensions.jpegExtensions;

  public static isSupported(extension: string) {
    const isSupportedExtension = this.supportedExtensions.includes(extension);
    return isSupportedExtension;
  }
}
