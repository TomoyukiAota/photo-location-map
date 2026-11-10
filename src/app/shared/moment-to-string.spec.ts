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
