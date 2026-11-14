import type { DirectoryTree } from 'directory-tree';
import type { Stats } from 'fs';
import * as pathModule from 'path';
import type { DirectoryTreeResult } from '../../src-shared/bridge/plm-bridge.js';
import { createDirectoryTree } from '../../src-shared/dir-tree/create-directory-tree.js';
import { convertToFlattenedDirTree } from '../../src-shared/dir-tree/dir-tree-util.js';
import { FilenameExtension } from '../../src-shared/filename-extension/filename-extension.js';
import { excludedPathPatterns } from './excluded-paths.js';

/**
 * The tree of the folder at `dirPath`, without its hidden files, and the Live Photos movie of each photo. Synchronous:
 * it runs in a worker thread (directory-tree-worker.ts).
 * Each item has `fsStats` with its `mtime`, by which the tree sorts what has no time taken (dir-tree-view-sort).
 */
export function createFolderTree(dirPath: string): DirectoryTreeResult {
  const onEachItem = (item: DirectoryTree, _path: string, stats: Stats) => { item['fsStats'] = { mtime: stats.mtime }; };
  const tree = createDirectoryTree(dirPath, { exclude: excludedPathPatterns }, onEachItem, onEachItem);
  return { kind: 'ok', tree, livePhotos: tree ? livePhotosOf(tree) : {} };
}

/**
 * For each file with a Live Photos movie next to it, the movie's path: the file of the photo's folder whose name is
 * the photo's with an extension of Live Photos, each in turn, without regard to case.
 * TL;DR: The path is the movie's own, as the folder has it, not a lowercased one. Only the file's name is matched
 * without regard to case: the folder is the photo's own.
 * Details: The lowercased path was given at first, as the renderer had matched and opened the movies before the main
 * process read the folder. macOS and Windows open a file by such a path on their usual file systems, which have no
 * regard to case. A file system that has, as those of Linux, has no file at that path, and the main process refused
 * to open it: with a capital letter in it, the path is not in a folder that the user opened
 * (../ipc/user-chosen-folders.ts), so the button of a photo's Live Photos did nothing there.
 * Such a file system can also hold two folders whose names differ in case alone, `album` and `Album`. Matched by the
 * whole path in lower case, a photo of one would get a movie of the other, which would open now that the path is the
 * movie's own.
 */
export function livePhotosOf(tree: DirectoryTree): Record<string, string> {
  const files = convertToFlattenedDirTree(tree).filter(element => element?.type === 'file');
  const movies = new Map(files
    .filter(element => FilenameExtension.isLivePhotos(element.extension))
    .map((element): [string, string] => {
      const { dir, base } = pathModule.parse(element.path);
      return [nameInFolder(dir, base), element.path];
    }));
  const livePhotos: Record<string, string> = {};
  if (movies.size === 0)
    return livePhotos;
  for (const file of files) {
    if (FilenameExtension.isLivePhotos(file.extension))
      continue;
    const { dir, name } = pathModule.parse(file.path);
    for (const extension of FilenameExtension.extensionsForLivePhotos) {
      const moviePath = movies.get(nameInFolder(dir, name + extension));
      if (moviePath) {
        livePhotos[file.path] = moviePath;
        break;
      }
    }
  }
  return livePhotos;
}

/** What a photo and its movie are matched by: the folder as the tree has it, and the file's name in lower case. */
function nameInFolder(folder: string, fileName: string): string {
  return pathModule.join(folder, fileName.toLowerCase());
}
