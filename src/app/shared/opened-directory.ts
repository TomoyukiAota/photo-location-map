import { bridge } from '../../../src-shared/bridge/plm-bridge';

/** The folder that the user opened: its tree, which the main process reads (src-main/directory-tree/). */
export class OpenedDirectory {
  private static livePhotos: Record<string, string> = {};

  /** The tree of the folder at `dirPath`, without its hidden files; each item has `fsStats` with its `mtime`. */
  public static async createDirectoryTree(dirPath: string): Promise<DirectoryTree> {
    const result = await bridge().directoryTree.create(dirPath);
    if (result.kind === 'failed')
      throw new Error(result.message);
    if (!result.tree)
      throw new Error(`The folder "${dirPath}" could not be read.`);
    this.livePhotos = result.livePhotos;
    return result.tree;
  }

  /** The Live Photos movie next to a photo, which the main process matched when it read the folder. */
  public static getLivePhotosFilePathIfAvailable(photoFilePath: string) {
    const livePhotosFilePath = Object.hasOwn(this.livePhotos, photoFilePath) ? this.livePhotos[photoFilePath] : '';
    return {
      livePhotosAvailable: !!livePhotosFilePath,
      livePhotosFilePath,
    };
  }
}
