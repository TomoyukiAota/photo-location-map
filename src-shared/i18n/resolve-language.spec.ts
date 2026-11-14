import { matchLanguage, resolveLanguage, systemLanguageOf } from './resolve-language.js';

// Icelandic and Welsh stand for the languages that the application has no translation in.
describe('matchLanguage', () => {
  it('matches a tag as it is, then without its last parts, without regard to case', () => {
    expect(matchLanguage(['ja'])).toBe('ja');
    expect(matchLanguage(['ja-JP'])).toBe('ja');
    expect(matchLanguage(['JA-jp'])).toBe('ja');
    expect(matchLanguage(['en-GB'])).toBe('en');
    expect(matchLanguage(['es-419'])).toBe('es');
    expect(matchLanguage(['fr-CA'])).toBe('fr');
    expect(matchLanguage(['pt-BR'])).toBe('pt-BR');
    expect(matchLanguage(['pt-br'])).toBe('pt-BR');
    expect(matchLanguage(['zh-Hant-TW'])).toBe('zh-Hant');
    expect(matchLanguage(['zh-Hans-CN'])).toBe('zh-Hans');
    expect(matchLanguage(['sr-Latn-RS'])).toBe('sr-Latn');
    expect(matchLanguage(['nb-NO'])).toBe('nb');
  });

  it('matches Chinese by its region when the tag names no script', () => {
    expect(matchLanguage(['zh-TW'])).toBe('zh-Hant');
    expect(matchLanguage(['zh-HK'])).toBe('zh-Hant');
    expect(matchLanguage(['zh-MO'])).toBe('zh-Hant');
    expect(matchLanguage(['zh-CN'])).toBe('zh-Hans');
    expect(matchLanguage(['zh-SG'])).toBe('zh-Hans');
    expect(matchLanguage(['zh'])).toBe('zh-Hans');
  });

  it('matches Portuguese by its region: Brazil\'s for the language alone, Portugal\'s for the other regions', () => {
    expect(matchLanguage(['pt'])).toBe('pt-BR');
    expect(matchLanguage(['pt-PT'])).toBe('pt-PT');
    expect(matchLanguage(['pt-AO'])).toBe('pt-PT');
  });

  it('matches Norwegian as Bokmål and Serbian in Latin letters, the forms that the application has', () => {
    expect(matchLanguage(['no'])).toBe('nb');
    expect(matchLanguage(['no-NO'])).toBe('nb');
    expect(matchLanguage(['nn-NO'])).toBe('nb');
    expect(matchLanguage(['sr'])).toBe('sr-Latn');
    expect(matchLanguage(['sr-RS'])).toBe('sr-Latn');
    expect(matchLanguage(['sr-Cyrl-RS'])).toBe('sr-Latn');
  });

  it('takes the first tag that has a translation', () => {
    expect(matchLanguage(['is-IS', 'ja-JP', 'en-US'])).toBe('ja');
    expect(matchLanguage(['en-US', 'ja-JP'])).toBe('en');
  });

  it('gives null when no tag has a translation', () => {
    expect(matchLanguage(['is-IS', 'cy'])).toBeNull();
    expect(matchLanguage([])).toBeNull();
    expect(matchLanguage([''])).toBeNull();
  });
});

describe('systemLanguageOf', () => {
  it('is the operating system\'s language when it has a translation, and English otherwise', () => {
    expect(systemLanguageOf(['ja-JP', 'en-US'])).toBe('ja');
    expect(systemLanguageOf(['zh-TW', 'en-US'])).toBe('zh-Hant');
    expect(systemLanguageOf(['is-IS'])).toBe('en');
    expect(systemLanguageOf([])).toBe('en');
  });
});

describe('resolveLanguage', () => {
  it('follows the operating system\'s languages while the setting is auto, or not set', () => {
    expect(resolveLanguage({ languageSetting: 'auto', systemLanguages: ['ja-JP'] })).toBe('ja');
    expect(resolveLanguage({ languageSetting: null, systemLanguages: ['ja-JP'] })).toBe('ja');
    expect(resolveLanguage({ languageSetting: 'auto', systemLanguages: ['is-IS'] })).toBe('en');
  });

  it('takes the language of the setting, whatever the operating system\'s languages are', () => {
    expect(resolveLanguage({ languageSetting: 'en', systemLanguages: ['ja-JP'] })).toBe('en');
    expect(resolveLanguage({ languageSetting: 'ja', systemLanguages: ['en-US'] })).toBe('ja');
    expect(resolveLanguage({ languageSetting: 'pt-PT', systemLanguages: ['pt-BR'] })).toBe('pt-PT');
  });

  it('follows the operating system\'s languages when the setting is not a language that the application has', () => {
    expect(resolveLanguage({ languageSetting: 'xx', systemLanguages: ['ja-JP'] })).toBe('ja');
    expect(resolveLanguage({ languageSetting: 'ja-JP', systemLanguages: ['en-US'] })).toBe('en');
  });
});
