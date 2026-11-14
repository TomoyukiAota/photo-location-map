import { currentLanguage, systemLanguage, t, tIn } from './i18n.js';

// The tests run in English: the bridge's stand-in gives en-US as the operating system's language
// (test/angular/bridge-double.ts), and no Language setting is saved.
describe('The texts of the application (src-shared/i18n/i18n.ts)', () => {
  it('are in the language of the operating system while the Language setting is auto', () => {
    expect(systemLanguage).toBe('en');
    expect(currentLanguage).toBe('en');
    expect(t('common.close')).toBe('Close');
  });

  it('take the values of their placeholders, and the application\'s name without being given it', () => {
    expect(t('loadedFiles.loaded', { count: 5 })).toBe('Loaded 5 files.');
    expect(t('menu.app.about')).toBe('About Photo Location Map');
  });

  it('are not escaped: they are set as text, never as HTML', () => {
    expect(t('directoryTree.openedFolder', { path: '/photos/<2019> & "trips"' })).toBe('Opened Folder - /photos/<2019> & "trips"');
  });

  it('can be asked for in another language than the application\'s', () => {
    expect(tIn('ja', 'common.close')).toBe('閉じる');
    expect(tIn('ja', 'loadedFiles.loaded', { count: 5 })).toBe('5 個のファイルを読み込みました。');
    expect(tIn('en', 'common.close')).toBe('Close');
  });

  it('keep each value on its own in a language written from right to left, so that it keeps its order there', () => {
    // U+2068 and U+2069, which are not drawn, are around the value.
    expect(tIn('ar', 'directoryTree.openedFolder', { path: '/photos/2019' })).toBe('المجلد المفتوح - \u2068/photos/2019\u2069');
    expect(tIn('he', 'appInfo.version', { version: '1.2.3' })).toBe('גרסה \u20681.2.3\u2069');
    // The name of the application is not a value that the caller gives.
    expect(tIn('ar', 'menu.app.about')).toBe('حول Photo Location Map');
  });

  it('add nothing to a value in a language written from left to right', () => {
    expect(tIn('ja', 'appInfo.version', { version: '1.2.3' })).toBe('バージョン 1.2.3');
    expect(t('appInfo.version', { version: '1.2.3' })).toBe('Version 1.2.3');
  });
});
