import { bridge } from '../../../src-shared/bridge/plm-bridge';

/** The folder that the user opened: its tree, which the main process reads (src-main/directory-tree/). */
export class OpenedDirectory {
  /** The Live Photos movies of the folder whose tree is shown, by the paths of their photos. */
  private static livePhotos: Record<string, string> = {};

  /**
   * The tree of the folder at `dirPath`, without its hidden files; each item has `fsStats` with its `mtime`. With it
   * come the Live Photos movies of its photos, for setLivePhotos() once the tree is shown.
   */
  public static async createDirectoryTree(dirPath: string): Promise<{ tree: DirectoryTree; livePhotos: Record<string, string> }> {
    const result = await bridge().directoryTree.create(dirPath);
    if (result.kind === 'failed')
      throw new Error(result.message);
    if (!result.tree)
      throw new Error(`The folder "${dirPath}" could not be read.`);
    return { tree: result.tree, livePhotos: result.livePhotos };
  }

  /**
   * Has getLivePhotosFilePathIfAvailable() answer with the movies of the folder whose tree is shown from now on. Not
   * when its tree is read: the previous folder's rows are shown until it replaces them, and a row of the tree looks up
   * its photo's movie once it comes near the view (src/app/shared/near-view/), which may be then.
   */
  public static setLivePhotos(livePhotos: Record<string, string>): void {
    this.livePhotos = livePhotos;
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
