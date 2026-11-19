import { DirTreeViewNodePositions } from './dir-tree-view-tree-node.directive';
import { NestedNode } from './directory-tree-view.model';

function node(path: string, children: NestedNode[] = []): NestedNode {
  return Object.assign(new NestedNode(), { name: path.split('/').pop(), path, children });
}

describe('DirTreeViewNodePositions', () => {
  it('counts each node among its siblings from 1, the roots among the roots', () => {
    const b = node('/folder/sub/b.jpg');
    const sub = node('/folder/sub', [node('/folder/sub/a.jpg'), b]);
    const c = node('/folder/c.jpg');
    const folder = node('/folder', [sub, c]);
    const other = node('/other');
    const positions = new DirTreeViewNodePositions();

    positions.replace([folder, other]);

    expect([folder, other, sub, c, b].map(each => positions.positionOf(each))).toEqual([1, 2, 1, 2, 2]);
  });

  it('counts the nodes again in their new order, and forgets the nodes of the tree before', () => {
    const a = node('/folder/a.jpg');
    const b = node('/folder/b.jpg');
    const folder = node('/folder', [a, b]);
    const previous = node('/previous', [node('/previous/photo.jpg')]);
    const positions = new DirTreeViewNodePositions();
    positions.replace([previous]);

    positions.replace([folder]);
    folder.children.reverse();   // As a sort reorders the children in place, before the tree counts them again.
    positions.replace([folder]);

    expect(positions.positionOf(b)).toBe(1);
    expect(positions.positionOf(a)).toBe(2);
    expect(positions.positionOf(previous)).toBeUndefined();
  });
});
