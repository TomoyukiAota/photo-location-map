import { TestBed } from '@angular/core/testing';
import { smoothScrollDurationMs, smoothScrollPosition, SmoothScrollService } from './smooth-scroll.service';

const frameMs = 1000 / 60;

describe('smoothScrollDurationMs', () => {
  it('takes longer the further it goes, from 0.3 s to 0.65 s', () => {
    expect(smoothScrollDurationMs(40)).toBe(300);
    expect(smoothScrollDurationMs(400)).toBeCloseTo(440, 0);
    expect(smoothScrollDurationMs(1600)).toBe(650);
    expect(smoothScrollDurationMs(100_000)).toBe(650);
  });
});

describe('smoothScrollPosition', () => {
  it('goes all the way along, when it goes no further than its travel', () => {
    const scroll = { from: 1000, to: 600, travel: 400 };
    expect([0, 0.25, 0.5, 1].map(eased => smoothScrollPosition(scroll, eased))).toEqual([1000, 900, 800, 600]);
  });

  it('shows a longer way by its first and last halves of its travel, skipping what is between at its middle', () => {
    const scroll = { from: 0, to: 10_000, travel: 800 };
    expect([0, 0.25, 0.49, 0.5, 0.75, 1].map(eased => smoothScrollPosition(scroll, eased)))
      .toEqual([0, 200, 392, 9600, 9800, 10_000]);
  });
});

describe('SmoothScrollService', () => {
  let service: SmoothScrollService;
  let frames: Map<number, FrameRequestCallback>;
  let nowMs: number;

  /** A box that scrolls, `clientHeight` high, at 100 pixels from the top of the window. */
  function scrollingBox(clientHeight = 400, scrollHeight = 10_000) {
    const box = document.createElement('div');
    box.style.overflowY = 'auto';
    let scrollTop = 0;
    Object.defineProperties(box, {
      clientHeight: { value: clientHeight },
      clientTop: { value: 0 },
      scrollHeight: { value: scrollHeight },
      scrollTop: {
        get: () => scrollTop,
        set: (value: number) => scrollTop = Math.min(scrollHeight - clientHeight, Math.max(0, value)),
      },
    });
    box.getBoundingClientRect = () => ({ top: 100 }) as DOMRect;
    document.body.append(box);
    /** A row of the box, `top` from the top of what the box scrolls. */
    const rowAt = (top: number, height = 40) => {
      const row = document.createElement('div');
      row.getBoundingClientRect = () => ({ top: 100 + top - box.scrollTop, height }) as DOMRect;
      box.append(row);
      return row;
    };
    return { box, rowAt };
  }

  /** Runs one frame, a 60th of a second after the last, and gives where the box is then. */
  function frame(box: HTMLElement): number {
    nowMs += frameMs;
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach(callback => callback(nowMs));
    return box.scrollTop;
  }

  /** Runs the frames until the box stops, and gives where it is at each. */
  function framesToTheEnd(box: HTMLElement): number[] {
    const positions: number[] = [];
    while (frames.size > 0 && positions.length < 1000)
      positions.push(frame(box));
    return positions;
  }

  const steps = (positions: number[], from: number) => positions.map((position, index) => position - (positions[index - 1] ?? from));

  beforeEach(() => {
    frames = new Map();
    nowMs = 1000;
    let lastId = 0;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.set(++lastId, callback);
      return lastId;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
    vi.spyOn(performance, 'now').mockImplementation(() => nowMs);
    service = TestBed.inject(SmoothScrollService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it('scrolls the box to have the element in its middle, speeding up from a stop and slowing down to one', () => {
    const { box, rowAt } = scrollingBox();
    const whenStopped = vi.fn();

    service.scrollToMiddle(rowAt(700), { evenWhenShown: false }, whenStopped);
    expect(box.scrollTop).toBe(0);
    const positions = framesToTheEnd(box);

    // 700 pixels down, less half of what the box shows and half of the row: 520, in about 0.47 s.
    expect(positions.at(-1)).toBe(520);
    expect(positions.length).toBe(Math.ceil(smoothScrollDurationMs(520) / frameMs));
    const moves = steps(positions, 0);
    expect(moves.every(move => move >= 0)).toBe(true);
    const fastest = Math.max(...moves);
    expect(Math.abs(moves.indexOf(fastest) - moves.length / 2)).toBeLessThanOrEqual(1);
    expect(moves[0]).toBeLessThan(fastest / 10);
    expect(moves.at(-1)).toBeLessThan(fastest / 10);
    expect(whenStopped).toHaveBeenCalledOnce();
  });

  it('calls what follows only once the box has stopped', () => {
    const { box, rowAt } = scrollingBox();
    const whenStopped = vi.fn();

    service.scrollToMiddle(rowAt(1000), { evenWhenShown: false }, whenStopped);
    frame(box);
    frame(box);

    expect(whenStopped).not.toHaveBeenCalled();
    framesToTheEnd(box);
    expect(whenStopped).toHaveBeenCalledOnce();
  });

  it('leaves the box where it is when it shows all of the element, unless asked to scroll then too', () => {
    const { box, rowAt } = scrollingBox();
    const row = rowAt(300);
    const whenStopped = vi.fn();

    service.scrollToMiddle(row, { evenWhenShown: false }, whenStopped);
    expect(frames.size).toBe(0);
    expect(whenStopped).toHaveBeenCalledOnce();

    service.scrollToMiddle(row, { evenWhenShown: true }, whenStopped);
    expect(framesToTheEnd(box).at(-1)).toBe(120);
    expect(whenStopped).toHaveBeenCalledTimes(2);
  });

  it('scrolls to an element that the box shows only in part', () => {
    const { box, rowAt } = scrollingBox();

    service.scrollToMiddle(rowAt(380), { evenWhenShown: false }, () => undefined);

    expect(framesToTheEnd(box).at(-1)).toBe(200);
  });

  it('goes no further than the box can scroll', () => {
    const { box, rowAt } = scrollingBox(400, 2000);

    service.scrollToMiddle(rowAt(1940), { evenWhenShown: false }, () => undefined);

    expect(framesToTheEnd(box).at(-1)).toBe(1600);
  });

  it('takes over from the scroll that is going on, at its speed, and calls only what follows the last', () => {
    const { box, rowAt } = scrollingBox();
    const first = vi.fn();
    const second = vi.fn();
    service.scrollToMiddle(rowAt(600), { evenWhenShown: false }, first);
    const before: number[] = [];
    for (let index = 0; index < 12; index++)
      before.push(frame(box));

    // Out of what the box shows where the first scroll ends, 420 to 820.
    service.scrollToMiddle(rowAt(1000), { evenWhenShown: false }, second);
    const after = framesToTheEnd(box);

    const speedBefore = before.at(-1) - before.at(-2);
    const speedAfter = after[0] - before.at(-1);
    expect(speedAfter).toBeGreaterThan(speedBefore * 0.9);
    expect(speedAfter).toBeLessThan(speedBefore * 1.3);
    expect(steps(after, before.at(-1)).every(move => move >= 0)).toBe(true);
    expect(after.at(-1)).toBe(820);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it('lets the scroll that is going on end where the box will show the element, and calls what follows that', () => {
    const { box, rowAt } = scrollingBox();
    const first = vi.fn();
    const second = vi.fn();
    service.scrollToMiddle(rowAt(600), { evenWhenShown: false }, first);
    frame(box);

    // Below the first element, where the box shows it at the end of the first scroll, 420 to 820.
    service.scrollToMiddle(rowAt(700), { evenWhenShown: false }, second);
    expect(second).not.toHaveBeenCalled();

    expect(framesToTheEnd(box).at(-1)).toBe(420);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it('shows a long way in part, its first two views of the box and its last two, in the time of four views', () => {
    const { box, rowAt } = scrollingBox(400, 100_000);

    service.scrollToMiddle(rowAt(50_000), { evenWhenShown: false }, () => undefined);
    const positions = framesToTheEnd(box);

    expect(positions.length).toBe(Math.ceil(smoothScrollDurationMs(1600) / frameMs));
    expect(positions.at(-1)).toBe(49_820);
    // Each position is in the first 800 pixels of the way or in its last 800.
    expect(positions.every(position => position <= 800 || position >= 49_020)).toBe(true);
    expect(positions.filter(position => position <= 800).length).toBeGreaterThan(positions.length / 3);
  });

  it('goes all the way along a way of up to four views of the box', () => {
    const { box, rowAt } = scrollingBox(400, 100_000);

    // 1,520 pixels: 3.8 views.
    service.scrollToMiddle(rowAt(1700), { evenWhenShown: false }, () => undefined);
    const positions = framesToTheEnd(box);

    expect(positions.at(-1)).toBe(1520);
    expect(Math.max(...steps(positions, 0))).toBeLessThan(1520 / 10);
  });

  it('ends where it is on a gesture or a click in the box, or a key that may move the focus, and calls what follows', () => {
    for (const input of [
      new WheelEvent('wheel', { bubbles: true }),
      new Event('touchstart', { bubbles: true }),
      new Event('pointerdown', { bubbles: true }),
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    ]) {
      const { box, rowAt } = scrollingBox();
      const row = rowAt(1000);
      const whenStopped = vi.fn();
      service.scrollToMiddle(row, { evenWhenShown: false }, whenStopped);
      frame(box);
      const stoppedAt = frame(box);

      row.dispatchEvent(input);
      expect(whenStopped).toHaveBeenCalledOnce();
      frame(box);
      expect(box.scrollTop).toBe(stoppedAt);
      expect(frames.size).toBe(0);
    }
  });

  it('goes on through a key with Ctrl or Cmd, a shortcut of the application such as Select Next, and Ctrl or Cmd itself', () => {
    const { box, rowAt } = scrollingBox();
    const row = rowAt(1000);
    service.scrollToMiddle(row, { evenWhenShown: false }, () => undefined);
    frame(box);

    for (const init of [{ key: 'Meta', metaKey: true }, { key: 'ArrowRight', metaKey: true }, { key: 'ArrowRight', ctrlKey: true }])
      row.dispatchEvent(new KeyboardEvent('keydown', { ...init, bubbles: true }));

    expect(framesToTheEnd(box).at(-1)).toBe(820);
  });

  it('goes to its place at once with the system\'s setting to reduce motion', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(prefers-reduced-motion: reduce)' }));
    const { box, rowAt } = scrollingBox();
    const whenStopped = vi.fn();

    service.scrollToMiddle(rowAt(1000), { evenWhenShown: false }, whenStopped);

    expect(box.scrollTop).toBe(820);
    expect(frames.size).toBe(0);
    expect(whenStopped).toHaveBeenCalledOnce();
  });

  it('calls what follows at once for an element that is in no box that scrolls', () => {
    const row = document.createElement('div');
    document.body.append(row);
    const whenStopped = vi.fn();

    service.scrollToMiddle(row, { evenWhenShown: true }, whenStopped);

    expect(whenStopped).toHaveBeenCalledOnce();
  });

  it('stops where it is without what was to follow', () => {
    const { box, rowAt } = scrollingBox();
    const whenStopped = vi.fn();
    service.scrollToMiddle(rowAt(1000), { evenWhenShown: false }, whenStopped);
    const stoppedAt = frame(box);

    service.stop();

    expect(frames.size).toBe(0);
    expect(box.scrollTop).toBe(stoppedAt);
    expect(whenStopped).not.toHaveBeenCalled();
  });
});
