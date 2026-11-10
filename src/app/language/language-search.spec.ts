import { foldForSearch, LanguageListItem, matchesSearch } from './language-search';

describe('The search of the list of languages (language-search.ts)', () => {
  const german: LanguageListItem = { setting: 'de', label: 'Deutsch', labelLanguage: 'de', keywords: ['German', 'ドイツ語', 'de'] };
  const czech: LanguageListItem = { setting: 'cs', label: 'Čeština', labelLanguage: 'cs', keywords: ['Czech', 'チェコ語', 'cs'] };
  const turkish: LanguageListItem = { setting: 'tr', label: 'Türkçe', labelLanguage: 'tr', keywords: ['Turkish', 'トルコ語', 'tr'] };

  it('compares texts in lower case and without diacritics', () => {
    expect(foldForSearch('Čeština')).toBe('cestina');
    expect(foldForSearch('Tiếng Việt')).toBe('tieng viet');
    expect(foldForSearch('FRANÇAIS')).toBe('francais');
    // A letter that is not one with a mark stays as it is.
    expect(foldForSearch('Norsk bokmål')).toBe('norsk bokmal');
    expect(foldForSearch('日本語')).toBe('日本語');
  });

  it('lists every entry while nothing is typed, or only spaces', () => {
    expect(matchesSearch(german, '')).toBe(true);
    expect(matchesSearch(german, '   ')).toBe(true);
  });

  it('finds an entry by any part of its label', () => {
    expect(matchesSearch(german, 'deu')).toBe(true);
    expect(matchesSearch(german, 'utsc')).toBe(true);
    expect(matchesSearch(czech, 'cest')).toBe(true);
    expect(matchesSearch(czech, 'ČEŠ')).toBe(true);
    expect(matchesSearch(turkish, 'turkce')).toBe(true);
  });

  it('finds an entry by any part of its keywords', () => {
    expect(matchesSearch(german, 'german')).toBe(true);
    expect(matchesSearch(german, 'ドイツ')).toBe(true);
    expect(matchesSearch(german, 'DE')).toBe(true);
    expect(matchesSearch(czech, 'cs')).toBe(true);
  });

  it('leaves out an entry that has what is typed nowhere', () => {
    expect(matchesSearch(german, 'french')).toBe(false);
    expect(matchesSearch(czech, 'deu')).toBe(false);
  });
});
