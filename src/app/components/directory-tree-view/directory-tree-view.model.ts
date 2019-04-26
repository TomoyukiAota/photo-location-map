/**
 * Nested node of tree view.
 */
export class NestedNode {
  children: NestedNode[];
  item: string;
}

/** Flat node with expandable and level information */
export class FlatNode {
  item: string;
  level: number;
  expandable: boolean;
}
