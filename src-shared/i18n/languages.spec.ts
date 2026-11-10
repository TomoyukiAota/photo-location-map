import { getLanguage, LanguageCode, languages } from './languages';

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
