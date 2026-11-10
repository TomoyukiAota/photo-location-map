import type { DirectoryTree } from 'directory-tree';
import type { Stats } from 'fs';
import * as pathModule from 'path';
import type { DirectoryTreeResult } from '../../src-shared/bridge/plm-bridge';
import { createDirectoryTree } from '../../src-shared/dir-tree/create-directory-tree';
import { convertToFlattenedDirTree } from '../../src-shared/dir-tree/dir-tree-util';
import { FilenameExtension } from '../../src-shared/filename-extension/filename-extension';
import { excludedPathPatterns } from './excluded-paths';

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
 * For each file with a Live Photos movie next to it, the movie's path: the file whose path is the photo's with an
 * extension of Live Photos, each in turn, without regard to case.
 * TL;DR: The path is the movie's own, as the folder has it, not the lowercased one that it is matched by.
 * Details: The lowercased path was given at first, as the renderer had matched and opened the movies before the main
 * process read the folder. macOS and Windows open a file by such a path on their usual file systems, which have no
 * regard to case. A file system that has, as those of Linux, has no file at that path, and the main process refused
 * to open it: with a capital letter in it, the path is not in a folder that the user opened
 * (../ipc/user-chosen-folders.ts), so the button of a photo's Live Photos did nothing there.
 */
function livePhotosOf(tree: DirectoryTree): Record<string, string> {
  const files = convertToFlattenedDirTree(tree).filter(element => element?.type === 'file');
  const movies = new Map(files
    .filter(element => FilenameExtension.isLivePhotos(element.extension))
    .map(element => [element.path.toLowerCase(), element.path]));
  const livePhotos: Record<string, string> = {};
  if (movies.size === 0)
    return livePhotos;
  for (const file of files) {
    if (FilenameExtension.isLivePhotos(file.extension))
      continue;
    const parsedPath = pathModule.parse(file.path);
    for (const extension of FilenameExtension.extensionsForLivePhotos) {
      const moviePath = movies.get(pathModule.join(parsedPath.dir, parsedPath.name + extension).toLowerCase());
      if (moviePath) {
        livePhotos[file.path] = moviePath;
        break;
      }
    }
  }
  return livePhotos;
}
