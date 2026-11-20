import type { Mock } from 'vitest';
import { EasedScroll, EasedScrollCurve, easedScrollDurationMs } from './eased-scroll';

describe('EasedScrollCurve', () => {
  it('speeds up gradually from rest and slows down gradually to rest, at its fastest halfway', () => {
    const curve = new EasedScrollCurve(100, 1100, 500);
    const averageSpeed = 1000 / 500;
    expect(curve.positionAt(0)).toBe(100);
    expect(curve.positionAt(250)).toBeCloseTo(600);
    expect(curve.positionAt(500)).toBe(1100);
    expect(curve.speedAt(0)).toBe(0);
    expect(curve.speedAt(500)).toBe(0);
    // Slow for a while at both ends, rather than starting or stopping at once.
    expect(curve.speedAt(25)).toBeLessThan(averageSpeed / 10);
    expect(curve.speedAt(475)).toBeLessThan(averageSpeed / 10);
    expect(curve.speedAt(250)).toBeCloseTo(1.875 * averageSpeed);
    const speeds = Array.from({ length: 51 }, (_, index) => curve.speedAt(index * 10));
    for (let index = 1; index <= 25; index++)
      expect(speeds[index]).toBeGreaterThan(speeds[index - 1]);
    for (let index = 26; index <= 50; index++)
      expect(speeds[index]).toBeLessThan(speeds[index - 1]);
  });

  it('goes on at the speed that it starts with, and stops at its end without passing it', () => {
    // 2.5 times the distance at that speed: the longest that a curve takes without passing its end.
    const curve = new EasedScrollCurve(0, 400, 500, 2);
    expect(curve.speedAt(0)).toBe(2);
    expect(curve.speedAt(500)).toBe(0);
    expect(curve.positionAt(500)).toBe(400);
    const positions = Array.from({ length: 501 }, (_, ms) => curve.positionAt(ms));
    for (let ms = 1; ms <= 500; ms++)
      expect(positions[ms]).toBeGreaterThanOrEqual(positions[ms - 1] - 1e-9);
    expect(Math.max(...positions)).toBeLessThanOrEqual(400 + 1e-9);
  });
});

describe('easedScrollDurationMs', () => {
  it('is longer for a longer distance, from 300 ms up to 700 ms', () => {
    expect(easedScrollDurationMs(0)).toBe(300);
    expect(easedScrollDurationMs(-400)).toBe(400);
    expect(easedScrollDurationMs(800)).toBe(500);
    expect(easedScrollDurationMs(1600)).toBe(700);
    expect(easedScrollDurationMs(10000)).toBe(700);
  });
});

describe('EasedScroll', () => {
  // A box 500 pixels high, 100 pixels below the window's top, which scrolls its content of 10,000 pixels. An element
  // 3,000 pixels below the content's top and 200 high is in the middle of what the box shows at the position 2,850.
  const middle = 2850;
  let scroller: HTMLElement;
  let reducedMotion: boolean;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
    reducedMotion = false;
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: reducedMotion && query === '(prefers-reduced-motion: reduce)' }));
    // jsdom lays nothing out, so the box and the elements tell where they are.
    scroller = document.body.appendChild(document.createElement('div'));
    scroller.style.overflowY = 'auto';
    let scrollTop = 0;
    Object.defineProperties(scroller, {
      scrollTop: { get: () => scrollTop, set: (top: number) => scrollTop = Math.min(Math.max(top, 0), 10000 - 500) },
      clientTop: { value: 0 },
      clientHeight: { value: 500 },
      scrollHeight: { value: 10000 },
    });
    scroller.getBoundingClientRect = () => box(100, 500);
  });

  afterEach(() => {
    scroller.remove();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  /** A box 300 pixels wide, at a distance from the window's top, and from its left. */
  function box(top: number, height: number, left = 0): DOMRect {
    return { top, height, bottom: top + height, left, right: left + 300, width: 300, x: left, y: top, toJSON: () => ({}) };
  }

  /** An element of the box's content, a distance below the content's top, and as wide as the box. */
  function elementAt(contentTop: number): HTMLElement {
    return movingElementAt(contentTop).element;
  }

  /** Such an element, which `moveDown` moves further down, as when what is above it grows. */
  function movingElementAt(contentTop: number): { element: HTMLElement; moveDown: (px: number) => void } {
    let top = contentTop;
    const element = scroller.appendChild(document.createElement('div'));
    element.getBoundingClientRect = () => box(100 + top - scroller.scrollTop, 200, -scroller.scrollLeft);
    return { element, moveDown: px => top += px };
  }

  /** The box's scroll positions, now and after each frame until the scroll has arrived. */
  function topsUntil(arrived: Mock): number[] {
    const tops = [scroller.scrollTop];
    while (arrived.mock.calls.length === 0 && tops.length <= 100) {
      vi.advanceTimersToNextFrame();
      tops.push(scroller.scrollTop);
    }
    return tops;
  }

  const stepsOf = (tops: number[]) => tops.slice(1).map((top, index) => top - tops[index]);

  it('scrolls an element to the middle of what its box shows, speeding up from rest and slowing down to rest', () => {
    scroller.scrollTop = 2000;
    const arrived = vi.fn();
    new EasedScroll().toMiddle(elementAt(3000), arrived);
    expect(scroller.scrollTop).toBe(2000);

    const tops = topsUntil(arrived);
    expect(tops.at(-1)).toBe(middle);
    expect(arrived).toHaveBeenCalledOnce();
    // About 510 ms, with a frame each 16 ms.
    const steps = stepsOf(tops);
    expect(steps.length).toBeGreaterThan(25);
    expect(steps.every(step => step >= 0)).toBe(true);
    const longest = Math.max(...steps);
    expect(steps[0]).toBeLessThan(longest / 10);
    expect(steps.at(-1)).toBeLessThan(longest / 10);
  });

  it('scrolls there at once when the system asks for less motion', () => {
    reducedMotion = true;
    scroller.scrollTop = 2000;
    const arrived = vi.fn();
    new EasedScroll().toMiddle(elementAt(3000), arrived);
    expect(scroller.scrollTop).toBe(middle);
    expect(arrived).toHaveBeenCalledOnce();
  });

  it.each([
    { from: 0, direction: 1 },
    { from: 9500, direction: -1 },
  ])('to an element farther than two heights of the box, from $from, shows a height at each end of the way, eased, and skips its middle', ({ from, direction }) => {
    scroller.scrollTop = from;
    const arrived = vi.fn();
    new EasedScroll().toMiddle(elementAt(3000), arrived);
    expect(scroller.scrollTop).toBe(from);

    const tops = topsUntil(arrived);
    expect(tops.at(-1)).toBe(middle);
    // Within a height of the box from either end of the way, and never between.
    expect(tops.every(top => Math.abs(top - from) <= 501 || Math.abs(top - middle) <= 501)).toBe(true);
    const steps = stepsOf(tops).map(step => direction * step);
    expect(steps.every(step => step >= 0)).toBe(true);
    // One step, halfway through, skips the middle. The others are those of an eased scroll of 1,000 pixels.
    const skip = steps.indexOf(Math.max(...steps));
    expect(steps[skip]).toBeGreaterThan(1000);
    expect(skip / steps.length).toBeCloseTo(0.5, 1);
    const others = steps.filter((_, index) => index !== skip);
    const longest = Math.max(...others);
    expect(others[0]).toBeLessThan(longest / 10);
    expect(others.at(-1)).toBeLessThan(longest / 10);
  });

  const userScrolls: { by: string; start: (element: HTMLElement) => void }[] = [
    { by: 'the wheel', start: element => element.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: -120 })) },
    { by: 'a press on the scroll bar', start: () => scroller.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })) },
    { by: 'a key in the box', start: element => element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowUp' })) },
    { by: 'a key with nothing focused', start: () => document.body.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'PageUp' })) },
  ];

  it.each(userScrolls)('stops where the user\'s own scroll takes it, by $by, and has arrived there', ({ start }) => {
    scroller.scrollTop = 2000;
    const arrived = vi.fn();
    const element = elementAt(3000);
    new EasedScroll().toMiddle(element, arrived);
    for (let frame = 0; frame < 10; frame++)
      vi.advanceTimersToNextFrame();
    expect(arrived).not.toHaveBeenCalled();

    start(element);
    expect(arrived).toHaveBeenCalledOnce();
    scroller.scrollTop -= 120; // As the browser then scrolls, between two frames.
    const takenTo = scroller.scrollTop;
    for (let frame = 0; frame < 50; frame++)
      vi.advanceTimersToNextFrame();
    expect(scroller.scrollTop).toBe(takenTo);
    // It no longer watches the user, once it has stopped.
    start(element);
    expect(arrived).toHaveBeenCalledOnce();
  });

  it('goes on through keys that do not scroll the box: Select Next\'s shortcuts, and keys pressed outside the box', () => {
    const outside = document.body.appendChild(document.createElement('button'));
    scroller.scrollTop = 2000;
    const arrived = vi.fn();
    const element = elementAt(3000);
    new EasedScroll().toMiddle(element, arrived);
    vi.advanceTimersToNextFrame();

    element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight', metaKey: true }));
    element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight', ctrlKey: true }));
    outside.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown' }));
    expect(arrived).not.toHaveBeenCalled();
    expect(topsUntil(arrived).at(-1)).toBe(middle);
    outside.remove();
  });

  it.each([
    { from: 0, direction: 1 },
    { from: 9500, direction: -1 },
  ])('to a far element, from $from, goes on when the browser moves the box as what is above it grows, and ends where the element has moved to', ({ from, direction }) => {
    scroller.scrollTop = from;
    const arrived = vi.fn();
    const { element, moveDown } = movingElementAt(3000);
    new EasedScroll().toMiddle(element, arrived);
    const tops = [scroller.scrollTop];
    while (Math.abs(scroller.scrollTop - from) <= 501) {
      vi.advanceTimersToNextFrame();
      tops.push(scroller.scrollTop);
    }

    // Once it has skipped the middle of the way, the rows above what the box shows grow by 30 pixels, as those of
    // HEIC photos do when they are made there. Chromium moves the box as much, so that what it shows stays in place.
    moveDown(30);
    scroller.scrollTop += 30;
    tops.push(scroller.scrollTop);
    const rest = topsUntil(arrived).slice(1);
    tops.push(...rest);
    expect(arrived).toHaveBeenCalledOnce();
    expect(tops.at(-1)).toBe(middle + 30);
    // The rest of the way, rather than stopping there, with no step back but the browser's.
    expect(rest.length).toBeGreaterThan(10);
    const steps = stepsOf(tops).map(step => direction * step);
    expect(steps.filter(step => step < 0)).toEqual(direction === 1 ? [] : [-30]);
  });

  it('goes to where the element has moved to, when what is between it and the box grows', () => {
    scroller.scrollTop = 2000;
    const arrived = vi.fn();
    const { element, moveDown } = movingElementAt(3000);
    new EasedScroll().toMiddle(element, arrived);
    for (let frame = 0; frame < 10; frame++)
      vi.advanceTimersToNextFrame();

    moveDown(60);
    const tops = topsUntil(arrived);
    expect(tops.at(-1)).toBe(middle + 60);
    expect(stepsOf(tops).every(step => step >= 0)).toBe(true);
  });

  it('goes on to another element from where it is and at its speed, when asked to before it has arrived', () => {
    scroller.scrollTop = 2000;
    const toFirst = vi.fn();
    const toSecond = vi.fn();
    const easedScroll = new EasedScroll();
    easedScroll.toMiddle(elementAt(3000), toFirst);
    const tops = [scroller.scrollTop];
    // About halfway, at its fastest.
    for (let frame = 0; frame < 16; frame++) {
      vi.advanceTimersToNextFrame();
      tops.push(scroller.scrollTop);
    }

    easedScroll.toMiddle(elementAt(3400), toSecond);
    tops.push(...topsUntil(toSecond).slice(1));
    expect(tops.at(-1)).toBe(3250);
    expect(toFirst).not.toHaveBeenCalled();
    expect(toSecond).toHaveBeenCalledOnce();
    // The step after the second element was asked for is about as long as the one before, rather than from rest.
    const steps = stepsOf(tops);
    expect(steps[16]).toBeGreaterThan(0.8 * steps[15]);
    expect(steps.every(step => step >= 0)).toBe(true);
  });

  it('stops without arriving when the element leaves the page, or when it is stopped', () => {
    for (const end of ['element leaves', 'stop()']) {
      scroller.scrollTop = 2000;
      const arrived = vi.fn();
      const element = elementAt(3000);
      const easedScroll = new EasedScroll();
      easedScroll.toMiddle(element, arrived);
      vi.advanceTimersToNextFrame();
      if (end === 'stop()')
        easedScroll.stop();
      else
        element.remove();
      const top = scroller.scrollTop;
      for (let frame = 0; frame < 50; frame++)
        vi.advanceTimersToNextFrame();
      expect(scroller.scrollTop, end).toBe(top);
      expect(arrived, end).not.toHaveBeenCalled();
    }
  });

  describe('asked to scroll only when the box does not show all of the element', () => {
    it('stays where it is when the box shows all of it, and has arrived at once', () => {
      scroller.scrollTop = 2800;
      const arrived = vi.fn();
      new EasedScroll().toMiddle(elementAt(3000), arrived, { evenWhenShown: false });
      expect(arrived).toHaveBeenCalledOnce();
      vi.advanceTimersToNextFrame();
      expect(scroller.scrollTop).toBe(2800);
    });

    it('scrolls an element that the box shows only a part of to the middle', () => {
      scroller.scrollTop = 2650;
      const arrived = vi.fn();
      new EasedScroll().toMiddle(elementAt(3000), arrived, { evenWhenShown: false });
      expect(arrived).not.toHaveBeenCalled();
      expect(topsUntil(arrived).at(-1)).toBe(middle);
    });

    it('judges by where a running scroll goes, which goes on there, and has arrived once it stops', () => {
      scroller.scrollTop = 2000;
      const toFirst = vi.fn();
      const toSecond = vi.fn();
      const easedScroll = new EasedScroll();
      easedScroll.toMiddle(elementAt(3000), toFirst);
      for (let frame = 0; frame < 5; frame++)
        vi.advanceTimersToNextFrame();

      // Shown where the first scroll ends, at 2,850, but not where the box is now.
      easedScroll.toMiddle(elementAt(3120), toSecond, { evenWhenShown: false });
      expect(toSecond).not.toHaveBeenCalled();
      expect(topsUntil(toSecond).at(-1)).toBe(middle);
      expect(toFirst).not.toHaveBeenCalled();
      expect(toSecond).toHaveBeenCalledOnce();
    });
  });

  it('scrolls sideways to the element when the box shows less than 32 pixels of its width, as scrollIntoView() does', () => {
    // A long name of another row makes the content wider than the box, which the user has scrolled sideways.
    let scrollLeft = 0;
    Object.defineProperties(scroller, {
      scrollLeft: { get: () => scrollLeft, set: (left: number) => scrollLeft = Math.min(Math.max(left, 0), 400) },
      clientLeft: { value: 0 },
      clientWidth: { value: 300 },
    });
    // From 260, the box shows 40 pixels of the element; from 290, 10.
    for (const [from, to] of [[200, 200], [260, 260], [290, 0], [400, 0]]) {
      scrollLeft = from;
      new EasedScroll().toMiddle(elementAt(3000), vi.fn());
      expect(scrollLeft, `from ${from}`).toBe(to);
    }
  });

  it('scrolls the element into view at once when nothing around it scrolls', () => {
    scroller.style.overflowY = 'visible';
    const element = elementAt(3000);
    element.scrollIntoView = vi.fn(); // jsdom has none.
    const arrived = vi.fn();
    new EasedScroll().toMiddle(element, arrived);
    expect(element.scrollIntoView).toHaveBeenCalledExactlyOnceWith({ block: 'center', inline: 'nearest' });
    expect(arrived).toHaveBeenCalledOnce();
  });
});
