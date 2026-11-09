import type { DirectoryTree } from 'directory-tree';

class DirectoryTreeViewNode {
  name: string;
  path: string;
  type: DirectoryTree['type'];
  /** What the main process read of the file or folder (src-main/directory-tree/folder-tree.ts). */
  fsStats: { mtime: Date };
  isSelectable: boolean;
}

export class NestedNode extends DirectoryTreeViewNode {
  children: NestedNode[];
}
