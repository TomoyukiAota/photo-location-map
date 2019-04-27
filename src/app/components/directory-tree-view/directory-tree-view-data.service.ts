import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { directoryTreeData } from './tree-data';
import { NestedNode } from './directory-tree-view.model';

/**
 * Tree view data service. This can build a tree structured object for tree view.
 */
@Injectable()
export class DirectoryTreeViewDataService {
  public readonly dataChange = new BehaviorSubject<NestedNode[]>([]);

  constructor() {
    this.dataChange.next(directoryTreeData);
  }
}
