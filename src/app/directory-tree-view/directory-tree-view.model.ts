class DirectoryTreeViewNode {
  name: string;
  path: string;
  isSelectable: boolean;
}

export class NestedNode extends DirectoryTreeViewNode {
  children: NestedNode[];
}

export class FlatNode extends DirectoryTreeViewNode {
  level: number;
  isExpandable: boolean;
}
