import moment from 'moment';
import { Photo } from '../../shared/model/photo.model';

/**
 * When a file was taken, as "By Date Taken" has it, in milliseconds since the epoch: the photo's DateTimeOriginal, or
 * the file's modified time when the photo has none and for a file that is not a photo (`sortByShootingTimeInfo` in the
 * locales tells the user so).
 */
export function shootingTimeOf(photo: Photo | null, modifiedTime: Date): number {
  return (photo?.exif?.dateTimeOriginal?.moment ?? moment(modifiedTime)).valueOf();
}

/** The order of two names in "By Name", ascending: by their letters, whatever their case. 0 for the same name. */
export function compareNames(a: string, b: string): number {
  const upperA = a.toUpperCase();
  const upperB = b.toUpperCase();
  return upperA < upperB ? -1 : upperA > upperB ? 1 : 0;
}

/** What "By Date Taken" orders a file by. */
export interface ShootingTimeSortKey {
  /** When the file was taken: shootingTimeOf(). */
  readonly shootingTime: number;
  readonly name: string;
}

/**
 * The order of two files in "By Date Taken", ascending: the one taken earlier first, and by name, as "By Name" orders
 * them, when they were taken at the same time, as photos of a burst often are.
 */
export function compareByShootingTime(a: ShootingTimeSortKey, b: ShootingTimeSortKey): number {
  return (a.shootingTime - b.shootingTime) || compareNames(a.name, b.name);
}
