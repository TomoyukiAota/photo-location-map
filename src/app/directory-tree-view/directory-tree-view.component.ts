import { FocusMonitor } from '@angular/cdk/a11y';
import { SelectionModel } from '@angular/cdk/collections';
import { Component, effect, signal, untracked, viewChild, inject } from '@angular/core';
import { MatMenuTrigger, MatMenu, MatMenuContent, MatMenuItem } from '@angular/material/menu';
import { MatTree, MatTreeNodeDef, MatTreeNode, MatTreeNodeToggle, MatTreeNodePadding } from '@angular/material/tree';
import { Analytics } from '../../../src-shared/analytics/analytics';
import { createPrependedLogger } from '../../../src-shared/log/create-prepended-logger';
import { PhotoInfoViewerComponent } from '../photo-info-viewer/photo-info-viewer.component';
import { TranslatePipe } from '../shared/i18n/translate.pipe';
import { Photo } from '../shared/model/photo.model';
import { PhotoDataService } from '../shared/service/photo-data.service';
import { SelectedPhotoService } from '../shared/service/selected-photo.service';
import { DirTreeViewContextMenuHelper } from './dir-tree-view-context-menu/dir-tree-view-context-menu-helper';
import { dirTreeViewContextMenuItems } from './dir-tree-view-context-menu/dir-tree-view-context-menu-item';
import { DirectoryTreeViewDataService } from './directory-tree-view-data.service';
import { DirectoryTreeViewSelectionService } from './directory-tree-view-selection.service';
import { DirTreeViewSortConfig } from './dir-tree-view-sort/dir-tree-view-sort-config';
import { DirTreeViewSortService } from './dir-tree-view-sort/dir-tree-view-sort.service';
import { NestedNode } from './directory-tree-view.model';
import { MatIconButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';

const dirTreeViewLogger = createPrependedLogger('[Directory Tree View]');

@Component({
  selector: 'app-directory-tree-view',
  templateUrl: 'directory-tree-view.component.html',
  styleUrls: ['directory-tree-view.component.scss'],
  imports: [
    MatTree, MatTreeNodeDef, MatTreeNode, MatTreeNodeToggle, MatTreeNodePadding, MatIconButton, MatCheckbox,
    MatLabel, PhotoInfoViewerComponent, MatIcon, MatMenuTrigger, MatMenu, MatMenuContent, MatMenuItem,
    TranslatePipe,
  ]
})
export class DirectoryTreeViewComponent {
  private sortService = inject(DirTreeViewSortService);
  private selectedPhotoService = inject(SelectedPhotoService);
  private photoDataService = inject(PhotoDataService);
  private focusMonitor = inject(FocusMonitor);

  // padding-left for each tree view node is `level * indentPerLevel` pixels where level is depth of the tree view node.
  public readonly indentPerLevel = 30;

  // The tree's root nodes: the opened folder, or none before a folder is opened. The tree shows a node when every
  // folder above it is expanded, and renders the nodes again when this array is replaced, which a sort does, as
  // sorting reorders the children in place.
  public readonly treeData = signal<NestedNode[]>([]);
  // The tree goes through the nodes that this returns, all the way down, whenever its data or what is expanded
  // changes. It returns the children of an expanded node only, which are the only ones that the tree shows, so that a
  // large folder costs no more than what is shown of it.
  public readonly childrenAccessor = (node: NestedNode): NestedNode[] => this.tree().isExpanded(node) ? node.children : [];
  public readonly hasChildren = (_: number, node: NestedNode) => this.isExpandable(node);
  private readonly tree = viewChild.required<MatTree<NestedNode>>('tree');
  private readonly nodeSelectionModel = new SelectionModel<NestedNode>(true /* multiple */);
  // Bumped after each change of nodeSelectionModel. isSelected() reads it, so the checkboxes, which read the selection
  // through isSelected(), render a change made outside a template event too, such as a selection that the map, the
  // chart or the Selection menu requests.
  private readonly selectionVersion = signal(0);
  // The parent of every node of the tree, shown or not, and null for the root. Its keys are all the nodes.
  private readonly parentNodes = new Map<NestedNode, NestedNode | null>();

  constructor() {
    const directoryTreeViewDataService = inject(DirectoryTreeViewDataService);
    const directoryTreeViewSelectionService = inject(DirectoryTreeViewSelectionService);

    directoryTreeViewDataService.dataReplaced
      .subscribe(data => this.handleDirectoryTreeViewDataReplaced(data));

    // Sort the tree again when the sort settings change. Sorting reads photo data, which must not become a dependency.
    effect(() => {
      const sortConfig = this.sortService.sortConfig();
      untracked(() => this.sortData(sortConfig));
    });

    directoryTreeViewSelectionService.selectionRequested
      .subscribe(photoPaths => this.handleDirectoryTreeViewSelectionRequested(photoPaths));
  }

  /** The photo of a file's node, whose information the node's row shows; null for a file that is not a photo. */
  public photoOf(node: NestedNode): Photo | null {
    return this.photoDataService.getPhoto(node.path);
  }

  /** Whether the node is a folder with something in it, which the tree can expand. */
  public isExpandable(node: NestedNode): boolean {
    return node.children.length > 0;
  }

  /** Whether the node is the tree's root, the opened folder. */
  public isOpenedFolder(node: NestedNode): boolean {
    return this.parentNodes.get(node) === null;
  }

  /**
   * Shows the tree of a newly opened folder: sorted by the current sort settings, with its root expanded, and with every
   * photo selected when any has location data (otherwise with none, so that the map shows no photos). This runs
   * synchronously while the folder opens, which --open with a photo relies on: it selects the photo right after.
   */
  private handleDirectoryTreeViewDataReplaced(data: NestedNode[]) {
    this.collapsePreviousFolder();
    this.nodeSelectionModel.clear();
    this.parentNodes.clear();
    this.addParentNodes(data, null);
    this.treeData.set(data);
    if (data.length === 0)
      return;

    const rootNode = data[0];

    const sortConfig = this.sortService.sortConfig();
    this.sortData(sortConfig);

    if (rootNode.isSelectable) {
      // When the root node is selectable (i.e. some photos with location data exist in the opened folder),
      // select the root node in order to select all photos as the map's state after loading the folder.
      this.toggleNodeSelection(rootNode);
    } else {
      // When the root node is not selectable (i.e. no photos with location data exist in the opened folder),
      // update SelectedPhotoService.selectedPhotos with an empty array so that the map will be displayed without photos.
      this.selectedPhotoService.setSelectedPhotos([]);
    }

    if (this.isExpandable(rootNode)) {
      this.tree().expand(rootNode);
    }
  }

  // The tree keeps the nodes that it has expanded, each holding what is below it. Collapsing those of the previous
  // folder leaves it none of that folder to hold in memory. The root goes first, as the nodes are in the order that
  // the tree shows them, so that the tree has only the root to show again after each of the others.
  private collapsePreviousFolder() {
    const tree = this.tree();
    for (const node of this.parentNodes.keys()) {
      if (tree.isExpanded(node))
        tree.collapse(node);
    }
  }

  private addParentNodes(nodes: NestedNode[], parent: NestedNode | null) {
    for (const node of nodes) {
      this.parentNodes.set(node, parent);
      this.addParentNodes(node.children, node);
    }
  }

  private sortData(sortConfig: DirTreeViewSortConfig) {
    const sortedData = this.sortService.sortData(this.treeData(), sortConfig);
    this.treeData.set([...sortedData]); // A new array, as sortData() sorts the children of the same nodes in place.
  }

  private handleDirectoryTreeViewSelectionRequested(photoPaths: string[]) {
    const requestedPaths = new Set(photoPaths);
    const selectionRequestedNodes = Array.from(this.parentNodes.keys()).filter(node => requestedPaths.has(node.path));
    this.selectRequestedNodesAndDeselectOthers(selectionRequestedNodes);
  }

  // See also DirectoryTreeViewComponent::toggleNodeSelection function because similar steps are performed.
  private selectRequestedNodesAndDeselectOthers(selectionRequestedNodes: NestedNode[]): void {
    this.nodeSelectionModel.clear();

    const selectableNodes = selectionRequestedNodes.filter(node => node.isSelectable);
    if (selectableNodes.length >= 1) {
      this.selectNodes(selectableNodes);
      selectableNodes.filter(node => this.isExpandable(node)).forEach(node => this.selectAllDescendants(node));
      selectableNodes.forEach(node => this.updateAllParents(node));
    }

    this.notifySelectionChanged();
    this.updateSelectedPhotosToReflectSelectedNodes();
  }

  private selectAllDescendants(parent: NestedNode): void {
    const descendants = this.getSelectableDescendants(parent);
    this.selectNodes(descendants);
  }

  // SelectionModel's select() and deselect() take the nodes as arguments, which one call cannot take as many of as a
  // large folder has: past about 150,000, the engine throws a RangeError. One node at a time instead.
  private selectNodes(nodes: NestedNode[]): void {
    for (const node of nodes)
      this.nodeSelectionModel.select(node);
  }

  private deselectNodes(nodes: NestedNode[]): void {
    for (const node of nodes)
      this.nodeSelectionModel.deselect(node);
  }

  public isSelected(node: NestedNode): boolean {
    this.selectionVersion(); // A dependency of the template's checkboxes.
    return this.nodeSelectionModel.isSelected(node);
  }

  private notifySelectionChanged(): void {
    this.selectionVersion.update(version => version + 1);
  }

  public allDescendantsSelected(node: NestedNode): boolean {
    const descendants = this.getSelectableDescendants(node);
    const allDescendantsSelected = descendants
      .every(child => this.isSelected(child));
    return allDescendantsSelected;
  }

  public partOfDescendantsSelected(node: NestedNode): boolean {
    const descendants = this.getSelectableDescendants(node);
    const moreThanOneDescendantsSelected = descendants
      .some(child => this.isSelected(child));
    return moreThanOneDescendantsSelected && !this.allDescendantsSelected(node);
  }

  private getSelectableDescendants(parent: NestedNode): NestedNode[] {
    return this.getDescendants(parent)
      .filter(child => child.isSelectable);
  }

  /** The nodes below the given one, each folder followed by what is in it, in the order that the tree shows them. */
  private getDescendants(parent: NestedNode): NestedNode[] {
    return parent.children.flatMap(child => [child, ...this.getDescendants(child)]);
  }

  public handleCheckboxChange(node: NestedNode): void {
    const folderOrFile = this.isExpandable(node) ? 'Folder' : 'File';
    dirTreeViewLogger.info(`Toggled Checkbox (${folderOrFile}): ${node.path}`);
    Analytics.trackEvent('Directory Tree View', `[Tree View] Toggle Checkbox`, `Toggle Checkbox for ${folderOrFile}`);
    this.toggleNodeSelection(node);
  }

  // See also DirectoryTreeViewComponent::selectRequestedNodesAndDeselectOthers function because similar steps are performed.
  private toggleNodeSelection(node: NestedNode): void {
    if (!node.isSelectable) return;

    this.nodeSelectionModel.toggle(node);

    if (this.isExpandable(node)) {
      this.toggleAllDescendants(node);
    }
    this.updateAllParents(node);

    this.notifySelectionChanged();
    this.updateSelectedPhotosToReflectSelectedNodes();
  }

  private toggleAllDescendants(parent: NestedNode) {
    const descendants = this.getSelectableDescendants(parent);
    if (this.isSelected(parent)) {
      this.selectNodes(descendants);
    } else {
      this.deselectNodes(descendants);
    }
  }

  private updateAllParents(node: NestedNode): void {
    let parent: NestedNode | null = this.getParentNode(node);
    while (parent) {
      this.updateSelectionAccordingToDescendants(parent);
      parent = this.getParentNode(parent);
    }
  }

  private updateSelectionAccordingToDescendants(node: NestedNode): void {
    const isSelected = this.isSelected(node);
    const allDescendantsSelected = this.allDescendantsSelected(node);
    if (isSelected && !allDescendantsSelected) {
      this.nodeSelectionModel.deselect(node);
    } else if (!isSelected && allDescendantsSelected) {
      this.nodeSelectionModel.select(node);
    }
  }

  private getParentNode(node: NestedNode): NestedNode | null {
    return this.parentNodes.get(node) ?? null;
  }

  private updateSelectedPhotosToReflectSelectedNodes(): void {
    const selectedPaths = this.nodeSelectionModel.selected
      .filter(node => !this.isExpandable(node))
      .filter(node => node.isSelectable)
      .map(node => node.path);
    const selectedPhotos = selectedPaths.map(path => this.photoDataService.getPhoto(path));
    this.selectedPhotoService.setSelectedPhotos(selectedPhotos);
  }

  //#region --- Context Menu ---
  public readonly contextMenu = viewChild.required(MatMenuTrigger);
  public contextMenuPosition = { x: '0px', y: '0px' };
  public contextMenuHelper = DirTreeViewContextMenuHelper;
  public contextMenuItems = dirTreeViewContextMenuItems;

  public onContextMenu(event: MouseEvent, node: NestedNode) {
    event.preventDefault();
    const contextMenu = this.contextMenu();
    this.contextMenuHelper.configureStyleForContextMenuTarget(event, contextMenu);
    this.contextMenuPosition.x = event.clientX + 'px';
    this.contextMenuPosition.y = event.clientY + 'px';
    contextMenu.menuData = { 'contextMenuData': this.contextMenuHelper.createData(node) };
    contextMenu.openMenu();
    this.contextMenuHelper.disableFocus(this.focusMonitor);
    this.contextMenuHelper.configureClosingWithRightClick(contextMenu);
  }
  //#endregion --- Context Menu ---
}
