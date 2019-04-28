import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as createDirectoryTree from 'directory-tree';
import { Logger } from '../../../src-shared/log/logger';
import { NestedNode } from './directory-tree-view.model';

type DirectoryTree = ReturnType<typeof createDirectoryTree>;

/**
 * Tree view data service. This can build a tree structured object for tree view.
 */
@Injectable()
export class DirectoryTreeViewDataService {
  public readonly dataChange = new BehaviorSubject<NestedNode[]>([]);

  public update(directoryPath: string): void {
    const directoryTreeObject = createDirectoryTree(directoryPath);
    Logger.info('Directory tree object: ', directoryTreeObject);
    const nestedNodeArray = this.convertToNestedNodeArray([directoryTreeObject]);
    this.dataChange.next(nestedNodeArray);
  }

  private convertToNestedNodeArray(directoryTreeArray: DirectoryTree[]): NestedNode[] {
    const nestedNodeArray = directoryTreeArray.map(directoryTree => {
      const nestedNode = new NestedNode();
      nestedNode.name = directoryTree.name;
      nestedNode.isSelectable = this.isSelectableNode(directoryTree);
      nestedNode.children = !!directoryTree.children
        ? this.convertToNestedNodeArray(directoryTree.children)
        : [];
      return nestedNode;
    });
    return nestedNodeArray;
  }

  private isSelectableNode(directoryTree: DirectoryTree): boolean {
    const isFile = directoryTree.type === 'file';
    if (isFile) {
      const supportedExtensions = ['.jpeg', '.jpg', '.jpe', '.jfif', '.jfi', '.jif']; // JPEG extensions
      const isSupportedExtension = supportedExtensions.includes(directoryTree.extension);
      return isSupportedExtension;
    }

    const someChildrenSelectable = directoryTree.children.some(child => {
      return this.isSelectableNode(child);
    });
    return someChildrenSelectable;
  }
}
