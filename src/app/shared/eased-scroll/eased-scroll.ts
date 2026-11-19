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
  readonly element: HTMLElement;
  readonly curve: EasedScrollCurve;
  readonly startedAt: number;
  readonly arrived: () => void;
  // The scroll position that the scroll set last, which only the user's own scroll changes before the next frame.
  lastTop: number;
  frame: number;
}

/**
 * Scrolls the box around an element so that the element comes to the middle of what the box shows, as
 * `scrollIntoView({ block: 'center' })` does, with an eased scroll (EasedScrollCurve), frame by frame.
 *
 * One scroll at a time: another one, started before this one has ended, goes on from where this one is and at its
 * speed. The user's own scroll, with the wheel, the scroll bar or the keys, stops it where the user takes it. With less
 * motion asked for in the system's settings, it scrolls there at once.
 */
export class EasedScroll {
  private running: RunningScroll | undefined;

  /**
   * Scrolls the element to the middle of the box that scrolls it, and calls `arrived` once the scroll has ended, there,
   * or where the user's own scroll stopped it. `arrived` is not called when the element leaves the page, when another
   * scroll takes this one's place, or when stop() ends it.
   */
  public toMiddle(element: HTMLElement, arrived: () => void): void {
    const now = performance.now();
    const scroller = scrollerOf(element);
    const previous = this.running;
    const speed = previous && previous.scroller === scroller ? previous.curve.speedAt(now - previous.startedAt) : 0;
    this.stop();
    if (!scroller) {
      // Nothing around it scrolls, as when what is around it shows all of it.
      element.scrollIntoView({ block: 'center', inline: 'nearest' });
      arrived();
      return;
    }

    const to = middleScrollTop(scroller, element);
    let from = scroller.scrollTop;
    if (Math.abs(to - from) < 1 || prefersReducedMotion()) {
      scroller.scrollTop = to;
      arrived();
      return;
    }
    // TL;DR: An element farther than two heights of the box is jumped to that distance first, and scrolled to from there.
    // Details: The rows of the folder tree that the scroll passes come near the sidebar's view on its way, and each one
    // makes its checkbox, thumbnail and buttons when it does, and keeps them (NearViewDirective): a scroll through a
    // folder of thousands of photos would make them all. Two heights keep the scroll long enough to be seen as one.
    let startSpeed = speed;
    const farthest = 2 * scroller.clientHeight;
    if (Math.abs(to - from) > farthest) {
      scroller.scrollTop = to - Math.sign(to - from) * farthest;
      from = scroller.scrollTop;
      startSpeed = 0;
    }
    const curve = new EasedScrollCurve(from, to, durationMs(to - from, startSpeed), startSpeed);
    this.running = {
      scroller, element, curve, arrived, startedAt: now, lastTop: from, frame: requestAnimationFrame(this.step),
    };
  }

  /** Stops the scroll where it is, without calling its `arrived`. */
  public stop(): void {
    if (this.running)
      cancelAnimationFrame(this.running.frame);
    this.running = undefined;
  }

  private readonly step = (): void => {
    const running = this.running;
    if (!running)
      return;
    const { scroller, element, curve } = running;
    if (!element.isConnected) {
      this.stop();
      return;
    }
    const elapsed = performance.now() - running.startedAt;
    const stoppedByUser = Math.abs(scroller.scrollTop - running.lastTop) >= 1;
    if (stoppedByUser || elapsed >= curve.durationMs) {
      if (!stoppedByUser)
        scroller.scrollTop = curve.to;
      this.running = undefined;
      running.arrived();
      return;
    }
    scroller.scrollTop = curve.positionAt(elapsed);
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

function prefersReducedMotion(): boolean {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}
