import { getLanguage, LanguageCode, languages } from './languages.js';

describe('The languages of the application (src-shared/i18n/languages.ts)', () => {
  it('are listed under their own names: those in Latin letters by the alphabet, then those in other scripts', () => {
    expect(languages.map(language => `${language.code}: ${language.name}`)).toEqual([
      'id: Bahasa Indonesia',
      'ms: Bahasa Melayu',
      'ca: Català',
      'cs: Čeština',
      'da: Dansk',
      'de: Deutsch',
      'et: Eesti',
      'en: English',
      'es: Español',
      'eu: Euskara',
      'fr: Français',
      'gl: Galego',
      'hr: Hrvatski',
      'it: Italiano',
      'lv: Latviešu',
      'lt: Lietuvių',
      'hu: Magyar',
      'nl: Nederlands',
      'nb: Norsk bokmål',
      'pl: Polski',
      'pt-BR: Português (Brasil)',
      'pt-PT: Português (Portugal)',
      'ro: Română',
      'sk: Slovenčina',
      'sl: Slovenščina',
      'sr-Latn: Srpski (latinica)',
      'fi: Suomi',
      'sv: Svenska',
      'vi: Tiếng Việt',
      'tr: Türkçe',
      'el: Ελληνικά',
      'bg: Български',
      'ru: Русский',
      'uk: Українська',
      'he: עברית',
      'ar: العربية',
      'hi: हिन्दी',
      'th: ไทย',
      'ko: 한국어',
      'ja: 日本語',
      'zh-Hans: 简体中文',
      'zh-Hant: 繁體中文',
    ]);
  });

  it('have the names in Latin letters in the order of the alphabet, whatever marks their letters have', () => {
    const latin = languages.map(language => language.name).filter(name => /^\p{Script=Latin}/u.test(name));
    expect(latin).toEqual([...latin].sort(new Intl.Collator('en').compare));
  });

  it('have an English name each, which is the name that English gives the language', () => {
    const englishNames = new Intl.DisplayNames(['en'], { type: 'language', languageDisplay: 'standard' });
    for (const language of languages)
      expect(`${language.code}: ${language.englishName}`).toBe(`${language.code}: ${englishNames.of(language.code)}`);
  });

  it('are written from left to right, but for Arabic and Hebrew', () => {
    expect(languages.filter(language => language.direction === 'rtl').map(language => language.code)).toEqual(['he', 'ar']);
  });

  it('name a locale of Leaflet-Geoman each, which is English for a language that it has no texts in', () => {
    // `SupportLocales` of the type definitions of @geoman-io/leaflet-geoman-free, whose names are its own.
    const localesOfGeoman = ['cz', 'da', 'de', 'el', 'en', 'es', 'fa', 'fi', 'fr', 'hu', 'id', 'it', 'ja', 'ko', 'ky', 'nl', 'no', 'pl',
      'pt_br', 'pt_pt', 'ro', 'ru', 'sv', 'tr', 'ua', 'zh', 'zh_tw'];
    for (const language of languages)
      expect(localesOfGeoman).toContain(language.geomanLocale);
  });
});

describe('getLanguage', () => {
  it('gives the language of a code', () => {
    for (const language of languages)
      expect(getLanguage(language.code)).toBe(language);
  });

  it('fails with a message for a code that is not among the languages', () => {
    expect(() => getLanguage('xx' as LanguageCode))
      .toThrow('"xx" is not among the languages of the application (src-shared/i18n/languages.ts).');
  });
});
