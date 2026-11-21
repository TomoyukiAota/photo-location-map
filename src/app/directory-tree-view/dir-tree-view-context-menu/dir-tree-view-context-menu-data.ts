import { NestedNode } from '../directory-tree-view.model';

export interface DirTreeViewContextMenuData {
  node: NestedNode;
  /** Scroll to Here, for the menu of a row kept at the top of the tree (DirTreeViewStickyRowsComponent), and no other. */
  scrollToHere?: () => void;
}
