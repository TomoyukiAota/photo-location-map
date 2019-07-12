import { Logger } from '../../../src-shared/log/logger';

export class DirTreeObjectRecorder {
  public static record(dirTreeObject: DirectoryTree): void {
    Logger.info('Directory tree object: ', dirTreeObject);
    const flattenedDirTree = this.convertToFlattenedDirTree(dirTreeObject);
    Logger.info('Flattened directory tree: ', flattenedDirTree);
    const totalNumOfItems = flattenedDirTree.length;
    const numOfDirectories = flattenedDirTree.filter(element => element.type === 'directory').length;
    const numOfFiles = flattenedDirTree.filter(element => element.type === 'file').length;
    Logger.info(`Numbers of items in the selected directory are as follows:`);
    Logger.info(`Total: ${totalNumOfItems}, Directory: ${numOfDirectories}, File: ${numOfFiles}`);
    // TODO: Add more numbers
  }

  private static convertToFlattenedDirTree(dirTreeObject: DirectoryTree): DirectoryTree[] {
    const flattenedDirTree: DirectoryTree[] = [];
    this.flattenDirectoryTree([dirTreeObject], flattenedDirTree);
    return flattenedDirTree;
  }

  private static flattenDirectoryTree(srcDirTreeArray: DirectoryTree[], dstDirTreeArray: DirectoryTree[]): DirectoryTree[] {
    srcDirTreeArray.forEach((element: DirectoryTree) => {
      dstDirTreeArray.push(element);
      if (element.children) {
        this.flattenDirectoryTree(element.children, dstDirTreeArray);
      }
    });
    return dstDirTreeArray;
  }
}
