import assert from 'assert';
import { PaneSplit, PaneSplitOptions } from '../../../../../src/app/home/pane-sizes/pane-split.js';

// The splits of the home view (src/app/home/home.component.ts), in a page with a real layout: a pane that keeps its
// size in pixels while the parent's size changes, once it has one, in a row and in a row reversed as the sidebar's is
// in Arabic and Hebrew.

interface Fixture {
  parent: HTMLElement;
  panes: [HTMLElement, HTMLElement];
  gutter: HTMLElement;
}

const fixtures: Fixture[] = [];
const splits: PaneSplit[] = [];

/** Two panes and a gutter between them, in a parent of `width` x `height` pixels laid out as `direction`. */
function makeParent(direction: 'horizontal' | 'vertical', width: number, height: number, reversed = false): Fixture {
  const parent = document.createElement('div');
  parent.style.width = `${width}px`;
  parent.style.height = `${height}px`;
  if (direction === 'horizontal') {
    parent.style.display = 'flex';
    // As the sidebar's row in a language written from right to left (src/app/home/home.component.scss).
    if (reversed) {
      parent.style.direction = 'ltr';
      parent.style.flexDirection = 'row-reverse';
    }
  }
  const pane = () => {
    const element = document.createElement('div');
    element.style.overflow = 'hidden';
    if (direction === 'horizontal') element.style.height = '100%';
    return element;
  };
  const panes: [HTMLElement, HTMLElement] = [pane(), pane()];
  const gutter = document.createElement('div');
  if (direction === 'horizontal') gutter.style.height = '100%';
  parent.append(panes[0], gutter, panes[1]);
  document.body.append(parent);
  const fixture = { parent, panes, gutter };
  fixtures.push(fixture);
  return fixture;
}

/** A split as the sidebar's: the first pane keeps its width, and both panes are at least 200 pixels wide. */
function sidebarLike(fixture: Fixture, options: Partial<PaneSplitOptions> = {}): PaneSplit {
  return track(new PaneSplit({
    panes: fixture.panes, gutter: fixture.gutter, direction: 'horizontal', gutterSize: 8, minSize: 200,
    defaultShares: [25, 75], keptPane: 0, limits: { min: 200, max: Infinity, otherMin: 200 }, ...options,
  }));
}

/** A split as the map's: the second pane, the chart, keeps its height, and leaves the first, the map, 200 pixels. */
function chartLike(fixture: Fixture, options: Partial<PaneSplitOptions> = {}): PaneSplit {
  return track(new PaneSplit({
    panes: fixture.panes, gutter: fixture.gutter, direction: 'vertical', gutterSize: 8, minSize: 0,
    defaultShares: [70, 30], keptPane: 1, limits: { min: 0, max: Infinity, otherMin: 200 }, ...options,
  }));
}

function track(split: PaneSplit): PaneSplit {
  splits.push(split);
  return split;
}

/** Waits for the page to lay out what changed, and to tell the ResizeObservers. */
async function nextFrames(): Promise<void> {
  for (let frame = 0; frame < 3; frame++)
    await new Promise(resolve => requestAnimationFrame(resolve));
}

const widthOf = (element: HTMLElement) => Math.round(element.getBoundingClientRect().width);
const heightOf = (element: HTMLElement) => Math.round(element.getBoundingClientRect().height);

/** Drags the gutter by `dx`, `dy` pixels with the mouse, as Split.js follows it: down on the gutter, moved, up. */
function drag(gutter: HTMLElement, dx: number, dy: number): void {
  const box = gutter.getBoundingClientRect();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  gutter.dispatchEvent(new MouseEvent('mousedown', { clientX: x, clientY: y, button: 0, bubbles: true }));
  if (dx || dy)
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: x + dx, clientY: y + dy }));
  window.dispatchEvent(new MouseEvent('mouseup', { clientX: x + dx, clientY: y + dy }));
}

describe('PaneSplit', () => {
  afterEach(() => {
    splits.splice(0).forEach(split => split.destroy());
    fixtures.splice(0).forEach(fixture => fixture.parent.remove());
  });

  it('keeps the default shares, which follow the parent, until the kept pane has a size', async () => {
    const fixture = makeParent('horizontal', 1000, 300);
    sidebarLike(fixture);
    assert.strictEqual(widthOf(fixture.panes[0]), 246);
    fixture.parent.style.width = '1200px';
    await nextFrames();
    assert.strictEqual(widthOf(fixture.panes[0]), 296);
  });

  it('shows a saved size, keeps it while the parent changes, and leaves the other pane its least size', async () => {
    const fixture = makeParent('horizontal', 1000, 300);
    sidebarLike(fixture, { savedSize: 312 });
    assert.strictEqual(widthOf(fixture.panes[0]), 312);
    const widthAt = async (parentWidth: number) => {
      fixture.parent.style.width = `${parentWidth}px`;
      await nextFrames();
      return widthOf(fixture.panes[0]);
    };
    assert.strictEqual(await widthAt(1600), 312);
    assert.strictEqual(await widthAt(500), 292);
    assert.strictEqual(widthOf(fixture.panes[1]), 200);
    assert.strictEqual(await widthAt(1000), 312);
    // A parent that cannot hold both least sizes: the default shares, as Split.js gives up its minimums there.
    assert.strictEqual(await widthAt(300), 71);
    assert.strictEqual(await widthAt(1000), 312);
  });

  it('keeps the size of a drag and tells it, while a click on the gutter keeps nothing', async () => {
    const fixture = makeParent('horizontal', 1000, 300);
    const dragged: number[][] = [];
    sidebarLike(fixture, { onDragged: sizes => dragged.push(sizes) });
    drag(fixture.gutter, 0, 0);
    assert.deepStrictEqual(dragged, []);
    fixture.parent.style.width = '1200px';
    await nextFrames();
    assert.strictEqual(widthOf(fixture.panes[0]), 296);
    drag(fixture.gutter, 100, 0);
    assert.deepStrictEqual(dragged, [[396, 796]]);
    fixture.parent.style.width = '1000px';
    await nextFrames();
    assert.strictEqual(widthOf(fixture.panes[0]), 396);
  });

  it('does the same in a reversed row, where the first pane is on the right', async () => {
    const fixture = makeParent('horizontal', 1000, 300, true);
    const dragged: number[][] = [];
    const split = sidebarLike(fixture, { savedSize: 312, onDragged: sizes => dragged.push(sizes) });
    assert.strictEqual(widthOf(fixture.panes[0]), 312);
    assert.ok(fixture.panes[0].getBoundingClientRect().x > fixture.panes[1].getBoundingClientRect().x);
    fixture.parent.style.width = '1200px';
    await nextFrames();
    assert.strictEqual(widthOf(fixture.panes[0]), 312);
    assert.strictEqual(widthOf(fixture.panes[1]), 1200 - 8 - 312);
    // To the left, the gutter makes the pane on the right wider.
    drag(fixture.gutter, -100, 0);
    assert.deepStrictEqual(dragged, [[412, 780]]);
    split.reset();
    assert.strictEqual(widthOf(fixture.panes[0]), 296);
    assert.strictEqual(widthOf(fixture.panes[1]), 896);
  });

  it('puts the default back on reset(), which follows the parent again', async () => {
    const fixture = makeParent('horizontal', 1000, 300);
    const split = sidebarLike(fixture, { savedSize: 312 });
    split.reset();
    assert.strictEqual(widthOf(fixture.panes[0]), 246);
    fixture.parent.style.width = '1200px';
    await nextFrames();
    assert.strictEqual(widthOf(fixture.panes[0]), 296);
  });

  it('leaves the other pane its least size at first, and less where a drag made it smaller', async () => {
    const fixture = makeParent('vertical', 300, 600);
    const dragged: number[][] = [];
    chartLike(fixture, { savedSize: 500, onDragged: sizes => dragged.push(sizes) });
    assert.deepStrictEqual([heightOf(fixture.panes[0]), heightOf(fixture.panes[1])], [200, 392]);
    // Up, the gutter makes the map 100 pixels high: a smaller parent then keeps the map at that.
    drag(fixture.gutter, 0, -100);
    assert.deepStrictEqual(dragged, [[100, 492]]);
    fixture.parent.style.height = '550px';
    await nextFrames();
    assert.deepStrictEqual([heightOf(fixture.panes[0]), heightOf(fixture.panes[1])], [100, 442]);
    // At the next launch, the map gets its least size back.
    fixtures.splice(0).forEach(each => each.parent.remove());
    const next = makeParent('vertical', 300, 600);
    chartLike(next, { savedSize: 492 });
    assert.deepStrictEqual([heightOf(next.panes[0]), heightOf(next.panes[1])], [200, 392]);
  });

  it('waits while the parent is not shown, and shows the size once it is', async () => {
    const fixture = makeParent('horizontal', 1000, 300);
    sidebarLike(fixture, { savedSize: 312 });
    fixture.parent.style.display = 'none';
    await nextFrames();
    fixture.parent.style.width = '1200px';
    await nextFrames();
    fixture.parent.style.display = 'flex';
    await nextFrames();
    assert.strictEqual(widthOf(fixture.panes[0]), 312);
    assert.strictEqual(widthOf(fixture.panes[1]), 1200 - 8 - 312);
  });

  it('keeps a default size, as the sidebar\'s upper pane, within its largest', async () => {
    const fixture = makeParent('vertical', 300, 600);
    const split = track(new PaneSplit({
      panes: fixture.panes, gutter: fixture.gutter, direction: 'vertical', gutterSize: 4, minSize: [0, 0],
      maxSize: [66, Infinity], defaultShares: [0, 100], keptPane: 0, defaultSize: 66,
      limits: { min: 0, max: 66, otherMin: 0 },
    }));
    assert.strictEqual(heightOf(fixture.panes[0]), 66);
    fixture.parent.style.height = '300px';
    await nextFrames();
    assert.strictEqual(heightOf(fixture.panes[0]), 66);
    drag(fixture.gutter, 0, -30);
    assert.strictEqual(heightOf(fixture.panes[0]), 36);
    fixture.parent.style.height = '600px';
    await nextFrames();
    assert.strictEqual(heightOf(fixture.panes[0]), 36);
    split.reset();
    assert.strictEqual(heightOf(fixture.panes[0]), 66);
  });

  it('shows the size again at a resize of the window only, where it is asked to', async () => {
    const fixture = makeParent('vertical', 300, 600);
    track(new PaneSplit({
      panes: fixture.panes, gutter: fixture.gutter, direction: 'vertical', gutterSize: 4, minSize: [0, 0],
      maxSize: [66, Infinity], defaultShares: [0, 100], keptPane: 0, defaultSize: 66,
      limits: { min: 0, max: 66, otherMin: 0 }, showSizeAt: 'window-resize',
    }));
    // A share of the parent until the window is resized: (66 + 2) / 600 of 571 pixels, less half the gutter.
    fixture.parent.style.height = '571px';
    await nextFrames();
    assert.strictEqual(heightOf(fixture.panes[0]), 63);
    window.dispatchEvent(new Event('resize'));
    assert.strictEqual(heightOf(fixture.panes[0]), 66);
  });
});
