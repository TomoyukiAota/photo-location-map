import { Moment, unitOfTime } from 'moment';
import {
  momentToDateHourMinuteString,
  momentToDateHourString,
  momentToDateString,
  momentToDateTimeString,
  momentToYearMonthString,
  momentToYearString,
} from '../shared/moment-to-string';

export type MomentToString = (moment: Moment) => string;

export const momentToStringMap = new Map<unitOfTime.DurationConstructor, MomentToString>(
  [
    ['year'  , moment => momentToYearString(moment)],
    ['month' , moment => momentToYearMonthString(moment)],
    ['day'   , moment => momentToDateString(moment, {dayOfWeek: false})],
    ['hour'  , moment => momentToDateHourString(moment)],
    ['minute', moment => momentToDateHourMinuteString(moment)],
    ['second', moment => momentToDateTimeString(moment, {dayOfWeek: false})],
  ]
);
