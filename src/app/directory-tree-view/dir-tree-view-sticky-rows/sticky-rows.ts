import type { StickyFolderRowsLeftOut } from '../../../../src-shared/user-settings/sticky-folder-rows';
import { NestedNode } from '../directory-tree-view.model';

/**
 * How high a row kept at the top of the tree is: lower than a folder's row of the tree, 48 pixels, so that more of
 * them leave room for the photos, as the owner chose. Its texts and the checkbox keep their size.
 */
export const stickyRowHeight = 32;

/**
 * What the choice of the rows kept at the top reads of the tree as it is laid out, in pixels from the top of what the
 * box that scrolls the tree shows.
 */
export interface StickyRowsLayout {
  /** The node of the row at `offset` pixels below the box's top, or undefined where there is none. */
  nodeAt(offset: number): NestedNode | undefined;
  /** The folder that a node is in, or null for the opened folder. */
  parentOf(node: NestedNode): NestedNode | null;
  /** Whether the node is a folder that is expanded, with something in it. */
  isOpenFolder(node: NestedNode): boolean;
  /** The top of the node's row, or undefined when the tree does not show it. */
  rowTopOf(node: NestedNode): number | undefined;
  /** Where the folder's contents end: the top of the row after them, or Infinity when nothing comes after them. */
  endOf(folder: NestedNode): number;
}

/** A folder that the first rows shown are in, and where its contents end. */
export interface StickyFolder {
  readonly node: NestedNode;
  readonly end: number;
}

/** A row kept at the top: a folder's, or the one that stands for the folders left out. */
export interface StickyRow {
  /** The folder; for the row of the folders left out, the first of them, whose depth the row is indented by. */
  readonly node: NestedNode;
  /** The folders that the row stands for, which only the row of the folders left out has. */
  readonly leftOut?: readonly NestedNode[];
  /** Where the row is from the box's top: in its slot, or above it, pushed up by the row after its folder's contents. */
  readonly top: number;
}

/**
 * How many rows the tree keeps at its top: the setting's most, and fewer in a box of little height, at most a third
 * of it, with the height of a photo's row left below them; never fewer than 3, the opened folder, the row of the
 * folders left out and the folder of the rows shown, which are always kept.
 * TL;DR: Seven rows of 48 pixels left a window 500 pixels high 161 pixels for its photos, less than one photo's row of
 * 237 (docs/tasks/20261121_tree-sticky-folder-rows/STATUS.md).
 */
export function allowedStickyRows({ maximum, boxHeight, photoRowHeight, rowHeight = stickyRowHeight }: {
  maximum: number; boxHeight: number; photoRowHeight: number; rowHeight?: number;
}): number {
  const third = Math.floor(boxHeight / 3 / rowHeight);
  const leavingAPhotoRow = Math.floor((boxHeight - photoRowHeight) / rowHeight);
  return Math.max(3, Math.min(maximum, third, leavingAPhotoRow));
}

/**
 * The folders that the rows at the top of the box are in, from the opened folder down: those whose rows are kept at
 * the top, the folders left out among them.
 * TL;DR: Level by level, as VS Code's trees find theirs: the folder at the next level that the first row below the
 * rows found so far is in, unless that row is the folder's own, in its place.
 * Details: Below the rows kept at the top, which are at most `allowed`, the deepest folder's the last of them. A first
 * attempt took the folders of the row below all of them, and went back and forth between two answers where a folder's
 * contents end: the rows of one hid the row that gave the other.
 */
export function stickyFoldersOf(layout: StickyRowsLayout, allowed: number, rowHeight = stickyRowHeight): StickyFolder[] {
  const folders: StickyFolder[] = [];
  let first = allowed > 0 ? layout.nodeAt(1) : undefined;
  while (first) {
    const folder = folderUnder(layout, first, folders.at(-1)?.node ?? null);
    if (!folder)
      break;
    const slot = Math.min(folders.length, allowed - 1);
    if (folder === first) {
      // The row is the folder's own: kept at the top once it has gone above its slot, so that the folder's first row
      // comes out below the rows kept at the top.
      if (!layout.isOpenFolder(folder))
        break;
      const top = layout.rowTopOf(folder);
      if (top === undefined || top >= slot * rowHeight - 0.5)
        break;
    }
    const end = layout.endOf(folder);
    folders.push({ node: folder, end });
    first = layout.nodeAt(Math.min(slot * rowHeight, end - rowHeight) + rowHeight + 1);
  }
  return folders;
}

/** `node`, or the folder above it, whose folder is `parent`, or that is the opened folder for null. */
function folderUnder(layout: StickyRowsLayout, node: NestedNode, parent: NestedNode | null): NestedNode | undefined {
  for (let current: NestedNode | null = node; current; current = layout.parentOf(current)) {
    if (layout.parentOf(current) === parent)
      return current;
  }
  return undefined;
}

/**
 * The rows kept at the top for the folders: one for each when they are at most `allowed`; otherwise, `allowed` − 1
 * of them, and a row that stands for the others, which `leftOut` chooses:
 * - 'middle': those in the middle. As many folders are kept from the opened folder's side as from the photos' side,
 *   or one more from the photos' side: at most 7 rows give the opened folder, the two below it, the row of the folders
 *   left out, and the three above the rows shown.
 * - 'nearOpenedFolder': those near the opened folder, which is kept.
 * - 'nearPhotos': those near the photos, whose folder is kept.
 * Each row is in its slot, or higher, pushed up by the row after its folder's contents: the row of the folders left
 * out by the row after the contents of the last of them, inside which the rows below it are.
 */
export function stickyRowsOf(folders: readonly StickyFolder[], allowed: number, leftOut: StickyFolderRowsLeftOut,
                             rowHeight = stickyRowHeight): StickyRow[] {
  let entries: (StickyFolder & { leftOut?: readonly NestedNode[] })[] = [...folders];
  if (folders.length > allowed) {
    const kept = allowed - 1;
    const head = leftOut === 'middle' ? Math.floor(kept / 2) : leftOut === 'nearOpenedFolder' ? 1 : kept - 1;
    const tail = kept - head;
    const omitted = folders.slice(head, folders.length - tail);
    entries = [
      ...folders.slice(0, head),
      { node: omitted[0].node, end: omitted[omitted.length - 1].end, leftOut: omitted.map(folder => folder.node) },
      ...folders.slice(folders.length - tail),
    ];
  }
  return entries.map(({ node, end, leftOut: leftOutFolders }, index) => ({
    node,
    ...(leftOutFolders ? { leftOut: leftOutFolders } : {}),
    top: Math.min(index * rowHeight, end - rowHeight),
  }));
}
