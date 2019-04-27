/**
 * Nested node of tree view.
 */
export class NestedNode {
  name: string;
  children?: NestedNode[];
}

/** Flat node with expandable and level information */
export class FlatNode {
  name: string;
  level: number;
  expandable: boolean;
}
