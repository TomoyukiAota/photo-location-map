/**
 * The curve of an eased scroll: from a position, at a speed, to a position where it stops, in a given time.
 *
 * It is the curve of least jerk, a polynomial of the fifth degree whose speed and acceleration are 0 at its end. From
 * rest, it speeds up gradually and slows down gradually, its acceleration 0 at both ends too, so that it neither starts
 * nor stops with a jolt. From a speed, as when a scroll goes on to another row before it has stopped, it goes on at
 * that speed rather than starting from rest again.
 */
export class EasedScrollCurve {
  // Of the time in milliseconds from the curve's start, to the power of each one's index.
  private readonly coefficients: readonly number[];

  /** `speed` is in pixels per millisecond, toward `to` when it is of the same sign as `to - from`. */
  public constructor(
    public readonly from: number,
    public readonly to: number,
    public readonly durationMs: number,
    speed = 0,
  ) {
    const distance = to - from;
    const t = durationMs;
    this.coefficients = [
      from,
      speed,
      0,
      (20 * distance - 12 * speed * t) / (2 * t ** 3),
      (-30 * distance + 16 * speed * t) / (2 * t ** 4),
      (12 * distance - 6 * speed * t) / (2 * t ** 5),
    ];
  }

  /** The position at a time from the curve's start: `to` from its end on. */
  public positionAt(ms: number): number {
    if (ms >= this.durationMs)
      return this.to;
    const time = Math.max(ms, 0);
    return this.coefficients.reduceRight((sum, coefficient) => sum * time + coefficient, 0);
  }

  /** The speed at a time from the curve's start, in pixels per millisecond: 0 from its end on. */
  public speedAt(ms: number): number {
    if (ms >= this.durationMs)
      return 0;
    const time = Math.max(ms, 0);
    return this.coefficients.slice(1)
      .reduceRight((sum, coefficient, index) => sum * time + (index + 1) * coefficient, 0);
  }
}

/** How long an eased scroll over a distance takes: 300 ms, and 1 ms more for each 4 pixels, up to 700 ms. */
export function easedScrollDurationMs(distancePx: number): number {
  return Math.min(300 + Math.abs(distancePx) / 4, 700);
}

interface RunningScroll {
  readonly scroller: HTMLElement;
  // The scroll position where the scroll started, moved as much as anything else has moved the box since (step()),
  // and 1 when it goes down, -1 when it goes up.
  from: number;
  readonly direction: number;
  // How far it goes on screen, along which its curve goes from 0, and whether its way is longer, so that it skips the
  // middle of the way (positionOf()).
  readonly travel: number;
  readonly skips: boolean;
  readonly curve: EasedScrollCurve;
  readonly startedAt: number;
  // The element that the scroll brings to the middle.
  readonly target: HTMLElement;
  // The element to show, and what to do once the scroll has ended: the target's, or a later element's, which the
  // scroll's end shows too and which takes them over.
  element: HTMLElement;
  arrived: () => void;
  // The scroll position that the scroll set last.
  lastTop: number;
  frame: number;
  // Ends the watching of the user's own scroll (watchUserScroll()).
  readonly watching: AbortController;
}

/**
 * The scroll position of a scroll when its curve has gone `gone` of its travel, toward `to`, where its target is in
 * the middle now: the rest of the travel before `to`. A longer way starts with the first half of its travel from
 * where it started, and skips what is between at its middle, where it is at its fastest.
 */
function positionOf(scroll: Pick<RunningScroll, 'from' | 'direction' | 'travel' | 'skips'>, gone: number, to: number): number {
  const { from, direction, travel, skips } = scroll;
  return skips && gone < travel / 2 ? from + direction * gone : to - direction * (travel - gone);
}

/**
 * The keys that scroll a box up or down, with or without a modifier, as Shift+Space and Cmd+Down do. Not Left and
 * Right: Cmd+Left and Cmd+Right, Ctrl+ on Windows and Linux, are Select Previous and Select Next, which reach the page
 * first and reveal the photo that they select, going on with the scroll (src-main/menu/selection-menu.ts).
 */
const keysThatScroll = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);

/**
 * Calls `scrolled` when the user starts to scroll the box: with the wheel or the trackpad, by pressing the box or its
 * scroll bar, or with a key that scrolls, pressed in the box or with nothing else focused. Until `signal` aborts.
 * TL;DR: By what the user does, rather than by the scroll position, which the browser moves too.
 * Details: Chromium keeps what a box shows in place when what is above it changes its height (scroll anchoring), by
 * moving its scroll position as much. The row of a photo whose thumbnail fills the height of its room, as that of a
 * HEIC photo taken upright does, grows by a few pixels as the tree makes it, 3.5 on macOS. A scroll that took this for
 * the user's stopped a height before a row far down a large folder, as soon as it had skipped the middle of the way,
 * with the row below what the sidebar showed.
 */
function watchUserScroll(scroller: HTMLElement, scrolled: () => void, signal: AbortSignal): void {
  const options = { capture: true, passive: true, signal };
  scroller.addEventListener('wheel', scrolled, options);
  scroller.addEventListener('pointerdown', scrolled, options);
  const { body, documentElement } = scroller.ownerDocument;
  scroller.ownerDocument.addEventListener('keydown', ({ key, target }) => {
    if (keysThatScroll.has(key) && target instanceof Node
      && (scroller.contains(target) || target === body || target === documentElement))
      scrolled();
  }, options);
}

/**
 * Scrolls the box around an element so that the element comes to the middle of what the box shows, as
 * `scrollIntoView({ block: 'center' })` does, with an eased scroll (EasedScrollCurve), frame by frame.
 *
 * One scroll at a time: another one, started before this one has ended, goes on from where this one is and at its
 * speed. It goes to where the element is at each frame, which moves when what is above it changes its height. The
 * user's own scroll, with the wheel, the scroll bar or the keys, stops it where the user takes it
 * (watchUserScroll()). With less motion asked for in the system's settings, it scrolls there at once.
 */
export class EasedScroll {
  private running: RunningScroll | undefined;

  /**
   * Scrolls the element to the middle of the box that scrolls it, and calls `arrived` once the scroll has ended, there,
   * or where the user's own scroll stopped it. `arrived` is not called when the element leaves the page, when another
   * scroll takes this one's place, or when stop() ends it.
   * With `evenWhenShown` false, the box stays where it is when it shows all of the element there, or where the scroll
   * that is going on takes it: `arrived` is called at once, or when that scroll ends, in place of that scroll's own.
   * Sideways, the box shows the element, as `scrollIntoView({ inline: 'nearest' })` does, when it shows little or
   * nothing of the element's width: a long name makes the tree wider than the sidebar, which the user may have
   * scrolled sideways past the element.
   */
  public toMiddle(element: HTMLElement, arrived: () => void, { evenWhenShown = true }: { evenWhenShown?: boolean } = {}): void {
    const now = performance.now();
    const scroller = scrollerOf(element);
    const previous = this.running?.scroller === scroller ? this.running : undefined;
    if (scroller) {
      const left = nearestScrollLeft(scroller, element);
      if (left !== scroller.scrollLeft)
        scroller.scrollLeft = left;
    }
    // Where the box is to show the element: where the running scroll takes it, or where it is.
    if (scroller && !evenWhenShown
      && isFullyShownAt(scroller, element, previous ? middleScrollTop(scroller, previous.target) : scroller.scrollTop)) {
      if (previous) {
        previous.element = element;
        previous.arrived = arrived;
      } else {
        this.stop();
        arrived();
      }
      return;
    }
    // Downward, in pixels per millisecond.
    const speed = previous ? previous.direction * previous.curve.speedAt(now - previous.startedAt) : 0;
    this.stop();
    if (!scroller) {
      // Nothing around it scrolls, as when what is around it shows all of it.
      element.scrollIntoView({ block: 'center', inline: 'nearest' });
      arrived();
      return;
    }

    const to = middleScrollTop(scroller, element);
    const from = scroller.scrollTop;
    if (Math.abs(to - from) < 1 || prefersReducedMotion()) {
      scroller.scrollTop = to;
      arrived();
      return;
    }
    // TL;DR: Toward an element farther than two heights of the box, the scroll shows the first height of its way and
    // the last, and skips what is between at its middle, where it is at its fastest (positionOf()).
    // Details: The rows of the folder tree that the scroll passes come near the sidebar's view on its way, and each one
    // makes its checkbox, thumbnail and buttons when it does, and keeps them (NearViewDirective): a scroll through a
    // folder of thousands of photos would make them all. Shown in part, the way still starts and ends eased, and takes
    // as long as a way of two heights.
    const direction = Math.sign(to - from);
    const distance = Math.abs(to - from);
    const travel = Math.min(distance, 2 * scroller.clientHeight);
    const startSpeed = direction * speed;
    const curve = new EasedScrollCurve(0, travel, durationMs(travel, startSpeed), startSpeed);
    const watching = new AbortController();
    this.running = {
      scroller, from, direction, travel, skips: distance > travel, curve, startedAt: now, target: element, element,
      arrived, lastTop: from, watching, frame: requestAnimationFrame(this.step),
    };
    watchUserScroll(scroller, this.stopByUser, watching.signal);
  }

  /** Stops the scroll where it is, without calling its `arrived`. */
  public stop(): void {
    if (this.running) {
      cancelAnimationFrame(this.running.frame);
      this.running.watching.abort();
    }
    this.running = undefined;
  }

  /** Stops the scroll where the user's own scroll takes the box, which is where it has arrived. */
  private readonly stopByUser = (): void => {
    const running = this.running;
    this.stop();
    running?.arrived();
  };

  private readonly step = (): void => {
    const running = this.running;
    if (!running)
      return;
    const { scroller, target, element, curve } = running;
    if (!target.isConnected || !element.isConnected) {
      this.stop();
      return;
    }
    // TL;DR: The scroll goes on from wherever something else has moved the box, and to wherever the target is now.
    // Details: Chromium moves the box when what is above what it shows changes its height, by as much, so that what it
    // shows stays in place (scroll anchoring). The rows that come near the sidebar's view on the way are made then,
    // and some of them change their height (watchUserScroll()): above what the box shows, which moves the box and the
    // target alike, or between the two, which moves the target.
    running.from += scroller.scrollTop - running.lastTop;
    const to = middleScrollTop(scroller, target);
    const elapsed = performance.now() - running.startedAt;
    if (elapsed >= curve.durationMs) {
      scroller.scrollTop = to;
      this.stop();
      running.arrived();
      return;
    }
    scroller.scrollTop = positionOf(running, curve.positionAt(elapsed), to);
    running.lastTop = scroller.scrollTop;
    running.frame = requestAnimationFrame(this.step);
  };
}

/**
 * How long a scroll over a distance takes, from a speed.
 * TL;DR: Going on toward its end at a speed, the scroll is no longer than 2.5 times the distance at that speed, after
 * which its curve would pass its end and come back.
 * Details: The curve of least jerk from a speed v to rest, over a distance d in a time t, moves only toward its end
 * while v ≤ 2.5 d / t: its speed then falls from v to 0 all the way.
 */
function durationMs(distance: number, speed: number): number {
  const duration = easedScrollDurationMs(distance);
  return speed * distance > 0 ? Math.min(duration, 2.5 * distance / speed) : duration;
}

/** The nearest box around an element that scrolls it up and down, if any. */
function scrollerOf(element: HTMLElement): HTMLElement | null {
  for (let box = element.parentElement; box; box = box.parentElement) {
    const { overflowY } = getComputedStyle(box);
    if ((overflowY === 'auto' || overflowY === 'scroll') && box.scrollHeight > box.clientHeight)
      return box;
  }
  return null;
}

/**
 * The scroll position of the box at which the element's middle is in the middle of what the box shows: above its
 * horizontal scroll bar, which Windows and Linux draw below its content (clientHeight leaves it out).
 */
function middleScrollTop(scroller: HTMLElement, element: HTMLElement): number {
  const shownMiddle = scroller.getBoundingClientRect().top + scroller.clientTop + scroller.clientHeight / 2;
  const box = element.getBoundingClientRect();
  const top = scroller.scrollTop + box.top + box.height / 2 - shownMiddle;
  return Math.min(Math.max(top, 0), scroller.scrollHeight - scroller.clientHeight);
}

/** Whether the box shows all of the element's height when it is scrolled to `top`. */
function isFullyShownAt(scroller: HTMLElement, element: HTMLElement, top: number): boolean {
  const shownTop = scroller.getBoundingClientRect().top + scroller.clientTop;
  const box = element.getBoundingClientRect();
  const elementTop = scroller.scrollTop + box.top - shownTop;
  return elementTop >= top - 0.5 && elementTop + box.height <= top + scroller.clientHeight + 0.5;
}

/**
 * The horizontal scroll position at which the box shows the element, as Chromium's `scrollIntoView({ inline: 'nearest'
 * })` gives it: where the box is when it shows all of the element's width, or 32 pixels of it, and otherwise with the
 * element's side that is out of sight at the box's side. Right to left, scrollLeft counts from the right and is 0 or
 * less, which the subtractions here leave as it is.
 */
function nearestScrollLeft(scroller: HTMLElement, element: HTMLElement): number {
  const shownLeft = scroller.scrollLeft;
  const shownRight = shownLeft + scroller.clientWidth;
  const box = element.getBoundingClientRect();
  const left = shownLeft + box.left - (scroller.getBoundingClientRect().left + scroller.clientLeft);
  const right = left + box.width;
  const shownWidth = Math.min(right, shownRight) - Math.max(left, shownLeft);
  if (shownWidth >= Math.min(32, box.width, scroller.clientWidth))
    return shownLeft;
  return left < shownLeft ? left : right - scroller.clientWidth;
}

function prefersReducedMotion(): boolean {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}
