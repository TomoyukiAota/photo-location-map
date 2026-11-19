import { CdkTreeNode } from '@angular/cdk/tree';
import { Directive, inject, Service } from '@angular/core';
import { MatTreeNode } from '@angular/material/tree';
import { NestedNode } from './directory-tree-view.model';

/**
 * Where each node of the folder tree is among its siblings, as aria-posinset says it: 1 for the first. The folder tree
 * sets them whenever the order of its nodes changes, which a newly opened folder and a sort do.
 */
@Service({ autoProvided: false })
export class DirTreeViewNodePositions {
  private readonly positions = new Map<NestedNode, number>();

  /** Takes the positions of every node of a tree, from the order of its roots and of each node's children. */
  public replace(roots: readonly NestedNode[]): void {
    this.positions.clear();
    this.add(roots);
  }

  /** The node's position among its siblings, from 1, or undefined for a node that is not in the tree. */
  public positionOf(node: NestedNode): number | undefined {
    return this.positions.get(node);
  }

  private add(siblings: readonly NestedNode[]): void {
    siblings.forEach((node, index) => {
      this.positions.set(node, index + 1);
      this.add(node.children);
    });
  }
}

/**
 * A row of the folder tree: MatTreeNode, which looks its position among its siblings (aria-posinset) up, rather than
 * search its siblings for it.
 *
 * TL;DR: The CDK searches a row's siblings for its position each time that Angular checks the row, and every click and
 * key in the tree has Angular check every row: quadratic in the photos of a folder, 1.6 s with 40,000 photos in one.
 * Remove this when the CDK's tree finds a node's position without searching.
 *
 * Details: CdkTreeNode and MatTreeNode (@angular/cdk and @angular/material 22.2.5) both bind aria-posinset to
 * _getPositionInSet(), which asks CdkTree, whose _getPositionInSet() finds the node in the set of its siblings with
 * findIndex. A listener in the tree marks MatTree's view for refresh, so after an event in the tree, Angular checks
 * every row's node and its bindings (docs/tasks/20261119_checkbox-checks-changed-rows/STATUS.md). A folder of n photos
 * then costs n(n + 1) comparisons at each click or key, about 0.93 ns each on an Apple M5: 0.1 s with 10,000 photos,
 * 24 s with 160,000 and 16 minutes with a million (docs/tasks/20261120_tree-aria-posinset-linear/STATUS.md).
 * Nothing public avoids the search. The bindings are the CDK's own; a binding of aria-posinset of ours would not stop
 * them, and no change of ours keeps Angular from checking every row after an event in the tree. The leading underscore
 * of the node's _getPositionInSet() keeps it out of the CDK's public API, so overriding it departs from the documented
 * setup: the owner chose to, and it is listed in docs/contributing/dependencies.md ("Departures kept for a needed
 * feature").
 * This directive matches mat-tree-node in place of MatTreeNode, which the folder tree does not import: with both,
 * MatTreeNode's bindings would still search. A shown node's set is the children of its parent, expanded, in the order
 * in which DirTreeViewNodePositions counts them, or the roots.
 * On an upgrade of the CDK, check CdkTree's _getPositionInSet() in fesm2022/tree.mjs, and remove this once it does not
 * search. Until then, the tests of the folder tree fail when the CDK's bindings stop calling the node's
 * _getPositionInSet(), or when CdkTree's is called.
 */
@Directive({
  selector: 'mat-tree-node',
  providers: [{ provide: CdkTreeNode, useExisting: DirTreeViewTreeNodeDirective }],
})
export class DirTreeViewTreeNodeDirective extends MatTreeNode<NestedNode> {
  private readonly positions = inject(DirTreeViewNodePositions);

  /** The node's position among its siblings, which the bindings of aria-posinset of CdkTreeNode and MatTreeNode read. */
  public override _getPositionInSet(): number {
    return this.positions.positionOf(this.data) ?? super._getPositionInSet();
  }
}
