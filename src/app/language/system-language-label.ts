import { t, tIn } from '../../../src-shared/i18n/i18n';
import { getLanguage, languageSettingAuto } from '../../../src-shared/i18n/languages';
import { systemLanguageOf } from '../../../src-shared/i18n/resolve-language';
import { TranslationKey } from '../../../src-shared/i18n/translation-key';
import { LanguageListItem } from './language-search';

/**
 * The text of the choice to follow the operating system's language, on `platform` (process.platform): it names macOS
 * and Windows, whose users know them by these names, and says "system" on any other.
 * TL;DR: Three whole texts, rather than one with the operating system's name filled in.
 * Details: A language may need other words around a name than around "the system", as French does with "de macOS"
 * and "du système", which a placeholder for the name could not give.
 */
export function systemLanguageLabelKey(platform: string): TranslationKey {
  switch (platform) {
    case 'darwin': return 'language.systemLanguage.mac';
    case 'win32': return 'language.systemLanguage.windows';
    default: return 'language.systemLanguage.other';
  }
}

/**
 * The first entry of the list of languages, the choice to follow the operating system's language, on `platform` with
 * `systemLanguages`, the operating system's preferred languages: written in the language that it stands for, with that
 * language's own name, whatever language the application is shown in. 「macOS の設定に従う（日本語）」 on a Mac in
 * Japanese, and "Use macOS setting (English)" on a Mac whose languages the application has none of.
 * TL;DR: Every other entry is a language under its own name, so the whole list reads the same way, and someone who
 * cannot read the application's language finds the choice of their computer's in their own words.
 * Details: The application has the texts of every language (src-shared/i18n/languages.ts), so the entry is in its
 * language from the first, without loading anything; Photo Data Viewer's entry, which follows the browser's language,
 * is written in that language as well. The search finds it by its text in the application's language too, which is
 * what a user who reads that language types: "setting" finds 「macOS の設定に従う（日本語）」 in an application in
 * English.
 */
export function systemLanguageItem(platform: string, systemLanguages: readonly string[]): LanguageListItem {
  const key = systemLanguageLabelKey(platform);
  const language = getLanguage(systemLanguageOf(systemLanguages));
  const values = { language: language.name };
  return {
    setting: languageSettingAuto,
    label: tIn(language.code, key, values),
    labelLanguage: language.code,
    labelDirection: language.direction,
    keywords: [t(key, values)],
  };
}
