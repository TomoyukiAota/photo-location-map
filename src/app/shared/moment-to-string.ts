import moment from 'moment';
import { DateFormatOption, DateTimeFormat } from '../../../src-shared/date-time/date-time-format.js';
import { currentLanguage, t } from '../../../src-shared/i18n/i18n.js';
import { getLanguage } from '../../../src-shared/i18n/languages.js';
import { currentUserSettings } from '../../../src-shared/user-settings/user-settings.js';
import './i18n/moment-locales.js';

/** moment's locale of the application's language, which the days of the week and AM and PM come from. */
const userLocale = getLanguage(currentLanguage).momentLocale;

/** How the language writes the day of the week in a date: `ddd`, its short name, or more around it, as `(ddd)`. */
const weekdayPattern = t('dateTime.weekdayPattern');

/**
 * Formats a date in a language: `locale` is moment's locale of the language, which the day of the week and AM or PM
 * come from, and `pattern` is how the language writes the day of the week, which replaces `ddd` in the format, but
 * not the first letters of `dddd`, the day's full name. The locale is set on a copy of the date, as moment's global
 * locale stays English (./i18n/moment-locales.ts).
 */
export function formatMoment(input: moment.Moment, momentJsFormatString: string, locale: string, pattern: string): string {
  return input.clone().locale(locale).format(momentJsFormatString.replace(/(?<!d)ddd(?!d)/, () => pattern));
}

/** Formats a date for the user, in the application's language. */
export function formatMomentForUser(input: moment.Moment, momentJsFormatString: string): string {
  return formatMoment(input, momentJsFormatString, userLocale, weekdayPattern);
}

export function momentToDateTimeString(input: moment.Moment, option = new DateFormatOption()): string {
  const dateFormat = currentUserSettings.dateFormat;
  const clockSystemFormat = currentUserSettings.clockSystemFormat;
  const momentJsFormatString = DateTimeFormat.ForUser.getMomentJsDateTimeFormat(dateFormat, clockSystemFormat, option);
  return formatMomentForUser(input, momentJsFormatString);
}

export function momentToDateHourMinuteString(input: moment.Moment): string {
  const dateFormat = currentUserSettings.dateFormat;
  const clockSystemFormat = currentUserSettings.clockSystemFormat;
  const momentJsFormatString = DateTimeFormat.ForUser.getMomentJsDateHourMinuteFormat(dateFormat, clockSystemFormat);
  return formatMomentForUser(input, momentJsFormatString);
}

export function momentToDateHourString(input: moment.Moment): string {
  const dateFormat = currentUserSettings.dateFormat;
  const clockSystemFormat = currentUserSettings.clockSystemFormat;
  const momentJsFormatString = DateTimeFormat.ForUser.getMomentJsDateHourFormat(dateFormat, clockSystemFormat);
  return formatMomentForUser(input, momentJsFormatString);
}

export function momentToDateString(input: moment.Moment, option = new DateFormatOption()): string {
  const dateFormat = currentUserSettings.dateFormat;
  const momentJsFormatString = DateTimeFormat.ForUser.getMomentJsDateFormat(dateFormat, option);
  return formatMomentForUser(input, momentJsFormatString);
}

/** The year and month, whose month is a name only in the `MM/DD/YYYY` format, where it stays English (date-time-format.ts). */
export function momentToYearMonthString(input: moment.Moment): string {
  const dateFormat = currentUserSettings.dateFormat;
  const momentJsFormatString = DateTimeFormat.ForUser.getMomentJsYearMonthFormat(dateFormat);
  return input.clone().locale('en').format(momentJsFormatString);
}

export function momentToYearString(input: moment.Moment): string {
  const momentJsFormatString = DateTimeFormat.ForUser.getMomentJsYearFormat();
  return input.format(momentJsFormatString);
}

export function momentToTimeString(input: moment.Moment): string {
  const clockSystemFormat = currentUserSettings.clockSystemFormat;
  const momentJsFormatString = DateTimeFormat.ForUser.getMomentJsTimeFormat(clockSystemFormat);
  return formatMomentForUser(input, momentJsFormatString);
}
