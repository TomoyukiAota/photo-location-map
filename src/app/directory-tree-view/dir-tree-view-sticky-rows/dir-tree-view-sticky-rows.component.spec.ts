import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { Mock } from 'vitest';
import { DirTreeViewNodeSelection } from '../dir-tree-view-node-selection';
import { NestedNode } from '../directory-tree-view.model';
import { DirTreeViewStickyRowsComponent, StickyRowsHost } from './dir-tree-view-sticky-rows.component';
import { DirTreeViewStickyRowsService } from './dir-tree-view-sticky-rows.service';

function node(name: string, children: NestedNode[] = []): NestedNode {
  return Object.assign(new NestedNode(), { name, path: `/${name}`, type: children.length ? 'directory' : 'file', fsStats: undefined,
    isSelectable: true, children });
}

describe('DirTreeViewStickyRowsComponent', () => {
  // Photos / 2017 / Japan / Kansai / Hyogo / Kobe / Harborland / Night with ten photos, every folder expanded: the
  // folders' rows 48 pixels high, the photos' 240, in a box 701 pixels high, 100 pixels below the window's top, as the
  // sidebar's lower pane of the default window.
  const folderNames = ['Photos', '2017', 'Japan', 'Kansai', 'Hyogo', 'Kobe', 'Harborland', 'Night'];
  let nodes: Map<string, NestedNode>;
  let parents: Map<NestedNode, NestedNode | null>;
  let rows: Map<NestedNode, HTMLElement>;
  let tree: HTMLElement;
  let box: HTMLElement;
  let scrollTop: number;
  let host: StickyRowsHost & {
    toggle: Mock<(node: NestedNode) => void>;
    collapse: Mock<(node: NestedNode, offset: number) => void>;
    scrollTo: Mock<(node: NestedNode, offset: number) => void>;
    openMenu: Mock<(event: MouseEvent, node: NestedNode, scrollToHere: () => void) => void>;
  };
  let fixture: ComponentFixture<DirTreeViewStickyRowsComponent>;
  let service: DirTreeViewStickyRowsService;

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
    // jsdom has none, and lays nothing out: the box's height does not change in these tests.
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
    const night = node('Night', Array.from({ length: 10 }, (_, index) => node(`night ${index + 1}.jpg`)));
    let folder = night;
    for (const name of folderNames.slice(0, -1).reverse())
      folder = node(name, [folder]);
    const root = folder;
    nodes = new Map();
    parents = new Map();
    rows = new Map();
    box = document.body.appendChild(document.createElement('div'));
    box.style.overflowY = 'auto';
    Object.defineProperties(box, { clientHeight: { value: 701 }, clientTop: { value: 0 }, scrollWidth: { value: 300 } });
    box.getBoundingClientRect = () => ({ top: 100 }) as DOMRect;
    const wrapper = box.appendChild(document.createElement('div'));
    tree = wrapper.appendChild(document.createElement('mat-tree'));
    scrollTop = 0;
    let top = 0;
    const add = (current: NestedNode, parent: NestedNode | null) => {
      nodes.set(current.name, current);
      parents.set(current, parent);
      const row = tree.appendChild(document.createElement('mat-tree-node'));
      const rowTop = top;
      row.getBoundingClientRect = () => ({ top: 100 + rowTop - scrollTop }) as DOMRect;
      rows.set(current, row);
      top += current.children.length ? 48 : 240;
      current.children.forEach(child => add(child, current));
    };
    add(root, null);
    const nodesByRow = new Map([...rows].map(([each, row]) => [row as Element, each]));
    host = {
      indentPerLevel: 30,
      rowElements: () => tree.children,
      rowOf: each => rows.get(each),
      nodeOfRow: row => nodesByRow.get(row),
      parentOf: each => parents.get(each) ?? null,
      roots: () => [root],
      isOpenFolder: each => each.children.length > 0,
      toggle: vi.fn<(node: NestedNode) => void>(),
      collapse: vi.fn<(node: NestedNode, offset: number) => void>(),
      scrollTo: vi.fn<(node: NestedNode, offset: number) => void>(),
      openMenu: vi.fn<(event: MouseEvent, node: NestedNode, scrollToHere: () => void) => void>(),
    };

    TestBed.configureTestingModule({ providers: [DirTreeViewNodeSelection] });
    TestBed.inject(DirTreeViewNodeSelection).replace([root]);
    service = TestBed.inject(DirTreeViewStickyRowsService);
    fixture = TestBed.createComponent(DirTreeViewStickyRowsComponent);
    fixture.componentRef.setInput('host', host);
    // In the tree, before its rows, as the tree's template has it.
    wrapper.insertBefore(fixture.nativeElement, tree);
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
    box.remove();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  /** Scrolls the box so that the row of `name` is at its top, and has the rows placed at the next frame. */
  async function scrollTo(name: string, offset = 0): Promise<void> {
    scrollTop = rows.get(nodes.get(name)).getBoundingClientRect().top - 100 + scrollTop - offset;
    box.dispatchEvent(new Event('scroll'));
    vi.advanceTimersToNextFrame();
    await fixture.whenStable();
  }

  const shownRows = (): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll('.sticky-row'));
  const textsOf = (shown: HTMLElement[]) => shown.map(row => row.classList.contains('left-out') ? `[${row.title}]` : row.querySelector('bdi').textContent);

  it('keeps no row while the opened folder\'s own row is in its place', async () => {
    await scrollTo('Photos');
    expect(shownRows()).toEqual([]);
    expect(service.coveredHeight()).toBe(0);
  });

  it('keeps at most 7 rows, leaving out the folders in the middle, which the row of the folders left out names', async () => {
    await scrollTo('night 4.jpg');
    expect(textsOf(shownRows())).toEqual(['Photos', '2017', 'Japan', '[Kansai\nHyogo]', 'Kobe', 'Harborland', 'Night']);
    // Indented as the tree indents each folder, the row of those left out as the first of them; 32 pixels high.
    expect(shownRows().map(row => row.style.paddingInlineStart)).toEqual(['0px', '30px', '60px', '90px', '150px', '180px', '210px']);
    expect(shownRows().map(row => row.style.top)).toEqual(['0px', '32px', '64px', '96px', '128px', '160px', '192px']);
    // The pane leaves them out when it scrolls a focused row into view.
    expect(service.coveredHeight()).toBe(224);
    // Hidden from assistive technologies, as copies of rows that the tree has.
    expect(fixture.nativeElement.getAttribute('aria-hidden')).toBe('true');
  });

  it('follows the settings at once', async () => {
    await scrollTo('night 4.jpg');
    service['maximumState'].set(4);
    service['leftOutState'].set('nearPhotos');
    await fixture.whenStable();
    vi.advanceTimersToNextFrame();
    await fixture.whenStable();
    expect(textsOf(shownRows())).toEqual(['Photos', '2017', '[Japan\nKansai\nHyogo\nKobe\nHarborland]', 'Night']);
  });

  it('collapses a folder from its row\'s chevron, and scrolls to its own row from Scroll to Here, below the rows above it', async () => {
    await scrollTo('night 4.jpg');
    const kobe = nodes.get('Kobe');
    shownRows()[4].querySelector<HTMLElement>('.chevron').click();
    // Kobe has five folders above it, whose rows are kept above its own: its row comes below 5 rows of 32 pixels.
    expect(host.collapse).toHaveBeenCalledExactlyOnceWith(kobe, 5 * 32);

    const menu = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    shownRows()[1].dispatchEvent(menu);
    expect(host.openMenu).toHaveBeenCalledExactlyOnceWith(menu, nodes.get('2017'), expect.any(Function));
    host.openMenu.mock.calls[0][2]();
    expect(host.scrollTo).toHaveBeenCalledExactlyOnceWith(nodes.get('2017'), 32);
  });

  it('gives the template its rows only when they change', async () => {
    await scrollTo('night 4.jpg');
    const set = vi.spyOn(fixture.componentInstance['rows'], 'set');
    await scrollTo('night 4.jpg', 10);
    expect(set).not.toHaveBeenCalled();
    await scrollTo('Photos');
    expect(set).toHaveBeenCalledTimes(1);
  });

  it('works out how high its rows would be at another scroll position, for the tree\'s eased scroll to stop below them', async () => {
    await scrollTo('Photos');
    expect(service.coveredHeight()).toBe(0);
    const nightPhoto = rows.get(nodes.get('night 4.jpg')).getBoundingClientRect().top - 100 + scrollTop;
    // Seven rows of 32 pixels, there, while the box has not moved.
    expect(service.coveredHeightAt(nightPhoto)).toBe(224);
    expect(service.coveredHeightAt(0)).toBe(0);
    fixture.destroy();
    expect(service.coveredHeightAt(nightPhoto)).toBe(0);
  });
});
