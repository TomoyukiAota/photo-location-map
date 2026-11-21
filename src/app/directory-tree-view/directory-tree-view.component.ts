import { FocusMonitor, TREE_KEY_MANAGER } from '@angular/cdk/a11y';
import { Component, DestroyRef, effect, ElementRef, Injector, signal, untracked, viewChild, viewChildren, inject } from '@angular/core';
import { MatMenuTrigger, MatMenu, MatMenuContent, MatMenuItem } from '@angular/material/menu';
import { MatTree, MatTreeNodeDef, MatTreeNodeToggle, MatTreeNodePadding } from '@angular/material/tree';
import { Analytics } from '../../../src-shared/analytics/analytics';
import { createPrependedLogger } from '../../../src-shared/log/create-prepended-logger';
import { logged } from '../../../src-shared/log/logged-line';
import { PhotoInfoViewerComponent } from '../photo-info-viewer/photo-info-viewer.component';
import { EasedScroll } from '../shared/eased-scroll/eased-scroll';
import { NearViewDirective } from '../shared/near-view/near-view.directive';
import { TranslatePipe } from '../shared/i18n/translate.pipe';
import { Photo } from '../shared/model/photo.model';
import { PhotoDataService } from '../shared/service/photo-data.service';
import { PhotoRevealService, SidebarRevealRequest } from '../shared/service/photo-reveal.service';
import { SelectedPhotoService } from '../shared/service/selected-photo.service';
import { DirTreeViewCheckboxAndNameComponent } from './dir-tree-view-checkbox-and-name/dir-tree-view-checkbox-and-name.component';
import { DirTreeViewContextMenuHelper } from './dir-tree-view-context-menu/dir-tree-view-context-menu-helper';
import { dirTreeViewContextMenuItems } from './dir-tree-view-context-menu/dir-tree-view-context-menu-item';
import { DirTreeViewFolderCheckboxAndNameComponent } from './dir-tree-view-folder-checkbox-and-name/dir-tree-view-folder-checkbox-and-name.component';
import { dirTreeViewKeyManagerFactory } from './dir-tree-view-key-manager';
import { DirTreeViewNodeSelection } from './dir-tree-view-node-selection';
import { RevealHighlights } from './dir-tree-view-reveal-highlight';
import { DirTreeViewNodePositions, DirTreeViewTreeNodeDirective } from './dir-tree-view-tree-node.directive';
import { DirectoryTreeViewDataService } from './directory-tree-view-data.service';
import { DirectoryTreeViewSelectionService } from './directory-tree-view-selection.service';
import { DirTreeViewSortConfig } from './dir-tree-view-sort/dir-tree-view-sort-config';
import { DirTreeViewSortService } from './dir-tree-view-sort/dir-tree-view-sort.service';
import { DirTreeViewStickyRowsComponent, StickyRowsHost } from './dir-tree-view-sticky-rows/dir-tree-view-sticky-rows.component';
import { DirTreeViewStickyRowsService } from './dir-tree-view-sticky-rows/dir-tree-view-sticky-rows.service';
import { NestedNode } from './directory-tree-view.model';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

const dirTreeViewLogger = createPrependedLogger('[Directory Tree View]');

@Component({
  selector: 'app-directory-tree-view',
  templateUrl: 'directory-tree-view.component.html',
  styleUrls: ['directory-tree-view.component.scss'],
  // DirTreeViewTreeNodeDirective is the rows' tree node, in place of MatTreeNode, which is not imported (see its comment).
  imports: [
    MatTree, MatTreeNodeDef, DirTreeViewTreeNodeDirective, MatTreeNodeToggle, MatTreeNodePadding, MatIconButton,
    PhotoInfoViewerComponent, MatIcon, MatMenuTrigger, MatMenu, MatMenuContent, MatMenuItem,
    TranslatePipe, NearViewDirective, DirTreeViewCheckboxAndNameComponent, DirTreeViewFolderCheckboxAndNameComponent,
    DirTreeViewStickyRowsComponent,
  ],
  providers: [
    // The tree's keys leave Select Previous and Select Next to the Selection menu.
    { provide: TREE_KEY_MANAGER, useValue: dirTreeViewKeyManagerFactory },
    // The selection, which the rows' components read their nodes' states from.
    DirTreeViewNodeSelection,
    // Where each node is among its siblings, which the rows' tree nodes read for aria-posinset.
    DirTreeViewNodePositions,
  ],
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
  private readonly treeElement = viewChild.required('tree', { read: ElementRef<HTMLElement> });
  private readonly selection = inject(DirTreeViewNodeSelection);
  private readonly positions = inject(DirTreeViewNodePositions);
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
    directoryTreeViewSelectionService.additionRequested
      .subscribe(photoPath => this.handleDirectoryTreeViewAdditionRequested(photoPath));

    inject(PhotoRevealService).revealInSidebarRequested
      .subscribe(request => this.reveal(request));
    inject(DestroyRef).onDestroy(() => {
      this.easedScroll.stop();
      this.revealHighlights.clear();
    });
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
    this.selection.replace(data);
    this.positions.replace(data);
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
    this.positions.replace(sortedData);
    this.treeData.set([...sortedData]); // A new array, as sortData() sorts the children of the same nodes in place.
  }

  private handleDirectoryTreeViewSelectionRequested(photoPaths: string[]) {
    const requestedPaths = new Set(photoPaths);
    const selectionRequestedNodes = Array.from(this.parentNodes.keys()).filter(node => requestedPaths.has(node.path));
    this.selection.selectOnly(selectionRequestedNodes);
    this.updateSelectedPhotosToReflectSelectedNodes();
  }

  /**
   * Selects one more photo, as a click on its checkbox does, rather than through a request to select every photo that
   * is selected and it.
   */
  private handleDirectoryTreeViewAdditionRequested(photoPath: string) {
    const node = this.nodeOf(photoPath);
    if (node && !this.selection.isSelected(node))
      this.toggleNodeSelection(node);
  }

  /** The node of a file or a folder of the tree, shown or not. */
  private nodeOf(path: string): NestedNode | undefined {
    for (const node of this.parentNodes.keys()) {
      if (node.path === path)
        return node;
    }
    return undefined;
  }

  public handleCheckboxChange(node: NestedNode): void {
    const folderOrFile = this.isExpandable(node) ? 'Folder' : 'File';
    dirTreeViewLogger.info(`Toggled Checkbox (${folderOrFile}): ${node.path}`);
    Analytics.trackEvent('Directory Tree View', `[Tree View] Toggle Checkbox`, `Toggle Checkbox for ${folderOrFile}`);
    this.toggleNodeSelection(node);
  }

  private toggleNodeSelection(node: NestedNode): void {
    if (!node.isSelectable) return;
    this.selection.toggle(node);
    this.updateSelectedPhotosToReflectSelectedNodes();
  }

  private getParentNode(node: NestedNode): NestedNode | null {
    return this.parentNodes.get(node) ?? null;
  }

  private updateSelectedPhotosToReflectSelectedNodes(): void {
    const selectedPhotos = this.selection.selectedPhotos().map(node => this.photoDataService.getPhoto(node.path));
    this.selectedPhotoService.setSelectedPhotos(selectedPhotos);
  }

  //#region --- Context Menu ---
  public readonly contextMenu = viewChild.required(MatMenuTrigger);
  public contextMenuPosition = { x: '0px', y: '0px' };
  public contextMenuHelper = DirTreeViewContextMenuHelper;
  public contextMenuItems = dirTreeViewContextMenuItems;
  /** The services that the items of the context menu use. */
  protected readonly injector = inject(Injector);

  /** Opens the menu of a row; that of a row kept at the top of the tree has Scroll to Here, which `scrollToHere` does. */
  public onContextMenu(event: MouseEvent, node: NestedNode, scrollToHere?: () => void) {
    event.preventDefault();
    const contextMenu = this.contextMenu();
    this.contextMenuHelper.configureStyleForContextMenuTarget(event, contextMenu);
    this.contextMenuPosition.x = event.clientX + 'px';
    this.contextMenuPosition.y = event.clientY + 'px';
    contextMenu.menuData = { 'contextMenuData': this.contextMenuHelper.createData(node, scrollToHere) };
    contextMenu.openMenu();
    this.contextMenuHelper.disableFocus(this.focusMonitor);
    this.contextMenuHelper.configureClosingWithRightClick(contextMenu);
  }
  //#endregion --- Context Menu ---

  //#region --- Reveal ---
  /** The rows that the tree shows, each with its node as its data. */
  private readonly treeNodes = viewChildren(DirTreeViewTreeNodeDirective);
  /** The rows kept at the top of the tree, which cover the top of the sidebar's pane. */
  private readonly stickyRows = inject(DirTreeViewStickyRowsService);
  /** The sidebar's scroll to a revealed row, below the rows that the tree will keep at its top where it stops. */
  private readonly easedScroll = new EasedScroll(scrollTop => this.stickyRows.coveredHeightAt(scrollTop));
  private readonly revealHighlights = new RevealHighlights();

  /**
   * Shows the row of a node, as a link to a message of a chat application shows the message: the folders above it are
   * expanded, the sidebar scrolls to have the row in its middle, speeding up gradually and slowing down gradually, and
   * the row lights up for a moment once the sidebar has stopped there. The selection does not change. For a step of
   * Select Previous or Select Next, the sidebar stays where it is when it shows all of the row. A row lit by an earlier
   * reveal fades back.
   * TL;DR: The rows of an expanded folder are in the page as soon as it is expanded, so the scroll to the row starts at
   * once.
   * Details: The tree renders its nodes again whenever a folder is expanded, synchronously, as its data is an array
   * and its children come from childrenAccessor. A row stays in the page while its folder is expanded, so it is
   * scrolled to by its element, whatever its content is.
   */
  private reveal({ photo, scroll }: SidebarRevealRequest): void {
    const node = this.nodeOf(photo.path);
    if (!node) {
      dirTreeViewLogger.warn(logged`Cannot reveal "${photo.path}", which is not in the tree.`);
      return;
    }
    dirTreeViewLogger.info(`Reveal "${photo.path}"`);
    const tree = this.tree();
    for (const folder of this.foldersAbove(node)) {
      if (!tree.isExpanded(folder))
        tree.expand(folder);
    }
    const row = this.treeNodes().find(treeNode => treeNode.data === node)?._elementRef.nativeElement;
    if (!row) {
      dirTreeViewLogger.warn(logged`Cannot reveal "${photo.path}", whose row is not shown.`);
      return;
    }
    this.revealHighlights.fadeLitRows();
    // Within the sidebar, which is the only part of the window that scrolls. A row revealed before the last one has
    // been scrolled to is scrolled to from where the sidebar is, at the speed that it has (EasedScroll).
    this.easedScroll.toMiddle(row, () => this.revealHighlights.light(row), { evenWhenShown: scroll === 'always' });
  }

  /** The folders above a node, from the opened folder down. */
  private foldersAbove(node: NestedNode): NestedNode[] {
    const folders: NestedNode[] = [];
    for (let parent = this.getParentNode(node); parent; parent = this.getParentNode(parent))
      folders.unshift(parent);
    return folders;
  }
  //#endregion --- Reveal ---

  //#region --- Rows kept at the top ---
  // The rows by their nodes and the nodes by their rows, made again on the first lookup after the tree's rows have
  // changed, which they do only when a folder is expanded or collapsed, or the tree is sorted or replaced. They are
  // forgotten at each change, so that they keep no row that has left the page, as the rows of a collapsed folder.
  private rowsByNode = new Map<NestedNode, HTMLElement>();
  private nodesByRow = new WeakMap<Element, NestedNode>();
  private readonly forgetRowsOnChange = effect(() => {
    this.treeNodes();
    untracked(() => {
      this.rowsByNode = new Map();
      this.nodesByRow = new WeakMap();
    });
  });

  private findRows(): void {
    this.rowsByNode = new Map();
    this.nodesByRow = new WeakMap();
    for (const treeNode of this.treeNodes()) {
      const row: HTMLElement = treeNode._elementRef.nativeElement;
      this.rowsByNode.set(treeNode.data, row);
      this.nodesByRow.set(row, treeNode.data);
    }
  }

  /** What the rows kept at the top of the tree ask of it (DirTreeViewStickyRowsComponent). */
  public readonly stickyRowsHost: StickyRowsHost = {
    indentPerLevel: this.indentPerLevel,
    rowElements: () => this.treeElement().nativeElement.children,
    rowOf: node => {
      let row = this.rowsByNode.get(node);
      if (!row?.isConnected) {
        this.findRows();
        row = this.rowsByNode.get(node);
      }
      return row;
    },
    nodeOfRow: row => {
      let node = this.nodesByRow.get(row);
      if (!node) {
        this.findRows();
        node = this.nodesByRow.get(row);
      }
      return node;
    },
    parentOf: node => this.getParentNode(node),
    roots: () => this.treeData(),
    isOpenFolder: node => this.isExpandable(node) && this.tree().isExpanded(node),
    toggle: node => this.handleCheckboxChange(node),
    collapse: (node, offset) => this.collapseFromStickyRow(node, offset),
    scrollTo: (node, offset) => this.scrollToFolder(node, offset),
    openMenu: (event, node, scrollToHere) => this.onContextMenu(event, node, scrollToHere),
  };

  /** Collapses the folder of a row kept at the top, whose own row then comes there, below the rows above it. */
  private collapseFromStickyRow(node: NestedNode, offset: number): void {
    dirTreeViewLogger.info(`Collapsed "${node.path}" from its row at the top of the tree.`);
    Analytics.trackEvent('Directory Tree View', '[Tree View] [Sticky Row] Collapse');
    this.tree().collapse(node);
    const row = this.stickyRowsHost.rowOf(node);
    if (row)
      this.easedScroll.placeAtTop(row, offset);
  }

  /**
   * Scroll to Here, from the menu of a row kept at the top: scrolls the tree to the folder's own row, which comes right
   * below the rows of the folders above it, and lights it up and focuses it once there, as Reveal does a photo's row.
   */
  private scrollToFolder(node: NestedNode, offset: number): void {
    const row = this.stickyRowsHost.rowOf(node);
    if (!row)
      return;
    dirTreeViewLogger.info(`Scroll to Here: "${node.path}"`);
    Analytics.trackEvent('Directory Tree View', '[Tree View] [Ctx Menu] Scroll to Here');
    this.revealHighlights.fadeLitRows();
    this.easedScroll.toTop(row, offset, () => {
      this.revealHighlights.light(row);
      row.focus({ preventScroll: true });
    });
  }
  //#endregion --- Rows kept at the top ---
}
