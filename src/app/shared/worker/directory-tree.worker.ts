import { expose } from 'comlink';
import * as createDirectoryTree from 'directory-tree';
import { DirectoryTree } from 'directory-tree';
import { convertToFlattenedDirTree } from '../../../../src-shared/dir-tree/dir-tree-util';

export const api = {
  async createDirectoryTree(selectedDirPath: string, option?: createDirectoryTree.DirectoryTreeOptions) {
    return createDirectoryTree(selectedDirPath, option);
  },
  async convertToFlattenedDirTree(directoryTree: DirectoryTree) {
    return convertToFlattenedDirTree(directoryTree);
  }
};

expose(api);
