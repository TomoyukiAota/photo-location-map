import { t, tIn } from '../../../src-shared/i18n/i18n';
import { systemLanguageLabelKey } from './system-language-label';

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
