import { Service, signal, Signal, WritableSignal } from '@angular/core';
import { NestedNode } from './directory-tree-view.model';

/** How much of a node of the folder tree is selected, which its checkbox shows: a folder can be partly selected. */
export type NodeSelectionState = 'selected' | 'partlySelected' | 'notSelected';

/** How many photos that can be selected a folder has, all the way down, and how many of them are selected. */
interface PhotoCounts {
  readonly selectable: number;
  selected: number;
}

/** The state of a node that is not in the tree, as a row of the previous folder's tree may read for a moment. */
const stateOfNodeNotInTree: Signal<NodeSelectionState> = signal<NodeSelectionState>('notSelected').asReadonly();

/**
 * The selection of the folder tree: the photos that are selected, and from them, how much of each folder is.
 * TL;DR: Each row reads its own node's state, a signal that is set only when that node's state changes, so that a
 * change of the selection has Angular check only the rows whose checkboxes it changes.
 * Details:
 * - The photos are those that can be selected, which have location data. A folder is selected when all of its photos
 *   that can be selected are, all the way down, and partly selected when some are. It counts them, and how many of
 *   them are selected, so that a change of a photo changes the state of the folders above it only.
 * - A row reads its node's state in its own component's template (DirTreeViewCheckboxAndNameComponent and
 *   DirTreeViewFolderCheckboxAndNameComponent), which Angular gives a reactive consumer of its own. Read in the
 *   tree's template, a signal of the selection had Angular check the tree, and every row with it, whenever the
 *   selection changed (NearViewDirective's comment). A node's signal is made when its row first reads it.
 * - The signals are set once an operation is done, each to its node's state then, so that a photo deselected and
 *   selected again by the same operation, as selectOnly() does with a photo that stays selected, tells its row
 *   nothing.
 */
@Service({ autoProvided: false })
export class DirTreeViewNodeSelection {
  /** The photos that are selected, in the order that they were selected, which the selected photos keep. */
  private readonly selectedPhotoNodes = new Set<NestedNode>();
  /** The folder that each node of the tree is in, and null for the opened folder. */
  private readonly parents = new Map<NestedNode, NestedNode | null>();
  /** The counts of each folder. A node without children has none: it is a file, or an empty folder. */
  private readonly photoCounts = new Map<NestedNode, PhotoCounts>();
  /** The state of each node whose row has read it. */
  private readonly states = new Map<NestedNode, WritableSignal<NodeSelectionState>>();
  /** The nodes whose state the operation that runs may have changed, which their rows are told of once it is done. */
  private readonly changedNodes = new Set<NestedNode>();

  /** Takes the tree of a newly opened folder, with nothing selected. */
  public replace(roots: readonly NestedNode[]): void {
    this.selectedPhotoNodes.clear();
    this.parents.clear();
    this.photoCounts.clear();
    this.states.clear();
    this.changedNodes.clear();
    for (const root of roots)
      this.addNode(root, null);
  }

  /** The node's state, for its row to read: a signal that changes only when the node's state does. */
  public stateOf(node: NestedNode): Signal<NodeSelectionState> {
    if (!this.states.has(node)) {
      if (!this.parents.has(node))
        return stateOfNodeNotInTree;
      this.states.set(node, signal(this.currentStateOf(node)));
    }
    return this.states.get(node);
  }

  /** Whether the node is selected: a photo, or a folder all of whose photos that can be selected are. */
  public isSelected(node: NestedNode): boolean {
    return this.currentStateOf(node) === 'selected';
  }

  /** The photos that are selected, in the order that they were selected. */
  public selectedPhotos(): NestedNode[] {
    return [...this.selectedPhotoNodes];
  }

  /**
   * As a click on the node's checkbox: selects a photo that is not selected, and deselects one that is; selects all of
   * a folder's photos that can be selected, or deselects them when they all are.
   */
  public toggle(node: NestedNode): void {
    if (!node.isSelectable)
      return;
    const select = !this.isSelected(node);
    for (const photo of this.selectablePhotosOf(node))
      this.setPhoto(photo, select);
    this.tellRows();
  }

  /**
   * Selects only these nodes, a folder with all of its photos that can be selected. The photos are selected in the
   * order of the nodes, those of the folders after the photos among the nodes.
   */
  public selectOnly(nodes: readonly NestedNode[]): void {
    for (const photo of [...this.selectedPhotoNodes])
      this.setPhoto(photo, false);
    const selectable = nodes.filter(node => node.isSelectable);
    for (const node of selectable.filter(each => !this.photoCounts.has(each)))
      this.setPhoto(node, true);
    for (const folder of selectable.filter(each => this.photoCounts.has(each))) {
      for (const photo of this.selectablePhotosOf(folder))
        this.setPhoto(photo, true);
    }
    this.tellRows();
  }

  /** Adds a node and what is in it, and returns how many photos that can be selected it has, itself included. */
  private addNode(node: NestedNode, parent: NestedNode | null): number {
    this.parents.set(node, parent);
    if (node.children.length === 0)
      return node.isSelectable ? 1 : 0;
    let selectable = 0;
    for (const child of node.children)
      selectable += this.addNode(child, node);
    this.photoCounts.set(node, { selectable, selected: 0 });
    return selectable;
  }

  private currentStateOf(node: NestedNode): NodeSelectionState {
    const counts = this.photoCounts.get(node);
    if (counts === undefined)
      return this.selectedPhotoNodes.has(node) ? 'selected' : 'notSelected';
    if (counts.selected === 0)
      return 'notSelected';
    return counts.selected === counts.selectable ? 'selected' : 'partlySelected';
  }

  /** The photos that can be selected in the node, all the way down, in the order that the tree shows them. */
  private selectablePhotosOf(node: NestedNode, photos: NestedNode[] = []): NestedNode[] {
    if (node.children.length === 0) {
      if (node.isSelectable)
        photos.push(node);
      return photos;
    }
    for (const child of node.children)
      this.selectablePhotosOf(child, photos);
    return photos;
  }

  private setPhoto(photo: NestedNode, select: boolean): void {
    if (this.selectedPhotoNodes.has(photo) === select)
      return;
    if (select)
      this.selectedPhotoNodes.add(photo);
    else
      this.selectedPhotoNodes.delete(photo);
    this.changedNodes.add(photo);
    for (let folder = this.parents.get(photo); folder; folder = this.parents.get(folder)) {
      this.photoCounts.get(folder).selected += select ? 1 : -1;
      this.changedNodes.add(folder);
    }
  }

  /** Sets the signal of each node that the operation changed, which tells its row only when its state is another. */
  private tellRows(): void {
    for (const node of this.changedNodes)
      this.states.get(node)?.set(this.currentStateOf(node));
    this.changedNodes.clear();
  }
}
