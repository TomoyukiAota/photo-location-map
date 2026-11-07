import { Moment, unitOfTime } from 'moment';
import { Photo } from '../shared/model/photo.model';
import { momentToStringMap } from '../shared/moment-to-string-map';
import { xAxisUnit } from './config/date-time-taken-chart-x-axis-unit';

export interface DateTimeTakenChartData {
  /** One label per unit of time from the first photo to the last, such as the days between them. */
  readonly xData: string[];
  /** How many photos were taken in each unit of time of xData. */
  readonly yData: number[];
  /** False when the photos span more than the unit can show: 30 days for hours, 3 days for minutes, 1 hour for seconds. */
  readonly isSupportedDuration: boolean;
}

/** Counts the photos that have a shooting time by the unit of time of the chart's x-axis. */
export function createDateTimeTakenChartData(photos: readonly Photo[], unit: unitOfTime.DurationConstructor): DateTimeTakenChartData {
  const photosWithDateTime = photos.filter(photo => photo?.exif?.dateTimeOriginal);
  if (photosWithDateTime.length === 0) {
    return { xData: [], yData: [], isSupportedDuration: true }; // Results in the chart without data
  }

  const moments = photosWithDateTime.map(photo => photo.exif.dateTimeOriginal.moment.clone()); // Cloned to be sure of not modifying original ones
  const sortedMoments = moments.sort((a, b) => a.diff(b));
  const firstMoment = sortedMoments[0];
  const lastMoment = sortedMoments[sortedMoments.length - 1];

  if (!isSupportedDuration(firstMoment, lastMoment, unit)) {
    return { xData: [], yData: [], isSupportedDuration: false }; // Results in the chart without data
  }

  const momentToString = momentToStringMap.get(unit);
  const loopLimitMoment = lastMoment.clone().add(1, unit);
  const bins = new Map<string, number>(); // <string, number> as (x, y) coordinate in the chart.
  for (let tempMoment = firstMoment.clone(); tempMoment.isBefore(loopLimitMoment, unit); tempMoment.add(1, unit)) {
    bins.set(momentToString(tempMoment), 0); // Initialize the bin with (x, y) = (xValue, 0)
  }
  sortedMoments.forEach(sortedMoment => {
    const momentString = momentToString(sortedMoment);
    if (bins.has(momentString)) {
      bins.set(momentString, bins.get(momentString) + 1);
    }
  });
  return { xData: Array.from(bins.keys()), yData: Array.from(bins.values()), isSupportedDuration: true };
}

function isSupportedDuration(firstMoment: Moment, lastMoment: Moment, unit: unitOfTime.DurationConstructor): boolean {
  if (unit === xAxisUnit.hour.momentJsStr) {
    return lastMoment.diff(firstMoment, 'day') <= 30;
  }
  if (unit === xAxisUnit.minute.momentJsStr) {
    return lastMoment.diff(firstMoment, 'day') <= 3;
  }
  if (unit === xAxisUnit.second.momentJsStr) {
    return lastMoment.diff(firstMoment, 'hour') <= 1;
  }
  return true;
}
