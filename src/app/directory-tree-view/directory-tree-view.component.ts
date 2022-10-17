import { FocusMonitor } from '@angular/cdk/a11y';
import { SelectionModel } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { Analytics } from '../../../src-shared/analytics/analytics';
import { createPrependedLogger } from '../../../src-shared/log/create-prepended-logger';
import { PhotoDataService } from '../shared/service/photo-data.service';
import { SelectedPhotoService } from '../shared/service/selected-photo.service';
import { DirTreeViewContextMenuData as ContextMenuData } from './dir-tree-view-context-menu/dir-tree-view-context-menu-data';
import { DirTreeViewContextMenuHelper as ContextMenuHelper } from './dir-tree-view-context-menu/dir-tree-view-context-menu-helper';
import { DirectoryTreeViewDataService } from './directory-tree-view-data.service';
import { DirectoryTreeViewSelectionService } from './directory-tree-view-selection.service';
import { FlatNode, NestedNode } from './directory-tree-view.model';
import { DirTreeViewTooltipDisplayLogic } from './dir-tree-view-tooltip-display-logic';

const dirTreeViewLogger = createPrependedLogger('[Directory Tree View]');

@Component({
  selector: 'app-directory-tree-view',
  templateUrl: 'directory-tree-view.component.html',
  styleUrls: ['directory-tree-view.component.scss']
})
export class DirectoryTreeViewComponent {
  // padding-left for each tree view node is `level * indentPerLevel` pixels where level is depth of the tree view node.
  public readonly indentPerLevel = 30;

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
              private directoryTreeViewSelectionService: DirectoryTreeViewSelectionService,
              private selectedPhotoService: SelectedPhotoService,
              private photoDataService: PhotoDataService,
              private changeDetectorRef: ChangeDetectorRef,
              private focusMonitor: FocusMonitor) {
    this.treeControl = new FlatTreeControl<FlatNode>(this.getLevel, this.isExpandable);
    this.treeFlattener = new MatTreeFlattener(this.transformNodeFromNestedToFlat, this.getLevel, this.isExpandable, this.getChildren);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    directoryTreeViewDataService.dataReplaced
      .subscribe(data => this.handleDirectoryTreeViewDataReplaced(data));

    directoryTreeViewSelectionService.selectionRequested
      .subscribe(photoPaths => this.handleDirectoryTreeViewSelectionRequested(photoPaths));

    this.tooltipDisplayLogic = new DirTreeViewTooltipDisplayLogic(this.photoDataService);
  }

  private handleDirectoryTreeViewDataReplaced(data: NestedNode[]) {
    this.flatNodeSelectionModel.clear();
    this.flatToNestedNodeMap.clear();
    this.nestedToFlatNodeMap.clear();
    this.dataSource.data = data;
    if (data.length === 0)
      return;

    const rootNestedNode = data[0];
    const rootFlatNode = this.nestedToFlatNodeMap.get(rootNestedNode);

    if (rootFlatNode.isSelectable) {
      // When the root node is selectable (i.e. some photos with location data exist in the selected folder),
      // select the root node in order to select all photos as the map's state after loading the folder.
      this.toggleNodeSelection(rootFlatNode);
    } else {
      // When the root node is not selectable (i.e. no photos with location data exist in the selected folder),
      // update SelectedPhotoService.selectedPhotos with an empty array so that the map will be displayed without photos.
      this.selectedPhotoService.setSelectedPhotosByPaths([]);
    }
  }

  private handleDirectoryTreeViewSelectionRequested(photoPaths: string[]) {
    if (!photoPaths) return;  // To do nothing for the initial value (null) of DirectoryTreeViewSelectionService::selectionRequested
    const allFlatNodes = Array.from(this.flatToNestedNodeMap.keys());
    const selectionRequestedNodes = allFlatNodes.filter(node => photoPaths.includes(node.path));
    this.selectNodes(selectionRequestedNodes);
  }

  // See also DirectoryTreeViewComponent::toggleNodeSelection function because similar steps are performed.
  private selectNodes(selectionRequestedNodes: FlatNode[]): void {
    const selectableNodes = selectionRequestedNodes.filter(node => node.isSelectable);
    if (selectableNodes.length === 0) {
      dirTreeViewLogger.info('There are no selectable nodes in the selection requested nodes.');
      dirTreeViewLogger.info('selectionRequestedNodes: ', selectionRequestedNodes);
      return;
    }

    const allFlatNodes = Array.from(this.flatToNestedNodeMap.keys());
    this.flatNodeSelectionModel.deselect(...allFlatNodes);
    this.flatNodeSelectionModel.select(...selectableNodes);

    selectableNodes.filter(node => node.isExpandable).forEach(node => this.selectAllDescendants(node));
    selectableNodes.forEach(node => this.updateAllParents(node));

    this.changeDetectorRef.detectChanges(); // To update checkbox in GUI after using flatNodeSelectionModel
    this.updateSelectedPhotosToReflectSelectedNodes();
  }

  private selectAllDescendants(parent: FlatNode): void {
    const descendants = this.getSelectableDescendants(parent);
    this.flatNodeSelectionModel.select(...descendants);
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
    dirTreeViewLogger.info(`Toggled Checkbox (${folderOrFile}): ${flatNode.path}`);
    Analytics.trackEvent('Directory Tree View', `[Tree View] Toggle Checkbox`, `Toggle Checkbox for ${folderOrFile}`);
    this.toggleNodeSelection(flatNode);
  }

  // See also DirectoryTreeViewComponent::selectNodes function because similar steps are performed.
  private toggleNodeSelection(flatNode: FlatNode): void {
    if (!flatNode.isSelectable) return;

    this.flatNodeSelectionModel.toggle(flatNode);

    if (flatNode.isExpandable) {
      this.toggleAllDescendants(flatNode);
    }
    this.updateAllParents(flatNode);

    this.changeDetectorRef.detectChanges();  // To update checkbox in GUI after using flatNodeSelectionModel
    this.updateSelectedPhotosToReflectSelectedNodes();
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

  private updateSelectedPhotosToReflectSelectedNodes(): void {
    const selectedPaths = this.flatNodeSelectionModel.selected
      .filter(node => !node.isExpandable)
      .filter(node => node.isSelectable)
      .map(node => node.path);
    this.selectedPhotoService.setSelectedPhotosByPaths(selectedPaths);
  }

  //#region --- Context Menu ---
  @ViewChild(MatMenuTrigger) public contextMenu: MatMenuTrigger;
  public contextMenuPosition = { x: '0px', y: '0px' };

  public onContextMenu(event: MouseEvent, node: FlatNode) {
    event.preventDefault();
    this.contextMenuPosition.x = event.clientX + 'px';
    this.contextMenuPosition.y = event.clientY + 'px';
    this.contextMenu.menuData = { 'contextMenuData': ContextMenuHelper.createData(node) };
    this.contextMenu.openMenu();
    ContextMenuHelper.disableFocus(this.focusMonitor);
    ContextMenuHelper.configureClosingWithRightClick(this.contextMenu);
  }

  public openFile(data: ContextMenuData) { ContextMenuHelper.openFile(data); }
  public openContainingFolder(data: ContextMenuData) { ContextMenuHelper.openContainingFolder(data); }
  //#endregion --- Context Menu ---
}
