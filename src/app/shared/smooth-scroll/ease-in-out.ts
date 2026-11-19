// The timing function that CSS calls `ease-in-out`, `cubic-bezier(0.42, 0, 0.58, 1)`: what it moves speeds up from a
// stop and slows down to one. The sidebar scrolls by it (SmoothScrollService), and a revealed row of the folder tree
// lights up and fades back by it (directory-tree-view.component.scss), so that both start and end alike.
// TL;DR: easeInOut(x) is how far an animation has gone, from 0 to 1, when x of its time has gone.
// Details: An animation that takes over from another one, which is still moving, starts at that one's speed rather
// than from a stop, by `initialSlope`: its speed at its start, as a multiple of its mean speed. The first control
// point of the curve is then (0.42, 0.42 × initialSlope), as Chromium makes it for a smooth scroll that gets a new
// target (EaseInOutWithInitialSlope in cc/animation/scroll_offset_animation_curve.cc). Up to maxInitialSlope, the
// curve never goes past its end.

const x1 = 0.42;
const x2 = 0.58;

/** The highest initial slope with which the curve does not go past its end: its first control point is then at 1. */
export const maxInitialSlope = 1 / x1;

/** One coordinate of the curve at its parameter s, from its two control points' coordinates; it goes from 0 to 1. */
function bezier(s: number, p1: number, p2: number): number {
  const u = 1 - s;
  return 3 * u * u * s * p1 + 3 * u * s * s * p2 + s * s * s;
}

function bezierDerivative(s: number, p1: number, p2: number): number {
  const u = 1 - s;
  return 3 * u * u * p1 + 6 * u * s * (p2 - p1) + 3 * s * s * (1 - p2);
}

/**
 * The parameter at which the curve's x is `x`. The x of this curve grows with its parameter, at 0.87 a unit at least,
 * so Newton's method settles in a few steps.
 */
function parameterAt(x: number): number {
  let s = x;
  for (let step = 0; step < 8; step++) {
    const error = bezier(s, x1, x2) - x;
    if (Math.abs(error) < 1e-9)
      break;
    s = Math.min(1, Math.max(0, s - error / bezierDerivative(s, x1, x2)));
  }
  return s;
}

/** How far the animation has gone, from 0 to 1, when `x` of its time, from 0 to 1, has gone. */
export function easeInOut(x: number, initialSlope = 0): number {
  if (x <= 0)
    return 0;
  if (x >= 1)
    return 1;
  return bezier(parameterAt(x), x1 * initialSlope, 1);
}

/** The animation's speed when `x` of its time has gone, as a multiple of its mean speed: the slope of easeInOut(). */
export function easeInOutSlope(x: number, initialSlope = 0): number {
  const s = parameterAt(Math.min(1, Math.max(0, x)));
  return bezierDerivative(s, x1 * initialSlope, 1) / bezierDerivative(s, x1, x2);
}
