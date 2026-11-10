import en from './locales/en.json';
import ja from './locales/ja.json';

/**
 * The languages that the application can be shown in, in the order that the Language dialog and the Settings dialog
 * list them. To add one, see docs/TRANSLATING.md: add `locales/<code>.json` and an entry here, with the language's
 * own name and the names of its locale in moment (`moment/locale/<name>`, loaded in
 * src/app/shared/i18n/moment-locales.ts) and in Leaflet-Geoman (`SupportLocales` of its type definitions; `en` when
 * it has none).
 */
export const languages = [
  { code: 'en', name: 'English', momentLocale: 'en', geomanLocale: 'en', translation: en },
  { code: 'ja', name: '日本語', momentLocale: 'ja', geomanLocale: 'ja', translation: ja },
] as const;

export type Language = typeof languages[number];
export type LanguageCode = Language['code'];

/** English: the source of the translations, and what is shown when nothing else fits. */
export const defaultLanguage: LanguageCode = 'en';

/** The value of the Language setting that means the operating system's language. */
export const languageSettingAuto = 'auto';

/** The Language setting: the operating system's language, or one of the languages. */
export type LanguageSetting = typeof languageSettingAuto | LanguageCode;

export const languageCodes: readonly LanguageCode[] = languages.map(language => language.code);

export function isLanguageCode(code: string): code is LanguageCode {
  return (languageCodes as readonly string[]).includes(code);
}

export function isLanguageSetting(value: string): value is LanguageSetting {
  return value === languageSettingAuto || isLanguageCode(value);
}

export function getLanguage(code: LanguageCode): Language {
  const found = languages.find(language => language.code === code);
  if (!found)
    throw new Error(`"${code}" is not among the languages of the application (src-shared/i18n/languages.ts).`);
  return found;
}
