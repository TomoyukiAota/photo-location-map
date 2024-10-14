import { DirectoryTree } from 'directory-tree';
import { Stats } from 'fs';

class DirectoryTreeViewNode {
  name: string;
  path: string;
  type: DirectoryTree['type'];
  fsStats: Stats;
  isSelectable: boolean;
}

export class NestedNode extends DirectoryTreeViewNode {
  children: NestedNode[];
}

export class FlatNode extends DirectoryTreeViewNode {
  level: number;
  isExpandable: boolean;
}
