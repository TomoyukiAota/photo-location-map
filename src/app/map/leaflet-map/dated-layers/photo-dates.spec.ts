import moment from 'moment';
import { daysBetween, nearestVersion, photoDatesOf, versionsNearDate } from './photo-dates';
import { WaybackVersion } from './wayback';

/** The versions of Wayback's imagery at the ring of EXPO 2025 at zoom 16, which ran from 2025-04-13 to 2025-10-13. */
const version = (captureDate: string | null, number: number): WaybackVersion =>
  ({ release: { number, date: '2026-01-01', metadataUrl: '' }, captureDate });
const afterClosing = version('2025-11-27', 1);
const duringTheExpo = version('2025-04-21', 2);
const construction = version('2023-09-10', 3);
const undated = version(null, 4);
const expo = [afterClosing, duringTheExpo, construction, undated];

describe('The dates of the photos on the map', () => {
  it('are the first, the last and the middle one of the photos, by when they were taken', () => {
    const dates = ['2025-08-12 09:00', '2025-08-10 11:00', '2025-08-11 18:00', '2025-08-10 15:30'].map(date => moment(date, 'YYYY-MM-DD HH:mm'));

    expect(photoDatesOf(dates)).toEqual({ first: '2025-08-10', last: '2025-08-12', middle: '2025-08-10' });
    expect(photoDatesOf(dates.slice(0, 3))).toEqual({ first: '2025-08-10', last: '2025-08-12', middle: '2025-08-11' });
    expect(photoDatesOf([])).toBeNull();
  });

  it('count days between dates, whatever their order', () => {
    expect(daysBetween('2025-08-10', '2025-11-27')).toBe(109);
    expect(daysBetween('2025-08-10', '2025-04-21')).toBe(111);
  });

  it('choose the imagery taken nearest to them, the earlier of two that are as near, and none without dates', () => {
    expect(nearestVersion(expo, '2025-08-10')).toBe(afterClosing);
    expect(nearestVersion(expo, '2025-04-15')).toBe(duringTheExpo);
    expect(nearestVersion(expo, '2024-06-15')).toBe(construction);
    expect(nearestVersion([version('2025-01-01', 5), version('2025-01-03', 6)], '2025-01-02').captureDate).toBe('2025-01-01');
    expect(nearestVersion([undated], '2025-08-10')).toBeUndefined();
  });

  it('mark the imagery taken nearest before and after them, as neither is always the right one', () => {
    expect(versionsNearDate(expo, '2025-08-10')).toEqual(new Set([duringTheExpo, afterClosing]));
    expect(versionsNearDate(expo, '2025-04-15')).toEqual(new Set([construction, duringTheExpo]));
    expect(versionsNearDate(expo, '2026-05-01')).toEqual(new Set([afterClosing]));
    expect(versionsNearDate(expo, '2020-01-01')).toEqual(new Set([construction]));
    expect(versionsNearDate(expo, '2025-04-21')).toEqual(new Set([duringTheExpo, afterClosing]));
  });
});
