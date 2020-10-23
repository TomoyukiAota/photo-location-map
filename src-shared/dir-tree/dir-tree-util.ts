import { DirectoryTree } from 'directory-tree';

export function convertToFlattenedDirTree(dirTreeObject: DirectoryTree): DirectoryTree[] {
  const flattenedDirTree: DirectoryTree[] = [];
  flattenDirectoryTree([dirTreeObject], flattenedDirTree);
  return flattenedDirTree;
}

function flattenDirectoryTree(srcDirTreeArray: DirectoryTree[], dstDirTreeArray: DirectoryTree[]): DirectoryTree[] {
  srcDirTreeArray.forEach((element: DirectoryTree) => {
    dstDirTreeArray.push(element);
    if (element.children) {
      flattenDirectoryTree(element.children, dstDirTreeArray);
    }
  });
  return dstDirTreeArray;
}
