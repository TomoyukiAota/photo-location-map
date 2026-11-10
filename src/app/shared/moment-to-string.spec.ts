import moment from 'moment';
import { languages } from '../../../src-shared/i18n/languages';
import { formatMoment, formatMomentForUser, momentToYearMonthString } from './moment-to-string';

describe('The dates shown to the user (moment-to-string.ts)', () => {
  const afternoon = moment('2019-11-25T14:53:29');

  it('have the locale of every language loaded, which the days of the week come from', () => {
    // A locale is loaded by importing it in ./i18n/moment-locales.ts; one that is not would leave its dates in English.
    for (const language of languages)
      expect(moment.locales()).toContain(language.momentLocale);
  });

  it('are in English in the tests, as the application is', () => {
    expect(formatMomentForUser(afternoon, 'YYYY-MM-DD ddd hh:mm:ss a')).toBe('2019-11-25 Mon 02:53:29 pm');
  });

  it('write the day of the week and AM or PM in the language, the day as the language writes it', () => {
    expect(formatMoment(afternoon, 'YYYY-MM-DD ddd hh:mm:ss a', 'ja', '(ddd)')).toBe('2019-11-25 (月) 02:53:29 午後');
    expect(formatMoment(afternoon, 'DD/MM/YYYY ddd HH:mm:ss', 'ja', '(ddd)')).toBe('25/11/2019 (月) 14:53:29');
    expect(formatMoment(afternoon, 'YYYY-MM-DD ddd', 'en', 'ddd')).toBe('2019-11-25 Mon');
    // The parts of a pattern that are not the day are in brackets when they are letters.
    expect(formatMoment(afternoon, 'YYYY-MM-DD ddd', 'en', '[on] ddd')).toBe('2019-11-25 on Mon');
    // Only the short name of the day is written as the pattern says, not the first letters of its full name.
    expect(formatMoment(afternoon, 'dddd, YYYY-MM-DD ddd', 'en', '(ddd)')).toBe('Monday, 2019-11-25 (Mon)');
    expect(formatMoment(afternoon, 'dddd YYYY-MM-DD', 'ja', '(ddd)')).toBe('月曜日 2019-11-25');
  });

  it('write the date with the digits 0 to 9 in every language, as the other numbers of the application are', () => {
    // moment's own Arabic and Hindi locales write the digits of those scripts (./i18n/moment-locales.ts).
    expect(formatMoment(afternoon, 'YYYY-MM-DD ddd', 'ar', 'ddd')).toBe('2019-11-25 إثنين');
    expect(formatMoment(afternoon, 'YYYY-MM-DD ddd', 'hi', 'ddd')).toBe('2019-11-25 सोम');
    for (const language of languages) {
      const date = formatMoment(afternoon, 'YYYY-MM-DD ddd hh:mm:ss a', language.momentLocale, 'ddd');
      expect(`${language.code}: ${date.replace(/[0-9]/g, '').match(/\p{Nd}/gu)}`).toBe(`${language.code}: null`);
      expect(date.startsWith('2019-11-25 ')).toBe(true);
    }
  });

  it('leave moment\'s global locale English, and the date they are given as it was', () => {
    formatMoment(afternoon, 'ddd', 'ja', '(ddd)');
    expect(moment.locale()).toBe('en');
    expect(afternoon.locale()).toBe('en');
    expect(afternoon.format('ddd a')).toBe('Mon pm');
  });

  it('keep the month of a year and month as a number or an English name', () => {
    expect(momentToYearMonthString(afternoon)).toBe('2019-11');
  });
});
