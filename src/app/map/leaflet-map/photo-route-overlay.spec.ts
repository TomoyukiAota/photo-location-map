import * as leaflet from 'leaflet';
import { photoRouteArrowheads } from './photo-route-overlay';

describe('photoRouteArrowheads', () => {
  const viewport = leaflet.bounds([0, 0], [640, 360]);

  beforeEach(() => vi.stubGlobal('L', leaflet));
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('spaces arrows along a route whose individual segments are short', () => {
    const points = Array.from({ length: 41 }, (_, index) => leaflet.point(index * 10 + 50, 180));
    const arrows = photoRouteArrowheads(points, viewport);

    expect(arrows.length).toBeGreaterThanOrEqual(2);
    for (const [firstWing, tip, secondWing] of arrows) {
      expect(tip.x).toBeGreaterThan(Math.max(firstWing.x, secondWing.x));
      expect(tip.y).toBeCloseTo(180);
    }

    const reversedArrows = photoRouteArrowheads([...points].reverse(), viewport);
    expect(reversedArrows).toHaveLength(arrows.length);
    for (const [firstWing, tip, secondWing] of reversedArrows)
      expect(tip.x).toBeLessThan(Math.min(firstWing.x, secondWing.x));
  });

  it('builds only arrows near the viewport on a segment that is mostly offscreen', () => {
    const points = [leaflet.point(-1_000_000_000, 180), leaflet.point(1_000_000_000, 180)];
    const multiplyBy = leaflet.Point.prototype.multiplyBy;
    let pointScales = 0;
    vi.spyOn(leaflet.Point.prototype, 'multiplyBy').mockImplementation(function (scale) {
      if (++pointScales > 100)
        throw new Error('Arrow construction went beyond the visible part of the segment.');
      return multiplyBy.call(this, scale);
    });

    const arrows = photoRouteArrowheads(points, viewport);

    expect(arrows.length).toBeGreaterThanOrEqual(2);
    expect(arrows.length).toBeLessThanOrEqual(6);
    for (const [, tip] of arrows) {
      // The tip may extend a few pixels beyond an arrow's position on the line.
      expect(tip.x).toBeGreaterThanOrEqual(-12);
      expect(tip.x).toBeLessThanOrEqual(652);
      expect(tip.y).toBeCloseTo(180);
    }
  });

  it('draws no arrows along a short route, even with coincident points', () => {
    const origin = leaflet.point(100, 180);
    const points = [origin, origin.clone(), leaflet.point(150, 180)];

    expect(photoRouteArrowheads(points, viewport)).toEqual([]);
  });
});
