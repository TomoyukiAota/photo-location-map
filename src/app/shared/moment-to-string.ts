import * as moment from 'moment';
import { DateFormatOption, DateTimeFormat } from '../../../src-shared/date-time/date-time-format';
import { currentUserSettings } from '../../../src-shared/user-settings/user-settings';

export function momentToDateTimeString(input: moment.Moment, option = new DateFormatOption()): string {
  const dateFormat = currentUserSettings.dateFormat;
  const clockSystemFormat = currentUserSettings.clockSystemFormat;
  const momentJsFormatString = DateTimeFormat.ForUser.getMomentJsDateTimeFormat(dateFormat, clockSystemFormat, option);
  return input.format(momentJsFormatString);
}

export function momentToDateHourMinuteString(input: moment.Moment): string {
  const dateFormat = currentUserSettings.dateFormat;
  const clockSystemFormat = currentUserSettings.clockSystemFormat;
  const momentJsFormatString = DateTimeFormat.ForUser.getMomentJsDateHourMinuteFormat(dateFormat, clockSystemFormat);
  return input.format(momentJsFormatString);
}

export function momentToDateHourString(input: moment.Moment): string {
  const dateFormat = currentUserSettings.dateFormat;
  const clockSystemFormat = currentUserSettings.clockSystemFormat;
  const momentJsFormatString = DateTimeFormat.ForUser.getMomentJsDateHourFormat(dateFormat, clockSystemFormat);
  return input.format(momentJsFormatString);
}

export function momentToDateString(input: moment.Moment, option = new DateFormatOption()): string {
  const dateFormat = currentUserSettings.dateFormat;
  const momentJsFormatString = DateTimeFormat.ForUser.getMomentJsDateFormat(dateFormat, option);
  return input.format(momentJsFormatString);
}

export function momentToYearMonthString(input: moment.Moment): string {
  const dateFormat = currentUserSettings.dateFormat;
  const momentJsFormatString = DateTimeFormat.ForUser.getMomentJsYearMonthFormat(dateFormat);
  return input.format(momentJsFormatString);
}

export function momentToYearString(input: moment.Moment): string {
  const momentJsFormatString = DateTimeFormat.ForUser.getMomentJsYearFormat();
  return input.format(momentJsFormatString);
}

export function momentToTimeString(input: moment.Moment): string {
  const clockSystemFormat = currentUserSettings.clockSystemFormat;
  const momentJsFormatString = DateTimeFormat.ForUser.getMomentJsTimeFormat(clockSystemFormat);
  return input.format(momentJsFormatString);
}
