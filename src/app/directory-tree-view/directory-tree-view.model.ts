import { Stats } from 'fs';

class DirectoryTreeViewNode {
  name: string;
  path: string;
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
