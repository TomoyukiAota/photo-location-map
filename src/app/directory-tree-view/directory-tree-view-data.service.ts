import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PhotoDataService } from '../shared/service/photo-data.service';
import { DirectoryTreeViewSortService } from './directory-tree-view-sort.service';
import { NestedNode } from './directory-tree-view.model';

/**
 * Tree view data service. This can build a tree structured object for tree view.
 */
@Injectable({
  providedIn: 'root'
})
export class DirectoryTreeViewDataService {
  public readonly dataReplaced = new BehaviorSubject<NestedNode[]>([]);

  constructor(private photoDataService: PhotoDataService,
              private sortService: DirectoryTreeViewSortService,
  ) {
  }

  public replace(directoryTreeObject: DirectoryTree): void {
    const nestedNodeArray = this.convertToNestedNodeArray([directoryTreeObject]);
    const sorted = this.sortService.sortData(nestedNodeArray, {key: 'Name', direction: 'Ascending'});
    this.dataReplaced.next(sorted);
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
}
