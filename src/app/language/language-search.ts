import { LanguageSetting } from '../../../src-shared/i18n/languages';

/** An entry of the list of languages. */
export interface LanguageListItem {
  /** The value of the Language setting that the entry stands for. */
  setting: LanguageSetting;
  /**
   * The text of the entry: a language's own name, or the choice to follow the operating system, in the operating
   * system's language.
   */
  label: string;
  /** The language that the label is written in, by which it is drawn and read aloud. */
  labelLanguage: string;
  /** The direction of that language, in which the label is laid out, whatever the application's is. */
  labelDirection: 'ltr' | 'rtl';
  /**
   * What the search finds the entry by, besides its label: for a language, its other names and its code; for the
   * choice to follow the operating system, its text in the application's language.
   */
  keywords: readonly string[];
}

/**
 * A text as the search compares it: in lower case and without diacritics, so that "cestina" finds "Čeština". The
 * characters that keep a value on its own in a language written from right to left (U+2066 to U+2069, i18n.ts),
 * which are not drawn, are left out as well, so that the first entry is found by its text as it reads.
 */
export function foldForSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f\u2066-\u2069]/g, '');
}

/** Whether an entry is listed for what is typed in the search field: any part of its label or of its keywords. */
export function matchesSearch(item: LanguageListItem, search: string): boolean {
  const sought = foldForSearch(search.trim());
  if (!sought)
    return true;
  return [item.label, ...item.keywords].some(text => foldForSearch(text).includes(sought));
}
