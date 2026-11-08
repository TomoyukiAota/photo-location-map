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
 * For each file with a Live Photos movie next to it, the movie's path, lowercased: the photo's path with each extension
 * of Live Photos in turn, matched without regard to case, as the renderer matched them.
 */
function livePhotosOf(tree: DirectoryTree): Record<string, string> {
  const files = convertToFlattenedDirTree(tree).filter(element => element?.type === 'file');
  const movies = new Set(files
    .filter(element => FilenameExtension.isLivePhotos(element.extension))
    .map(element => element.path.toLowerCase()));
  const livePhotos: Record<string, string> = {};
  if (movies.size === 0)
    return livePhotos;
  for (const file of files) {
    if (FilenameExtension.isLivePhotos(file.extension))
      continue;
    const parsedPath = pathModule.parse(file.path);
    for (const extension of FilenameExtension.extensionsForLivePhotos) {
      const moviePath = pathModule.join(parsedPath.dir, parsedPath.name + extension).toLowerCase();
      if (movies.has(moviePath)) {
        livePhotos[file.path] = moviePath;
        break;
      }
    }
  }
  return livePhotos;
}
