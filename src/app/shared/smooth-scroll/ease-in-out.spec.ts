import { easeInOut, easeInOutSlope, maxInitialSlope } from './ease-in-out';

/** Points of CSS's ease-in-out, cubic-bezier(0.42, 0, 0.58, 1), by its parameter: what easeInOut() inverts. */
function cssEaseInOutPoints(y1 = 0): { x: number; y: number }[] {
  const at = (s: number, p1: number, p2: number) => 3 * (1 - s) ** 2 * s * p1 + 3 * (1 - s) * s ** 2 * p2 + s ** 3;
  return Array.from({ length: 21 }, (_, index) => index / 20).map(s => ({ x: at(s, 0.42, 0.58), y: at(s, y1, 1) }));
}

describe('easeInOut', () => {
  it('is CSS\'s ease-in-out: from a stop at 0 to a stop at 1, fastest in the middle, alike at both ends', () => {
    for (const { x, y } of cssEaseInOutPoints())
      expect(easeInOut(x)).toBeCloseTo(y, 9);
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(0.5)).toBeCloseTo(0.5, 9);
    expect(easeInOut(1)).toBe(1);
    for (const x of [0.1, 0.25, 0.4])
      expect(easeInOut(x) + easeInOut(1 - x)).toBeCloseTo(1, 9);
    expect(easeInOutSlope(0)).toBe(0);
    expect(easeInOutSlope(1)).toBe(0);
    expect(easeInOutSlope(0.5)).toBeCloseTo(1.5 / 0.87, 9);
  });

  it('is slow at its start and at its end: a tenth of its time goes less than a tenth of its way there', () => {
    expect(easeInOut(0.1)).toBeLessThan(0.03);
    expect(1 - easeInOut(0.9)).toBeLessThan(0.03);
    expect(easeInOut(0.6) - easeInOut(0.4)).toBeGreaterThan(0.3);
  });

  it('starts at the speed that it is given, and goes no further than its end up to the highest initial slope', () => {
    for (const initialSlope of [0.5, 1, 2, maxInitialSlope]) {
      expect(easeInOutSlope(0, initialSlope)).toBeCloseTo(initialSlope, 9);
      for (const { x, y } of cssEaseInOutPoints(0.42 * initialSlope))
        expect(easeInOut(x, initialSlope)).toBeCloseTo(y, 9);
      let previous = 0;
      for (let x = 0.01; x <= 1; x += 0.01) {
        const eased = easeInOut(x, initialSlope);
        expect(eased).toBeGreaterThanOrEqual(previous);
        expect(eased).toBeLessThanOrEqual(1);
        previous = eased;
      }
      expect(easeInOutSlope(1, initialSlope)).toBe(0);
    }
  });
});
