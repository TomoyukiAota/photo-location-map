import {SelectionModel} from '@angular/cdk/collections';
import {FlatTreeControl} from '@angular/cdk/tree';
import {Component, Injectable} from '@angular/core';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import {BehaviorSubject} from 'rxjs';

import { treeData } from './tree-data';

/**
 * Nested node of tree view.
 */
export class NestedNode {
  children: NestedNode[];
  item: string;
}

/** Flat node with expandable and level information */
export class FlatNode {
  item: string;
  level: number;
  expandable: boolean;
}

/**
 * Tree view data service. This can build a tree structured object for tree view.
 */
@Injectable()
export class TreeViewDataService {
  dataChange = new BehaviorSubject<NestedNode[]>([]);

  get data(): NestedNode[] { return this.dataChange.value; }

  constructor() {
    this.initialize();
  }

  initialize() {
    const tree = this.buildNodeTree(treeData, 0);

    // Notify the change.
    this.dataChange.next(tree);
  }

  /**
   * Build the node tree.
   */
  buildNodeTree(obj: {[key: string]: any}, level: number): NestedNode[] {
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

  /** Add an item to to-do list */
  insertItem(parent: NestedNode, name: string) {
    if (parent.children) {
      parent.children.push({item: name} as NestedNode);
      this.dataChange.next(this.data);
    }
  }

  updateItem(node: NestedNode, name: string) {
    node.item = name;
    this.dataChange.next(this.data);
  }
}

/**
 * @title Tree with checkboxes
 */
@Component({
  selector: 'app-directory-tree-view',
  templateUrl: 'directory-tree-view.component.html',
  styleUrls: ['directory-tree-view.component.css'],
  providers: [TreeViewDataService]
})
export class DirectoryTreeViewComponent {
  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  flatToNestedNodeMap = new Map<FlatNode, NestedNode>();

  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  nestedToFlatNodeMap = new Map<NestedNode, FlatNode>();

  /** A selected parent node to be inserted */
  selectedParent: FlatNode | null = null;

  /** The new item's name */
  newItemName = '';

  treeControl: FlatTreeControl<FlatNode>;

  treeFlattener: MatTreeFlattener<NestedNode, FlatNode>;

  dataSource: MatTreeFlatDataSource<NestedNode, FlatNode>;

  flatNodeSelectionModel = new SelectionModel<FlatNode>(true /* multiple */);

  constructor(private treeViewDataService: TreeViewDataService) {
    this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel,
      this.isExpandable, this.getChildren);
    this.treeControl = new FlatTreeControl<FlatNode>(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    treeViewDataService.dataChange.subscribe(data => {
      this.dataSource.data = data;
    });
  }

  getLevel = (flatNode: FlatNode) => flatNode.level;

  isExpandable = (flatNode: FlatNode) => flatNode.expandable;

  getChildren = (nestedNode: NestedNode): NestedNode[] => nestedNode.children;

  hasChild = (_: number, flatNode: FlatNode) => flatNode.expandable;

  /**
   * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
   */
  transformer = (nestedNode: NestedNode, level: number) => {
    const existingFlatNode = this.nestedToFlatNodeMap.get(nestedNode);
    const flatNode = existingFlatNode && existingFlatNode.item === nestedNode.item  // TODO: Is `item` property comparison required?
        ? existingFlatNode
        : new FlatNode();
    flatNode.item = nestedNode.item;
    flatNode.level = level;
    flatNode.expandable = !!nestedNode.children;
    this.flatToNestedNodeMap.set(flatNode, nestedNode);
    this.nestedToFlatNodeMap.set(nestedNode, flatNode);
    return flatNode;
  }

  /** Whether all the descendants of the node are selected. */
  descendantsAllSelected(flatNode: FlatNode): boolean {
    const descendants = this.treeControl.getDescendants(flatNode);
    const descendantsAllSelected = descendants.every(child =>
      this.flatNodeSelectionModel.isSelected(child)
    );
    return descendantsAllSelected;
  }

  /** Whether part of the descendants are selected */
  descendantsPartiallySelected(flatNode: FlatNode): boolean {
    const descendants = this.treeControl.getDescendants(flatNode);
    const result = descendants.some(child => this.flatNodeSelectionModel.isSelected(child));
    return result && !this.descendantsAllSelected(flatNode);
  }

  /** Toggle the to-do item selection. Select/deselect all the descendants node */
  todoItemSelectionToggle(flatNode: FlatNode): void {
    this.flatNodeSelectionModel.toggle(flatNode);
    const descendants = this.treeControl.getDescendants(flatNode);
    this.flatNodeSelectionModel.isSelected(flatNode)
      ? this.flatNodeSelectionModel.select(...descendants)
      : this.flatNodeSelectionModel.deselect(...descendants);

    // Force update for the parent
    descendants.every(child =>
      this.flatNodeSelectionModel.isSelected(child)
    );
    this.checkAllParentsSelection(flatNode);
  }

  /** Toggle a leaf to-do item selection. Check all the parents to see if they changed */
  todoLeafItemSelectionToggle(flatNode: FlatNode): void {
    this.flatNodeSelectionModel.toggle(flatNode);
    this.checkAllParentsSelection(flatNode);
  }

  /* Checks all the parents when a leaf node is selected/unselected */
  checkAllParentsSelection(flatNode: FlatNode): void {
    let parent: FlatNode | null = this.getParentNode(flatNode);
    while (parent) {
      this.checkRootNodeSelection(parent);
      parent = this.getParentNode(parent);
    }
  }

  /** Check root node checked state and change it accordingly */
  checkRootNodeSelection(flatNode: FlatNode): void {
    const nodeSelected = this.flatNodeSelectionModel.isSelected(flatNode);
    const descendants = this.treeControl.getDescendants(flatNode);
    const descAllSelected = descendants.every(child =>
      this.flatNodeSelectionModel.isSelected(child)
    );
    if (nodeSelected && !descAllSelected) {
      this.flatNodeSelectionModel.deselect(flatNode);
    } else if (!nodeSelected && descAllSelected) {
      this.flatNodeSelectionModel.select(flatNode);
    }
  }

  /* Get the parent node of a node */
  getParentNode(flatNode: FlatNode): FlatNode | null {
    const currentLevel = this.getLevel(flatNode);

    if (currentLevel < 1) {
      return null;
    }

    const startIndex = this.treeControl.dataNodes.indexOf(flatNode) - 1;

    for (let i = startIndex; i >= 0; i--) {
      const currentNode = this.treeControl.dataNodes[i];

      if (this.getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
    return null;
  }
}
