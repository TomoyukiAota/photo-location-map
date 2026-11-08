import type { DirectoryTree } from 'directory-tree';

// Without Node.js, for the renderer too. The main process makes the trees (src-shared/dir-tree/create-directory-tree.ts).

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
