import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { PhotoDataService } from '../shared/service/photo-data.service';
import { DirTreeViewSortService } from './dir-tree-view-sort/dir-tree-view-sort.service';
import { NestedNode } from './directory-tree-view.model';

/**
 * Tree view data service. This can build a tree structured object for tree view.
 */
@Injectable({
  providedIn: 'root'
})
export class DirectoryTreeViewDataService {
  private photoDataService = inject(PhotoDataService);
  private sortService = inject(DirTreeViewSortService);

  /**
   * The tree of a newly opened folder. An event rather than a signal: the tree view handles it synchronously, so that by
   * the time OpenFolderService.open() resolves, the tree is built and its photos are selected. --open with a photo
   * relies on that, as it selects the photo right after (docs/tasks/20261107_angular-signals-zoneless/PLAN.md, 1E). The
   * tree view exists from the start, so it needs no initial value.
   */
  public readonly dataReplaced = new Subject<NestedNode[]>();

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
