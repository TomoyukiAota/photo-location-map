import directoryTree, { DirectoryTree, DirectoryTreeCallback, DirectoryTreeOptions } from 'directory-tree';

// Node.js only: the main process makes the trees (src-main/directory-tree/). The renderer gets them as data.

// Version 3 omits the metadata that version 2 returned by default.
export function createDirectoryTree(dirPath: string, options?: DirectoryTreeOptions,
                                    onEachFile?: DirectoryTreeCallback, onEachDirectory?: DirectoryTreeCallback): DirectoryTree {
  return directoryTree(dirPath, { attributes: ['size', 'type', 'extension'], ...options }, onEachFile, onEachDirectory);
}
