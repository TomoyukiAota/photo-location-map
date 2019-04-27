/**
 * Nested node of tree view.
 */
export class NestedNode {
  name: string;
  isSelectable: boolean;
  children?: NestedNode[];
}

/** Flat node with expandable and level information */
export class FlatNode {
  name: string;
  isSelectable: boolean;
  level: number;
  expandable: boolean;
}
