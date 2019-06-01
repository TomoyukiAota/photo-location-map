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
  public readonly dataChange = new BehaviorSubject<NestedNode[]>([]);

  constructor(private photoDataService: PhotoDataService) {
  }

  public update(directoryTreeObject: DirectoryTree): void {
    const nestedNodeArray = this.convertToNestedNodeArray([directoryTreeObject]);
    this.dataChange.next(nestedNodeArray);
  }

  private convertToNestedNodeArray(directoryTreeArray: DirectoryTree[]): NestedNode[] {
    const nestedNodeArray = directoryTreeArray.map(directoryTree => {
      const nestedNode = new NestedNode();
      nestedNode.name = directoryTree.name;
      nestedNode.path = directoryTree.path;
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
