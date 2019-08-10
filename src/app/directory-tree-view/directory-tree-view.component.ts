import { SelectionModel } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import { ChangeDetectorRef, Component } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { Analytics } from '../../../src-shared/analytics/analytics';
import { Logger } from '../../../src-shared/log/logger';
import { PhotoDataService } from '../shared/service/photo-data.service';
import { SelectedPhotoService } from '../shared/service/selected-photo.service';
import { DirectoryTreeViewDataService } from './directory-tree-view-data.service';
import { FlatNode, NestedNode } from './directory-tree-view.model';
import { DirTreeViewTooltipDisplayLogic } from './dir-tree-view-tooltip-display-logic';

/**
 * @title Directory tree view
 */
@Component({
  selector: 'app-directory-tree-view',
  templateUrl: 'directory-tree-view.component.html',
  styleUrls: ['directory-tree-view.component.scss']
})
export class DirectoryTreeViewComponent {
  public readonly treeControl: FlatTreeControl<FlatNode>;
  public readonly dataSource: MatTreeFlatDataSource<NestedNode, FlatNode>;
  private readonly treeFlattener: MatTreeFlattener<NestedNode, FlatNode>;
  private readonly flatNodeSelectionModel = new SelectionModel<FlatNode>(true /* multiple */);
  private readonly flatToNestedNodeMap = new Map<FlatNode, NestedNode>();
  private readonly nestedToFlatNodeMap = new Map<NestedNode, FlatNode>();
  private readonly getLevel = (flatNode: FlatNode) => flatNode.level;
  private readonly isExpandable = (flatNode: FlatNode) => flatNode.isExpandable;
  private readonly getChildren = (nestedNode: NestedNode): NestedNode[] => nestedNode.children;
  public readonly hasChildren = (_: number, flatNode: FlatNode) => flatNode.isExpandable;

  private readonly createFlatNode = (nestedNode: NestedNode, level: number) => {
    const flatNode =  new FlatNode();
    flatNode.name = nestedNode.name;
    flatNode.path = nestedNode.path;
    flatNode.isSelectable = nestedNode.isSelectable;
    flatNode.level = level;
    flatNode.isExpandable = nestedNode.children.length > 0;
    return flatNode;
  };

  private readonly transformNodeFromNestedToFlat = (nestedNode: NestedNode, level: number) => {
    const existingFlatNode = this.nestedToFlatNodeMap.get(nestedNode);
    if (existingFlatNode)
      return existingFlatNode;

    const flatNode =  this.createFlatNode(nestedNode, level);
    this.flatToNestedNodeMap.set(flatNode, nestedNode);
    this.nestedToFlatNodeMap.set(nestedNode, flatNode);
    return flatNode;
  };

  public readonly tooltipDisplayLogic: DirTreeViewTooltipDisplayLogic;

  constructor(private directoryTreeViewDataService: DirectoryTreeViewDataService,
              private selectedPhotoService: SelectedPhotoService,
              private photoDataService: PhotoDataService,
              private changeDetectorRef: ChangeDetectorRef) {
    this.treeControl = new FlatTreeControl<FlatNode>(this.getLevel, this.isExpandable);
    this.treeFlattener = new MatTreeFlattener(this.transformNodeFromNestedToFlat, this.getLevel, this.isExpandable, this.getChildren);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    directoryTreeViewDataService.dataChange
      .subscribe(data => this.handleDataChange(data));

    this.tooltipDisplayLogic = new DirTreeViewTooltipDisplayLogic(this.photoDataService);
  }

  private handleDataChange(data: NestedNode[]) {
    this.flatNodeSelectionModel.clear();
    this.flatToNestedNodeMap.clear();
    this.nestedToFlatNodeMap.clear();
    this.dataSource.data = data;
    if (data.length === 0)
      return;

    const rootNestedNode = data[0];
    const rootFlatNode = this.nestedToFlatNodeMap.get(rootNestedNode);
    this.toggleNodeSelection(rootFlatNode);
  }

  public isSelected(flatNode: FlatNode): boolean {
    return this.flatNodeSelectionModel.isSelected(flatNode);
  }

  public allDescendantsSelected(flatNode: FlatNode): boolean {
    const descendants = this.getSelectableDescendants(flatNode);
    const allDescendantsSelected = descendants
      .every(child => this.isSelected(child));
    return allDescendantsSelected;
  }

  public partOfDescendantsSelected(flatNode: FlatNode): boolean {
    const descendants = this.getSelectableDescendants(flatNode);
    const moreThanOneDescendantsSelected = descendants
      .some(child => this.isSelected(child));
    return moreThanOneDescendantsSelected && !this.allDescendantsSelected(flatNode);
  }

  private getSelectableDescendants(parent: FlatNode) {
    return this.treeControl.getDescendants(parent)
      .filter(child => child.isSelectable);
  }

  public handleCheckboxChange(flatNode: FlatNode): void {
    const folderOrFile = flatNode.isExpandable ? 'Folder' : 'File';
    Logger.info(`Toggled Directory Tree View Checkbox (${folderOrFile}): ${flatNode.path}`);
    Analytics.trackEvent('Directory Tree View', `Toggle Checkbox (${folderOrFile})`);
    this.toggleNodeSelection(flatNode);
  }

  private toggleNodeSelection(flatNode: FlatNode) {
    if (!flatNode.isSelectable)
      return;

    this.flatNodeSelectionModel.toggle(flatNode);
    if (flatNode.isExpandable) {
      this.toggleAllDescendants(flatNode);
    }

    this.updateAllParents(flatNode);
    this.changeDetectorRef.detectChanges();
    const selectedPaths = this.flatNodeSelectionModel.selected
      .filter(node => !node.isExpandable)
      .filter(node => node.isSelectable)
      .map(node => node.path);
    this.selectedPhotoService.update(selectedPaths);
  }

  private toggleAllDescendants(parent: FlatNode) {
    const descendants = this.getSelectableDescendants(parent);
    if (this.isSelected(parent)) {
      this.flatNodeSelectionModel.select(...descendants);
    } else {
      this.flatNodeSelectionModel.deselect(...descendants);
    }
  }

  private updateAllParents(flatNode: FlatNode): void {
    let parent: FlatNode | null = this.getParentNode(flatNode);
    while (parent) {
      this.updateSelectionAccordingToDescendants(parent);
      parent = this.getParentNode(parent);
    }
  }

  private updateSelectionAccordingToDescendants(flatNode: FlatNode): void {
    const isSelected = this.isSelected(flatNode);
    const allDescendantsSelected = this.allDescendantsSelected(flatNode);
    if (isSelected && !allDescendantsSelected) {
      this.flatNodeSelectionModel.deselect(flatNode);
    } else if (!isSelected && allDescendantsSelected) {
      this.flatNodeSelectionModel.select(flatNode);
    }
  }

  private getParentNode(flatNode: FlatNode): FlatNode | null {
    const currentLevel = this.getLevel(flatNode);
    if (currentLevel < 1)
      return null;

    const startIndex = this.treeControl.dataNodes.indexOf(flatNode) - 1;
    for (let i = startIndex; i >= 0; i--) {
      const currentNode = this.treeControl.dataNodes[i];
      if (this.getLevel(currentNode) < currentLevel)
        return currentNode;
    }

    return null;
  }
}
