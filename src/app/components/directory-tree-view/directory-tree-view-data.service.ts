import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { treeData } from './tree-data';
import { NestedNode } from './directory-tree-view.model';

/**
 * Tree view data service. This can build a tree structured object for tree view.
 */
@Injectable()
export class DirectoryTreeViewDataService {
  public readonly dataChange = new BehaviorSubject<NestedNode[]>([]);

  constructor() {
    const tree = this.buildNodeTree(treeData, 0);
    this.dataChange.next(tree);
  }

  private buildNodeTree(obj: { [key: string]: any }, level: number): NestedNode[] {
    return Object.keys(obj).reduce<NestedNode[]>((accumulator, key) => {
      const value = obj[key];
      const node = new NestedNode();
      node.item = key;

      if (value != null) {
        if (typeof value === 'object') {
          node.children = this.buildNodeTree(value, level + 1);
        } else {
          node.item = value;
        }
      }

      return accumulator.concat(node);
    }, []);
  }
}
