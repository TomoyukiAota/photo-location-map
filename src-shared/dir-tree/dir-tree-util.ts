import directoryTree, { DirectoryTree, DirectoryTreeCallback, DirectoryTreeOptions } from 'directory-tree';

// Version 3 omits the metadata that version 2 returned by default.
export function createDirectoryTree(dirPath: string, options?: DirectoryTreeOptions,
                                    onEachFile?: DirectoryTreeCallback, onEachDirectory?: DirectoryTreeCallback): DirectoryTree {
  return directoryTree(dirPath, { attributes: ['size', 'type', 'extension'], ...options }, onEachFile, onEachDirectory);
}

export function convertToFlattenedDirTree(dirTreeObject: DirectoryTree): DirectoryTree[] {
  const flattenedDirTree: DirectoryTree[] = [];
  flattenDirectoryTree([dirTreeObject], flattenedDirTree);
  return flattenedDirTree;
}

function flattenDirectoryTree(srcDirTreeArray: DirectoryTree[], dstDirTreeArray: DirectoryTree[]): DirectoryTree[] {
  srcDirTreeArray.forEach((element: DirectoryTree) => {
    dstDirTreeArray.push(element);
    if (element?.children) {
      flattenDirectoryTree(element.children, dstDirTreeArray);
    }
  });
  return dstDirTreeArray;
}
