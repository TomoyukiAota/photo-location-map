import { expose } from 'comlink';
import { DirectoryTree, DirectoryTreeCallback, DirectoryTreeOptions } from 'directory-tree';
import { Stats } from 'fs';
import { createDirectoryTree, convertToFlattenedDirTree } from '../../../../src-shared/dir-tree/dir-tree-util';

export const api = {
  async createDirectoryTree(dirPath: string, option?: DirectoryTreeOptions) {
    const onEachItemCallback: DirectoryTreeCallback = (item: DirectoryTree, path: string, stats: Stats) => item['fsStats'] = stats;
    return createDirectoryTree(dirPath, option, onEachItemCallback, onEachItemCallback);
  },
  async convertToFlattenedDirTree(directoryTree: DirectoryTree) {
    return convertToFlattenedDirTree(directoryTree);
  }
};

expose(api);
