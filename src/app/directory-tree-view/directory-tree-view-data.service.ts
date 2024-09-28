import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PhotoDataService } from '../shared/service/photo-data.service';
import { NestedNode } from './directory-tree-view.model';

/**
 * Tree view data service. This can build a tree structured object for tree view.
 */
@Injectable({
  providedIn: 'root'
})
export class DirectoryTreeViewDataService {
  public readonly dataReplaced = new BehaviorSubject<NestedNode[]>([]);

  constructor(private photoDataService: PhotoDataService) {
  }

  public replace(directoryTreeObject: DirectoryTree): void {
    const nestedNodeArray = this.convertToNestedNodeArray([directoryTreeObject]);
    if (nestedNodeArray.length > 0) {
      this.sortNestedNodeRecursively(nestedNodeArray[0]);
    }
    this.dataReplaced.next(nestedNodeArray);
  }

  private convertToNestedNodeArray(directoryTreeArray: DirectoryTree[]): NestedNode[] {
    const nestedNodeArray = directoryTreeArray.map(directoryTree => {
      const nestedNode = new NestedNode();
      nestedNode.name = directoryTree.name;
      nestedNode.path = directoryTree.path;
      nestedNode.type = directoryTree.type;
      nestedNode.fsStats = directoryTree['fsStats'];
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
      const isGpsInfoAvailable = !!this.photoDataService.getGpsInfo(directoryTree.path);
      return isGpsInfoAvailable;
    }

    const someChildrenSelectable = directoryTree.children.some(child => {
      return this.isSelectableNode(child);
    });
    return someChildrenSelectable;
  }

  private sortNestedNodeRecursively(node: NestedNode) {
    if (!node?.children) { return; }

    node.children.forEach(child => {
      if (child.children) {
        this.sortNestedNodeRecursively(child);
      }
    });
    node.children.sort((a, b) => {
      if (a.type === b.type) {
        return this.compareNodesOfSameTypeForSort(a, b);
      }
      return a.type > b.type ? 1 : -1; // Directories are listed first, and then files are listed second.
    });
  }

  private compareNodesOfSameTypeForSort(a: NestedNode, b: NestedNode): number {
    const sortType: 'Alphabetical' | 'TimeTaken' = 'Alphabetical';
    const sortOrder: 'Ascending' | 'Descending' = 'Ascending';

    if (sortType === 'Alphabetical') {
      if (sortOrder === 'Ascending') {
        return a.name.toUpperCase() < b.name.toUpperCase() ? -1 : 1;
      } else { // if Descending
        return a.name.toUpperCase() < b.name.toUpperCase() ? 1 : -1;
      }
    } else if (sortType === 'TimeTaken') {
      return 0; // TODO
    }

    console.error('Something went wrong. This line should not run.');
    return 0;
  }
}
