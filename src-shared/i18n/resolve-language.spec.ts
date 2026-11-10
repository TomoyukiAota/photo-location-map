import { matchLanguage, resolveLanguage, systemLanguageOf } from './resolve-language';

describe('matchLanguage', () => {
  it('matches a tag as it is, then by its language alone, without regard to case', () => {
    expect(matchLanguage(['ja'])).toBe('ja');
    expect(matchLanguage(['ja-JP'])).toBe('ja');
    expect(matchLanguage(['JA-jp'])).toBe('ja');
    expect(matchLanguage(['en-GB'])).toBe('en');
  });

  it('takes the first tag that has a translation', () => {
    expect(matchLanguage(['fr-CA', 'ja-JP', 'en-US'])).toBe('ja');
    expect(matchLanguage(['en-US', 'ja-JP'])).toBe('en');
  });

  it('gives null when no tag has a translation', () => {
    expect(matchLanguage(['fr-CA', 'de'])).toBeNull();
    expect(matchLanguage([])).toBeNull();
    expect(matchLanguage([''])).toBeNull();
  });
});

describe('systemLanguageOf', () => {
  it('is the operating system\'s language when it has a translation, and English otherwise', () => {
    expect(systemLanguageOf(['ja-JP', 'en-US'])).toBe('ja');
    expect(systemLanguageOf(['fr-FR'])).toBe('en');
    expect(systemLanguageOf([])).toBe('en');
  });
});

describe('resolveLanguage', () => {
  it('follows the operating system\'s languages while the setting is auto, or not set', () => {
    expect(resolveLanguage({ languageSetting: 'auto', systemLanguages: ['ja-JP'] })).toBe('ja');
    expect(resolveLanguage({ languageSetting: null, systemLanguages: ['ja-JP'] })).toBe('ja');
    expect(resolveLanguage({ languageSetting: 'auto', systemLanguages: ['fr-FR'] })).toBe('en');
  });

  it('takes the language of the setting, whatever the operating system\'s languages are', () => {
    expect(resolveLanguage({ languageSetting: 'en', systemLanguages: ['ja-JP'] })).toBe('en');
    expect(resolveLanguage({ languageSetting: 'ja', systemLanguages: ['en-US'] })).toBe('ja');
  });

  it('follows the operating system\'s languages when the setting is not a language that the application has', () => {
    expect(resolveLanguage({ languageSetting: 'xx', systemLanguages: ['ja-JP'] })).toBe('ja');
    expect(resolveLanguage({ languageSetting: 'ja-JP', systemLanguages: ['en-US'] })).toBe('en');
  });
});
