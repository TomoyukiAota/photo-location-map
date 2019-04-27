import { SelectionModel } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import { Component } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { DirectoryTreeViewDataService } from './directory-tree-view-data.service';
import { FlatNode, NestedNode } from './directory-tree-view.model';

/**
 * @title Directory tree view
 */
@Component({
  selector: 'app-directory-tree-view',
  templateUrl: 'directory-tree-view.component.html',
  styleUrls: ['directory-tree-view.component.css'],
  providers: [DirectoryTreeViewDataService]
})
export class DirectoryTreeViewComponent {
  public readonly treeControl: FlatTreeControl<FlatNode>;
  public readonly dataSource: MatTreeFlatDataSource<NestedNode, FlatNode>;
  public readonly flatNodeSelectionModel = new SelectionModel<FlatNode>(true /* multiple */);
  private readonly flatToNestedNodeMap = new Map<FlatNode, NestedNode>();
  private readonly nestedToFlatNodeMap = new Map<NestedNode, FlatNode>();
  private readonly treeFlattener: MatTreeFlattener<NestedNode, FlatNode>;
  private readonly getLevel = (flatNode: FlatNode) => flatNode.level;
  private readonly isExpandable = (flatNode: FlatNode) => flatNode.expandable;
  private readonly getChildren = (nestedNode: NestedNode): NestedNode[] => nestedNode.children;

  /**
   * Transform function to convert nested node to flat node. Record the nodes in maps for later use.
   */
  private readonly transform = (nestedNode: NestedNode, level: number) => {
    const existingFlatNode = this.nestedToFlatNodeMap.get(nestedNode);
    const flatNode = existingFlatNode && existingFlatNode.name === nestedNode.name  // TODO: Is `name` property comparison required?
        ? existingFlatNode
        : new FlatNode();
    flatNode.name = nestedNode.name;
    flatNode.isSelectable = nestedNode.isSelectable;
    flatNode.level = level;
    flatNode.expandable = !!nestedNode.children;
    this.flatToNestedNodeMap.set(flatNode, nestedNode);
    this.nestedToFlatNodeMap.set(nestedNode, flatNode);
    return flatNode;
  };

  public readonly hasChild = (_: number, flatNode: FlatNode) => flatNode.expandable;

  constructor(private treeViewDataService: DirectoryTreeViewDataService) {
    this.treeFlattener = new MatTreeFlattener(this.transform, this.getLevel, this.isExpandable, this.getChildren);
    this.treeControl = new FlatTreeControl<FlatNode>(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    treeViewDataService.dataChange.subscribe(data => {
      this.dataSource.data = data;
    });
  }

  public descendantsAllSelected(flatNode: FlatNode): boolean {
    const descendants = this.treeControl.getDescendants(flatNode);
    const descendantsAllSelected = descendants
      .filter(child => child.isSelectable)
      .every(child => this.flatNodeSelectionModel.isSelected(child));
    return descendantsAllSelected;
  }

  public descendantsPartiallySelected(flatNode: FlatNode): boolean {
    const descendants = this.treeControl.getDescendants(flatNode);
    const result = descendants
      .filter(child => child.isSelectable)
      .some(child => this.flatNodeSelectionModel.isSelected(child));
    return result && !this.descendantsAllSelected(flatNode);
  }

  public toggleInternalNodeSelection(flatNode: FlatNode): void {
    if (!flatNode.isSelectable)
      return;

    this.flatNodeSelectionModel.toggle(flatNode);
    const descendants = this.treeControl.getDescendants(flatNode);
    this.flatNodeSelectionModel.isSelected(flatNode)
      ? this.flatNodeSelectionModel.select(...descendants)
      : this.flatNodeSelectionModel.deselect(...descendants);
    this.updateAllParents(flatNode);
  }

  public toggleLeafNodeSelection(flatNode: FlatNode): void {
    if (!flatNode.isSelectable)
      return;

    this.flatNodeSelectionModel.toggle(flatNode);
    this.updateAllParents(flatNode);
  }

  private updateAllParents(flatNode: FlatNode): void {
    let parent: FlatNode | null = this.getParentNode(flatNode);
    while (parent) {
      this.updateSelectionAccordingToDescendants(parent);
      parent = this.getParentNode(parent);
    }
  }

  private updateSelectionAccordingToDescendants(flatNode: FlatNode): void {
    const isSelected = this.flatNodeSelectionModel.isSelected(flatNode);
    const descendants = this.treeControl.getDescendants(flatNode);
    const isAllDescendantsSelected = descendants
      .filter(child => child.isSelectable)
      .every(child => this.flatNodeSelectionModel.isSelected(child));
    if (isSelected && !isAllDescendantsSelected) {
      this.flatNodeSelectionModel.deselect(flatNode);
    } else if (!isSelected && isAllDescendantsSelected) {
      this.flatNodeSelectionModel.select(flatNode);
    }
  }

  private getParentNode(flatNode: FlatNode): FlatNode | null {
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
