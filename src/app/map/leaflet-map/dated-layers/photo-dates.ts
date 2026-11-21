import type { Moment } from 'moment';
import type { WaybackVersion } from './wayback';

/**
 * When the photos on the map were taken: the first and the last of them, and the middle one, which a map of a past
 * date is matched to. Dates are YYYY-MM-DD, as the photos' own clocks wrote them.
 */
export interface PhotoDates {
  readonly first: string;
  readonly last: string;
  readonly middle: string;
}

/** The dates of these photos, or null when none has a date. */
export function photoDatesOf(dates: readonly Moment[]): PhotoDates | null {
  if (dates.length === 0)
    return null;
  const sorted = [...dates].sort((a, b) => a.valueOf() - b.valueOf());
  const day = (moment: Moment) => moment.format('YYYY-MM-DD');
  return { first: day(sorted[0]), last: day(sorted.at(-1)), middle: day(sorted[Math.floor((sorted.length - 1) / 2)]) };
}

/** The days between two dates, YYYY-MM-DD, whatever their order. */
export function daysBetween(a: string, b: string): number {
  return Math.abs(Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000;
}

/**
 * The version of the imagery taken nearest to a date, the earlier of two that are as near: what the map shows when it
 * matches the photos' dates. Undefined when no version has a date.
 */
export function nearestVersion(versions: readonly WaybackVersion[], date: string): WaybackVersion | undefined {
  let nearest: WaybackVersion | undefined;
  for (const version of versions) {
    if (version.captureDate === null)
      continue;
    const distance = daysBetween(version.captureDate, date);
    const nearestDistance = nearest ? daysBetween(nearest.captureDate, date) : Infinity;
    if (distance < nearestDistance || (distance === nearestDistance && version.captureDate < nearest.captureDate))
      nearest = version;
  }
  return nearest;
}

/**
 * The versions that the list marks as near the photos' dates: the last one taken on or before the photos' middle
 * date, and the first one taken after it.
 * TL;DR: Both, as neither is always the right one.
 * Details: At the ring of EXPO 2025, the imagery was taken on 2023-09-10, 2025-04-21 and 2025-11-27, and the Expo ran
 * from 2025-04-13 to 2025-10-13: for a photo of 2025-08-10, the nearest imagery is that of 2025-11-27, after the Expo
 * closed, and the one before it is that of the Expo; for a photo of 2025-04-15, the one before is of the construction,
 * and the one after is of the Expo.
 */
export function versionsNearDate(versions: readonly WaybackVersion[], date: string): Set<WaybackVersion> {
  const dated = versions.filter(version => version.captureDate !== null);
  const before = dated.filter(version => version.captureDate <= date).sort((a, b) => b.captureDate.localeCompare(a.captureDate))[0];
  const after = dated.filter(version => version.captureDate > date).sort((a, b) => a.captureDate.localeCompare(b.captureDate))[0];
  return new Set([before, after].filter(Boolean));
}
