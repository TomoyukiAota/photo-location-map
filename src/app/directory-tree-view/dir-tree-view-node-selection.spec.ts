import { computed, Signal } from '@angular/core';
import { DirTreeViewNodeSelection, NodeSelectionState } from './dir-tree-view-node-selection';
import { NestedNode } from './directory-tree-view.model';

/** A file's node, a photo with location data unless `isSelectable` is false. */
function file(path: string, isSelectable = true): NestedNode {
  return Object.assign(new NestedNode(), { name: path.split('/').pop(), path, type: 'file', fsStats: undefined, isSelectable, children: [] });
}

/** A folder's node, which can be selected when something in it can. */
function folder(path: string, children: NestedNode[]): NestedNode {
  return Object.assign(new NestedNode(), { name: path.split('/').pop(), path, type: 'directory', fsStats: undefined,
    isSelectable: children.some(child => child.isSelectable), children });
}

describe('DirTreeViewNodeSelection', () => {
  let selection: DirTreeViewNodeSelection;
  let a: NestedNode, b: NestedNode, withoutLocation: NestedNode, c: NestedNode, d: NestedNode;
  let sub: NestedNode, empty: NestedNode, movies: NestedNode, root: NestedNode;

  beforeEach(() => {
    a = file('/root/a.jpg');
    b = file('/root/b.jpg');
    withoutLocation = file('/root/without-location.jpg', false);
    c = file('/root/sub/c.jpg');
    d = file('/root/sub/d.jpg');
    sub = folder('/root/sub', [c, d]);
    empty = folder('/root/empty', []);
    movies = folder('/root/movies', [file('/root/movies/movie.mov', false)]);
    root = folder('/root', [a, b, withoutLocation, sub, empty, movies]);
    selection = new DirTreeViewNodeSelection();
    selection.replace([root]);
  });

  /** The state of each node, by its name. */
  const states = (...nodes: NestedNode[]) => Object.fromEntries(nodes.map(node => [node.name, selection.stateOf(node)()]));
  const selectedNames = () => selection.selectedPhotos().map(node => node.name);

  it('has nothing selected in a newly opened folder', () => {
    expect(states(root, a, sub, c)).toEqual({ root: 'notSelected', 'a.jpg': 'notSelected', sub: 'notSelected', 'c.jpg': 'notSelected' });
    expect(selectedNames()).toEqual([]);
  });

  it('selects and deselects a photo, and the folders above it follow: partly selected, then selected', () => {
    selection.toggle(c);
    expect(states(c, sub, root)).toEqual({ 'c.jpg': 'selected', sub: 'partlySelected', root: 'partlySelected' });
    selection.toggle(d);
    expect(states(sub, root)).toEqual({ sub: 'selected', root: 'partlySelected' });
    expect(selection.isSelected(sub)).toBe(true);
    selection.toggle(a);
    selection.toggle(b);
    // The photo without location data is not counted: it cannot be selected.
    expect(states(root)).toEqual({ root: 'selected' });

    selection.toggle(c);
    expect(states(c, sub, root)).toEqual({ 'c.jpg': 'notSelected', sub: 'partlySelected', root: 'partlySelected' });
    expect(selectedNames()).toEqual(['d.jpg', 'a.jpg', 'b.jpg']);
  });

  it('selects all of a folder\'s photos that can be selected, all the way down, and deselects them when they all are', () => {
    selection.toggle(c);
    // Partly selected, so the folder's photos are all selected, in the order that the tree shows them.
    selection.toggle(root);
    expect(states(root, sub, a, withoutLocation)).toEqual({ root: 'selected', sub: 'selected', 'a.jpg': 'selected', 'without-location.jpg': 'notSelected' });
    expect(selectedNames()).toEqual(['c.jpg', 'a.jpg', 'b.jpg', 'd.jpg']);

    selection.toggle(root);
    expect(states(root, sub, a, c)).toEqual({ root: 'notSelected', sub: 'notSelected', 'a.jpg': 'notSelected', 'c.jpg': 'notSelected' });
    expect(selectedNames()).toEqual([]);
  });

  it('selects the photos in a folder\'s order after the tree is sorted', () => {
    sub.children.reverse();
    selection.toggle(sub);
    expect(selectedNames()).toEqual(['d.jpg', 'c.jpg']);
  });

  it('leaves alone what cannot be selected', () => {
    for (const node of [withoutLocation, empty, movies])
      selection.toggle(node);
    expect(selectedNames()).toEqual([]);
    expect(states(withoutLocation, empty, movies, root))
      .toEqual({ 'without-location.jpg': 'notSelected', empty: 'notSelected', movies: 'notSelected', root: 'notSelected' });
  });

  it('selects only the requested nodes, each folder with its photos after the photos among them, and deselects the rest', () => {
    selection.toggle(root);
    selection.selectOnly([sub, b, withoutLocation]);
    expect(selectedNames()).toEqual(['b.jpg', 'c.jpg', 'd.jpg']);
    expect(states(root, a, b, sub)).toEqual({ root: 'partlySelected', 'a.jpg': 'notSelected', 'b.jpg': 'selected', sub: 'selected' });

    selection.selectOnly([]);
    expect(selectedNames()).toEqual([]);
    expect(states(root, sub)).toEqual({ root: 'notSelected', sub: 'notSelected' });
  });

  describe('the signal of a node\'s state', () => {
    /** How many times each node's signal has changed while it was read. */
    let changes: Map<NestedNode, number>;
    let readers: Signal<NodeSelectionState>[];

    beforeEach(() => {
      changes = new Map();
      readers = [a, b, c, d, sub, root].map(node => {
        const state = selection.stateOf(node);
        changes.set(node, -1);
        // A computed value is computed again only when the signal that it reads has changed.
        return computed(() => {
          changes.set(node, changes.get(node) + 1);
          return state();
        });
      });
    });
    const readAll = () => readers.forEach(reader => reader());
    const changesByName = () => Object.fromEntries([...changes].map(([node, count]) => [node.name, count]));

    it('changes for the nodes whose state changes only', () => {
      readAll();
      selection.toggle(c);
      readAll();
      expect(changesByName()).toEqual({ 'a.jpg': 0, 'b.jpg': 0, 'c.jpg': 1, 'd.jpg': 0, sub: 1, root: 1 });

      // The opened folder stays partly selected.
      selection.toggle(a);
      readAll();
      expect(changesByName()).toEqual({ 'a.jpg': 1, 'b.jpg': 0, 'c.jpg': 1, 'd.jpg': 0, sub: 1, root: 1 });
    });

    it('does not change for a photo that stays selected while the others are deselected', () => {
      // As Undo in the Selection menu selects the photos of a previous selection, which has a photo of this one.
      selection.toggle(root);
      readAll();
      selection.selectOnly([a, c]);
      readAll();
      expect(changesByName()).toEqual({ 'a.jpg': 0, 'b.jpg': 1, 'c.jpg': 0, 'd.jpg': 1, sub: 1, root: 1 });
    });
  });

  it('gives a row that reads its node\'s state first after a change the state then', () => {
    // As a row that comes near the view after Select Previous or Select Next selected its photo.
    selection.toggle(d);
    expect(selection.stateOf(d)()).toBe('selected');
    expect(selection.stateOf(sub)()).toBe('partlySelected');
    expect(selection.stateOf(file('/root/sub/d.jpg'))()).toBe('notSelected'); // Another node, of the same path.
  });

  it('starts anew with the tree of another folder', () => {
    selection.toggle(root);
    const other = file('/other/e.jpg');
    selection.replace([folder('/other', [other])]);
    expect(selectedNames()).toEqual([]);
    expect(selection.stateOf(other)()).toBe('notSelected');
    // A node of the previous tree, as a row of it may read for a moment, is not selected.
    expect(selection.stateOf(a)()).toBe('notSelected');
    expect(selection.isSelected(a)).toBe(false);
  });
});
