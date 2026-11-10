import { TranslationKey } from '../../../src-shared/i18n/translation-key';

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
