import i18next from 'i18next';
import { DevOrProd } from '../dev-or-prod/dev-or-prod';
import { startupMetadata } from '../startup/startup-metadata';
import { currentUserSettings } from '../user-settings/user-settings';
import { defaultLanguage, LanguageCode, languages } from './languages';
import { resolveLanguage, systemLanguageOf } from './resolve-language';
import type { TranslationKey, TranslationValues } from './translation-key';

// TL;DR: The texts of the application, in the language it is shown in, for both processes: t() gives a text at
// once, wherever it is called, even while a module is evaluated.
// Details: The translations are bundled (./languages.ts), and i18next is initialized here, when this module is first
// imported, so that nothing waits for a file. The language is decided once per process, from the Language setting and
// the operating system's languages, which both processes have by then: the main process imports this after the
// startup metadata and the settings' storage are set and before it builds the menu (src-main/electron-main.ts), and
// the renderer gets both from its bridge. A changed language restarts the application
// (docs/tasks/20261110_multiple-languages/PLAN.md, decision 3), so nothing has to follow a change.

/** The application's name, which is not translated: `{{appName}}` in any text. */
export const appName = 'Photo Location Map';

/** The language that the `auto` setting stands for on this computer. */
export const systemLanguage: LanguageCode = systemLanguageOf(startupMetadata().systemLanguages);

/** The language that the application is shown in, for as long as this process runs. */
export const currentLanguage: LanguageCode = resolveLanguage({
  languageSetting: currentUserSettings.language,
  systemLanguages: startupMetadata().systemLanguages,
});

const translations = i18next.createInstance();
translations.init({
  resources: Object.fromEntries(languages.map(language => [language.code, { translation: language.translation }])),
  lng: currentLanguage,
  // A text that a language's file leaves out is shown in English.
  fallbackLng: defaultLanguage,
  // With the texts given above, i18next is ready when init() returns.
  initAsync: false,
  interpolation: {
    // Every text is set as text (Angular's interpolation, innerText, a title), never as HTML, so a value such as a
    // file's name needs no escaping, and would show its entities otherwise.
    escapeValue: false,
    defaultVariables: { appName },
  },
  // A placeholder without a value is a mistake of the code: a development build and the tests fail at it, and a
  // production build shows the text with the placeholder.
  missingInterpolationHandler: (text: string, placeholder: string[]) => {
    if (DevOrProd.isDev)
      throw new Error(`The text "${text}" was shown without a value for ${placeholder[0]}.`);
    return undefined;
  },
});

/** The text of `key` in the application's language, with `values` for its `{{placeholders}}`. */
export function t(key: TranslationKey, values?: TranslationValues): string {
  return translations.t(key, { ...values });
}

/**
 * The text of `key` in `language`, whatever the application's language is: for what must be read in a language that
 * the user has just chosen, before the application restarts in it.
 */
export function tIn(language: LanguageCode, key: TranslationKey, values?: TranslationValues): string {
  return translations.t(key, { ...values, lng: language });
}
