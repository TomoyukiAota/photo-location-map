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
  // The scroll positions where the scroll starts and ends, and 1 when it goes down, -1 when it goes up.
  readonly from: number;
  readonly to: number;
  readonly direction: number;
  // How far it goes on screen (wayShown()), along which its curve goes from 0.
  readonly travel: number;
  readonly curve: EasedScrollCurve;
  readonly startedAt: number;
  // The element to show, and what to do once the scroll has ended, which a later element that the scroll's end shows
  // takes over.
  element: HTMLElement;
  arrived: () => void;
  // The scroll position that the scroll set last, which only the user's own scroll changes before the next frame.
  lastTop: number;
  frame: number;
}

/**
 * The scroll position of a scroll when its curve has gone `gone` of its travel: all the way along, when the scroll
 * goes no further than its travel. A longer way is the first and the last halves of its travel, with what is between
 * skipped at its middle, where it is at its fastest.
 */
function positionOf(scroll: Pick<RunningScroll, 'from' | 'to' | 'direction' | 'travel'>, gone: number): number {
  const { from, to, direction, travel } = scroll;
  return gone < travel / 2 ? from + direction * gone : to - direction * (travel - gone);
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
    if (scroller && !evenWhenShown && isFullyShownAt(scroller, element, previous?.to ?? scroller.scrollTop)) {
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
    const travel = Math.min(Math.abs(to - from), 2 * scroller.clientHeight);
    const startSpeed = direction * speed;
    const curve = new EasedScrollCurve(0, travel, durationMs(travel, startSpeed), startSpeed);
    this.running = {
      scroller, from, to, direction, travel, curve, element, arrived, startedAt: now, lastTop: from,
      frame: requestAnimationFrame(this.step),
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
        scroller.scrollTop = running.to;
      this.running = undefined;
      running.arrived();
      return;
    }
    scroller.scrollTop = positionOf(running, curve.positionAt(elapsed));
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
