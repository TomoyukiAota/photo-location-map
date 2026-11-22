import { languages } from '../../../../src-shared/i18n/languages';
import { datepickerLocaleLoaders } from './datepicker-locales';

describe('The locales of the datepicker', () => {
  it('are there for each locale that a language names, but English, which the datepicker has built in', () => {
    // A language that the datepicker has no locale for names English (docs/TRANSLATING.md), whose calendar is then in
    // English.
    for (const language of languages) {
      if (language.datepickerLocale !== 'en')
        expect(datepickerLocaleLoaders, language.code).toHaveProperty([language.datepickerLocale]);
    }
  });

  it('each load the locale of their name, with the names of the months and days', async () => {
    for (const [name, load] of Object.entries(datepickerLocaleLoaders)) {
      const locale = (await load()).default[name];
      expect(locale, name).toBeDefined();
      expect(locale.months, name).toHaveLength(12);
      expect(locale.daysMin.length, name).toBeGreaterThanOrEqual(7);
    }
  });

  it('are loaded only by the languages', () => {
    const named = new Set<string>(languages.map(language => language.datepickerLocale));
    expect(Object.keys(datepickerLocaleLoaders).filter(name => !named.has(name))).toEqual([]);
  });
});
