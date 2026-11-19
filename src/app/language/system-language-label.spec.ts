import { t, tIn } from '../../../src-shared/i18n/i18n';
import { systemLanguageItem, systemLanguageLabelKey } from './system-language-label';

describe('systemLanguageLabelKey', () => {
  it.each([
    ['darwin', 'Use macOS setting (English)', 'macOS の設定に従う（English）'],
    ['win32', 'Use Windows setting (English)', 'Windows の設定に従う（English）'],
    ['linux', 'Use system setting (English)', 'OS の設定に従う（English）'],
    ['freebsd', 'Use system setting (English)', 'OS の設定に従う（English）'],
  ])('on %s, gives the text "%s"', (platform, english, japanese) => {
    const key = systemLanguageLabelKey(platform);
    expect(t(key, { language: 'English' })).toBe(english);
    expect(tIn('ja', key, { language: 'English' })).toBe(japanese);
  });
});

// The tests run in English, the application's language, whatever the operating system's languages given here are.
describe('systemLanguageItem', () => {
  it('is written in the operating system\'s language, with its own name and its punctuation, in an application in another language', () => {
    expect(systemLanguageItem('darwin', ['ja-JP', 'en-US'])).toEqual({
      setting: 'auto',
      label: 'macOS の設定に従う（日本語）',
      labelLanguage: 'ja',
      labelDirection: 'ltr',
      // Its text in the application's language, by which the search finds it as well.
      keywords: ['Use macOS setting (日本語)'],
    });
  });

  it('is written from right to left in Arabic, with the name on its own between U+2068 and U+2069', () => {
    expect(systemLanguageItem('win32', ['ar-SA', 'en-US'])).toEqual({
      setting: 'auto',
      label: 'استخدام إعداد Windows (\u2068العربية\u2069)',
      labelLanguage: 'ar',
      labelDirection: 'rtl',
      keywords: ['Use Windows setting (العربية)'],
    });
  });

  it('is in the first of the operating system\'s languages that the application has', () => {
    const item = systemLanguageItem('linux', ['is-IS', 'de-DE', 'ja-JP']);
    expect([item.label, item.labelLanguage]).toEqual(['Systemeinstellung verwenden (Deutsch)', 'de']);
  });

  it('is in English, which it then stands for, where the operating system asks for no language that the application has', () => {
    expect(systemLanguageItem('linux', ['is-IS', 'cy'])).toEqual({
      setting: 'auto',
      label: 'Use system setting (English)',
      labelLanguage: 'en',
      labelDirection: 'ltr',
      keywords: ['Use system setting (English)'],
    });
    expect(systemLanguageItem('darwin', []).label).toBe('Use macOS setting (English)');
  });
});
