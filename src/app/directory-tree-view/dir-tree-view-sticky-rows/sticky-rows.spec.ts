import { NestedNode } from '../directory-tree-view.model';
import { allowedStickyRows, StickyFolder, stickyFoldersOf, StickyRowsLayout, stickyRowsOf } from './sticky-rows';

/** A folder or a photo of a test's tree. */
function node(name: string, children: NestedNode[] = []): NestedNode {
  return Object.assign(new NestedNode(), { name, path: name, type: children.length ? 'directory' : 'file', fsStats: undefined,
    isSelectable: true, children });
}

/**
 * Photos / 2017 / Japan / Kansai / Hyogo / Kobe / Harborland / Night, with eight photos in Night and one in each other
 * folder after its subfolder, and a folder 2018 with a photo after 2017: every folder expanded, folders' rows 48 pixels
 * high and photos' rows 240.
 */
function deepTree() {
  const names = ['Photos', '2017', 'Japan', 'Kansai', 'Hyogo', 'Kobe', 'Harborland', 'Night'];
  const night = node('Night', Array.from({ length: 8 }, (_, index) => node(`night ${index + 1}.jpg`)));
  let folder = night;
  for (const name of names.slice(1, -1).reverse())
    folder = node(name, [folder, node(`${name}.jpg`)]);
  const photos = node('Photos', [folder, node('2018', [node('2018.jpg')])]);
  return { photos, folders: names };
}

/** The tree's rows from the top of the box scrolled to `scrollTop`, as the layout that the choice reads. */
function layoutOf(root: NestedNode, scrollTop: number): StickyRowsLayout & { rows: { node: NestedNode; top: number }[] } {
  const parents = new Map<NestedNode, NestedNode | null>();
  const rows: { node: NestedNode; top: number; depth: number }[] = [];
  let top = -scrollTop;
  const add = (current: NestedNode, parent: NestedNode | null, depth: number) => {
    parents.set(current, parent);
    rows.push({ node: current, top, depth });
    top += current.children.length ? 48 : 240;
    current.children.forEach(child => add(child, current, depth + 1));
  };
  add(root, null, 0);
  const indexOf = (target: NestedNode) => rows.findIndex(row => row.node === target);
  return {
    rows,
    nodeAt: offset => [...rows].reverse().find(row => row.top <= offset)?.node,
    parentOf: target => parents.get(target) ?? null,
    isOpenFolder: target => target.children.length > 0,
    rowTopOf: target => rows[indexOf(target)]?.top,
    endOf: target => {
      const index = indexOf(target);
      const after = rows.slice(index + 1).find(row => row.depth <= rows[index].depth);
      return after ? after.top : Infinity;
    },
  };
}

const names = (folders: readonly StickyFolder[]) => folders.map(folder => folder.node.name);

describe('stickyFoldersOf', () => {
  it('finds no folder while the opened folder\'s row is in its place', () => {
    const { photos } = deepTree();
    expect(stickyFoldersOf(layoutOf(photos, 0), 7)).toEqual([]);
  });

  it('finds every folder that the rows at the top are in, from the opened folder down', () => {
    const { photos, folders } = deepTree();
    const layout = layoutOf(photos, 0);
    const third = layout.rows.find(row => row.node.name === 'night 3.jpg')!;
    expect(names(stickyFoldersOf(layoutOf(photos, third.top), 7))).toEqual(folders);
  });

  it('keeps a folder\'s row once its own row has gone above its slot, and not before', () => {
    const { photos } = deepTree();
    // Japan's row is the third, two rows of 32 pixels below the top once 2017's is out of sight.
    const japanTop = layoutOf(photos, 0).rows.find(row => row.node.name === 'Japan')!.top;
    expect(names(stickyFoldersOf(layoutOf(photos, japanTop - 64), 7))).toEqual(['Photos', '2017']);
    expect(names(stickyFoldersOf(layoutOf(photos, japanTop - 63), 7))).toEqual(['Photos', '2017', 'Japan']);
  });

  it('gives where each folder\'s contents end', () => {
    const { photos } = deepTree();
    const layout = layoutOf(photos, 0);
    const scrollTop = layout.rows.find(row => row.node.name === 'night 8.jpg')!.top;
    const folders = stickyFoldersOf(layoutOf(photos, scrollTop), 10);
    const scrolled = layoutOf(photos, scrollTop);
    // Night ends where Harborland's photo starts, 240 pixels below the last photo of Night, which is at the top.
    expect(folders.at(-1)).toEqual({ node: scrolled.rows.find(row => row.node.name === 'Night')!.node, end: 240 });
    expect(folders[0].end).toBe(Infinity);
  });
});

describe('stickyRowsOf', () => {
  const { photos } = deepTree();
  const scrollTop = layoutOf(photos, 0).rows.find(row => row.node.name === 'night 3.jpg')!.top;
  const folders = stickyFoldersOf(layoutOf(photos, scrollTop), 10);
  const shown = (allowed: number, leftOut: Parameters<typeof stickyRowsOf>[2]) =>
    stickyRowsOf(folders, allowed, leftOut).map(row => row.leftOut ? `[${row.leftOut.map(folder => folder.name).join(', ')}]` : row.node.name);

  it('has a row for each folder when they are at most those allowed, each in its slot', () => {
    const rows = stickyRowsOf(folders, 8, 'middle');
    expect(rows.map(row => row.node.name)).toEqual(['Photos', '2017', 'Japan', 'Kansai', 'Hyogo', 'Kobe', 'Harborland', 'Night']);
    expect(rows.map(row => row.top)).toEqual([0, 32, 64, 96, 128, 160, 192, 224]);
    expect(rows.some(row => row.leftOut)).toBe(false);
  });

  it('leaves out the folders in the middle: of 7 rows, the opened folder, the two below it, the row of those left out, and the three above the photos', () => {
    expect(shown(7, 'middle')).toEqual(['Photos', '2017', 'Japan', '[Kansai, Hyogo]', 'Kobe', 'Harborland', 'Night']);
    // One more from the photos' side when the two sides cannot be as many.
    expect(shown(6, 'middle')).toEqual(['Photos', '2017', '[Japan, Kansai, Hyogo]', 'Kobe', 'Harborland', 'Night']);
  });

  it('leaves out the folders near the opened folder, or near the photos', () => {
    expect(shown(7, 'nearOpenedFolder')).toEqual(['Photos', '[2017, Japan]', 'Kansai', 'Hyogo', 'Kobe', 'Harborland', 'Night']);
    expect(shown(7, 'nearPhotos')).toEqual(['Photos', '2017', 'Japan', 'Kansai', 'Hyogo', '[Kobe, Harborland]', 'Night']);
  });

  it('always keeps the opened folder and the folder of the photos', () => {
    for (const leftOut of ['middle', 'nearOpenedFolder', 'nearPhotos'] as const)
      expect(shown(3, leftOut)).toEqual(['Photos', '[2017, Japan, Kansai, Hyogo, Kobe, Harborland]', 'Night']);
  });

  it('indents the row of the folders left out by the first of them', () => {
    const leftOutRow = stickyRowsOf(folders, 7, 'middle')[3];
    expect(leftOutRow.node.name).toBe('Kansai');
    expect(leftOutRow.top).toBe(96);
  });

  it('pushes a row up by the row after its folder\'s contents, and the rows below it with it', () => {
    // The last photo of Night, then Harborland's photo, whose row comes up to 230 pixels from the top: Night's row,
    // in the slot from 224 to 256, goes up to end there.
    const end = 230;
    const rows = stickyRowsOf(folders.map(folder => folder.node.name === 'Night' ? { ...folder, end } : folder), 8, 'middle');
    expect(rows.at(-1)!.top).toBe(end - 32);
    expect(rows.at(-2)!.top).toBe(192);
    // The row of the folders left out goes up with the last of them.
    const pushed = folders.map(folder => folder.node.name === 'Hyogo' ? { ...folder, end: 120 } : folder);
    expect(stickyRowsOf(pushed, 7, 'middle')[3].top).toBe(120 - 32);
  });
});

describe('allowedStickyRows', () => {
  // The sidebar's lower pane is the window's height less 99 pixels; a photo's row is 237 pixels high.
  const allowed = (boxHeight: number, maximum = 7) => allowedStickyRows({ maximum, boxHeight, photoRowHeight: 237 });

  it('allows the setting\'s most in a pane of the default window', () => {
    expect(allowed(701)).toBe(7);
    expect(allowed(701, 5)).toBe(5);
  });

  it('allows fewer in a pane of little height: at most a third of it, with a photo\'s row left below them', () => {
    expect(allowed(601)).toBe(6);
    expect(allowed(501)).toBe(5);
    expect(allowed(401)).toBe(4);
  });

  it('never allows fewer than the opened folder, the row of the folders left out and the folder of the photos', () => {
    expect(allowed(301)).toBe(3);
    expect(allowed(100)).toBe(3);
  });
});
