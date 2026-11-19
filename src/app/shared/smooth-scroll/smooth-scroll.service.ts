import { Service } from '@angular/core';
import { easeInOut, easeInOutSlope, maxInitialSlope } from './ease-in-out';

/** How far a smooth scroll goes on screen at most, in views of the box: four of the sidebar, about twelve rows. */
const maxTravelInViews = 4;

/**
 * How long a smooth scroll takes, by how far it goes on screen, in pixels: longer the further it goes, by the square
 * root of it, as Chromium's own smooth scroll does, from 0.3 s for a row to 0.65 s for two views of the sidebar.
 */
export function smoothScrollDurationMs(travelPx: number): number {
  return Math.min(650, Math.max(300, 200 + 12 * Math.sqrt(travelPx)));
}

/** A smooth scroll of a box, which goes from `from` to `to` of its scrollTop. */
interface Scroll {
  readonly box: HTMLElement;
  readonly from: number;
  readonly to: number;
  /** How far it goes on screen: the whole way, or maxTravelInViews of the box when it is a longer way. */
  readonly travel: number;
  readonly durationMs: number;
  readonly initialSlope: number;
  /** When it started, by performance.now(), whose time a frame of requestAnimationFrame() has too. */
  readonly startMs: number;
  frame: number;
}

/**
 * Where a smooth scroll is when `eased` of its way has gone (easeInOut()): all the way along, when it goes no
 * further than its travel. A longer way is the first and the last halves of its travel, with what is between skipped
 * at its middle, where it is at its fastest, so that the rows of the folder tree between them are not made
 * (NearViewDirective) for the moment that they would be shown.
 */
export function smoothScrollPosition(scroll: Pick<Scroll, 'from' | 'to' | 'travel'>, eased: number): number {
  const { from, to, travel } = scroll;
  const direction = Math.sign(to - from);
  const gone = travel * eased;
  if (travel >= Math.abs(to - from))
    return from + direction * gone;
  return gone < travel / 2 ? from + direction * gone : to - direction * (travel - gone);
}

/** The box that the element scrolls in: the nearest one above it that can scroll down, or null for none. */
function scrollingBoxOf(element: HTMLElement): HTMLElement | null {
  for (let box = element.parentElement; box; box = box.parentElement) {
    const overflowY = getComputedStyle(box).overflowY;
    if ((overflowY === 'auto' || overflowY === 'scroll') && box.scrollHeight > box.clientHeight)
      return box;
  }
  return null;
}

/** Where the element is in what the box scrolls, from its top, as the box's scrollTop goes. */
function boundsIn(box: HTMLElement, element: HTMLElement): { top: number; bottom: number } {
  const shownTop = box.getBoundingClientRect().top + box.clientTop;
  const bounds = element.getBoundingClientRect();
  const top = bounds.top - shownTop + box.scrollTop;
  return { top, bottom: top + bounds.height };
}

function prefersReducedMotion(): boolean {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/**
 * Scrolls the sidebar to a row of the folder tree, smoothly: it speeds up from a stop and slows down to one, by the
 * timing function that CSS calls ease-in-out (ease-in-out.ts).
 * TL;DR: One scroll at a time. Another one takes over from the one that is going on, at its speed, and a gesture
 * that scrolls, a click or a key in the box ends it where it is.
 * Details: The page scrolls the box by a frame of requestAnimationFrame() each, rather than by Chromium's smooth
 * scroll (`behavior: 'smooth'`), whose length and timing function a page cannot choose: Chromium's scrolls by
 * ease-in-out too, but takes at most a fixed time, which its features set, whatever the distance is. A way longer
 * than four views of the box is shown in part (smoothScrollPosition()). With the system's setting to reduce motion,
 * the box goes to its place at once.
 */
@Service()
export class SmoothScrollService {
  private scroll: Scroll | null = null;
  /** What to do once the box has stopped scrolling: show the row that it has scrolled to. */
  private whenStopped: (() => void) | null = null;

  /** A gesture or a click in the box, which takes the scroll over. */
  private readonly endByInput = () => this.end();
  /**
   * A key in the box, which may move the focus or scroll the box. A key with Ctrl or Cmd is a shortcut of the
   * application, as Select Next's, which goes on from where the box is.
   */
  private readonly endByKey = (event: KeyboardEvent) => {
    if (!event.ctrlKey && !event.metaKey && !['Alt', 'Control', 'Meta', 'Shift'].includes(event.key))
      this.end();
  };

  /**
   * Scrolls the box that the element is in so that the element is in the middle of what the box shows: always when
   * `evenWhenShown`, and otherwise only when the box will not show all of it, where it is or where it is scrolling to.
   * Calls `whenStopped` once the box is there: at once when it does not scroll, when the scroll that is going on ends,
   * or when this one ends. Another call takes over from this one, and its `whenStopped` from this one's.
   */
  public scrollToMiddle(element: HTMLElement, options: { evenWhenShown: boolean }, whenStopped: () => void): void {
    const box = scrollingBoxOf(element);
    if (this.scroll && this.scroll.box !== box)
      this.stop();
    this.whenStopped = whenStopped;
    if (!box) {
      this.end();
      return;
    }
    const heading = this.scroll?.to ?? box.scrollTop;
    const { top, bottom } = boundsIn(box, element);
    const isShown = top >= heading - 0.5 && bottom <= heading + box.clientHeight + 0.5;
    const maxScrollTop = box.scrollHeight - box.clientHeight;
    const middle = Math.min(maxScrollTop, Math.max(0, (top + bottom - box.clientHeight) / 2));
    if ((isShown && !options.evenWhenShown) || Math.abs(middle - heading) < 0.5) {
      // Where the box is, or where the scroll that is going on ends.
      if (!this.scroll)
        this.end();
      return;
    }
    this.start(box, middle);
  }

  /** Stops the scroll that is going on where it is, without what was to follow it, as when the tree goes. */
  public stop(): void {
    this.whenStopped = null;
    this.end();
  }

  private start(box: HTMLElement, to: number): void {
    const startMs = performance.now();
    const from = box.scrollTop;
    const travel = Math.min(Math.abs(to - from), maxTravelInViews * box.clientHeight);
    if (prefersReducedMotion() || travel < 0.5) {
      box.scrollTop = to;
      this.end();
      return;
    }
    const taken = this.scroll;
    if (taken)
      cancelAnimationFrame(taken.frame);
    else
      this.listen(box);
    const durationMs = smoothScrollDurationMs(travel);
    // The speed of the scroll that this one takes over from, in pixels a millisecond, toward where this one goes.
    const speed = taken ? this.speedOf(taken, startMs) * Math.sign(to - from) : 0;
    const initialSlope = Math.min(maxInitialSlope, Math.max(0, speed * durationMs / travel));
    this.scroll = { box, from, to, travel, durationMs, initialSlope, startMs, frame: 0 };
    this.scroll.frame = requestAnimationFrame(frameMs => this.step(frameMs));
  }

  private step(frameMs: number): void {
    const scroll = this.scroll;
    if (!scroll)
      return;
    const x = Math.min(1, Math.max(0, (frameMs - scroll.startMs) / scroll.durationMs));
    scroll.box.scrollTop = smoothScrollPosition(scroll, easeInOut(x, scroll.initialSlope));
    if (x < 1)
      scroll.frame = requestAnimationFrame(nextFrameMs => this.step(nextFrameMs));
    else
      this.end();
  }

  /** The scroll's speed at the time, in pixels a millisecond, positive downward. */
  private speedOf(scroll: Scroll, timeMs: number): number {
    const x = (timeMs - scroll.startMs) / scroll.durationMs;
    if (x >= 1)
      return 0;
    const slope = easeInOutSlope(Math.max(0, x), scroll.initialSlope);
    return Math.sign(scroll.to - scroll.from) * scroll.travel * slope / scroll.durationMs;
  }

  /** Ends the scroll that is going on, where it is, and does what was to follow it. */
  private end(): void {
    const scroll = this.scroll;
    if (scroll) {
      cancelAnimationFrame(scroll.frame);
      this.unlisten(scroll.box);
      this.scroll = null;
    }
    const whenStopped = this.whenStopped;
    this.whenStopped = null;
    whenStopped?.();
  }

  private listen(box: HTMLElement): void {
    for (const type of ['wheel', 'touchstart', 'pointerdown'])
      box.addEventListener(type, this.endByInput, { passive: true });
    box.addEventListener('keydown', this.endByKey);
  }

  private unlisten(box: HTMLElement): void {
    for (const type of ['wheel', 'touchstart', 'pointerdown'])
      box.removeEventListener(type, this.endByInput);
    box.removeEventListener('keydown', this.endByKey);
  }
}
