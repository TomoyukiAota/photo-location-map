// Import-time worker creation is outside component construction tests. Real
// discovery and Live Photos lookup run in the Playwright application suite.
export class OpenedDirectory {
  public static createDirectoryTree(_directory: string): Promise<DirectoryTree> {
    throw new Error('Directory discovery requires the real application test environment');
  }

  public static getLivePhotosFilePathIfAvailable(_filePath: string): { livePhotosAvailable: boolean; livePhotosFilePath: string } {
    throw new Error('Live Photos lookup requires the real application test environment');
  }
}
