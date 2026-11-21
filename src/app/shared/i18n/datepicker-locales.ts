import type { Datepicker, DatepickerLocale } from 'vanillajs-datepicker';

interface LocaleModule {
  default: Record<string, DatepickerLocale>;
}

/**
 * The locale of each language of src-shared/i18n/languages.ts (`datepickerLocale`) in vanillajs-datepicker, by its
 * name there, from which the calendar of the map's date has its names of the months and days. Each is loaded only for
 * the language that the application is in, when the calendar is first made. English is built into the datepicker.
 */
export const datepickerLocaleLoaders: Readonly<Record<string, () => Promise<LocaleModule>>> = {
  'ar': () => import('vanillajs-datepicker/locales/ar'),
  'bg': () => import('vanillajs-datepicker/locales/bg'),
  'ca': () => import('vanillajs-datepicker/locales/ca'),
  'cs': () => import('vanillajs-datepicker/locales/cs'),
  'da': () => import('vanillajs-datepicker/locales/da'),
  'de': () => import('vanillajs-datepicker/locales/de'),
  'el': () => import('vanillajs-datepicker/locales/el'),
  'es': () => import('vanillajs-datepicker/locales/es'),
  'et': () => import('vanillajs-datepicker/locales/et'),
  'eu': () => import('vanillajs-datepicker/locales/eu'),
  'fi': () => import('vanillajs-datepicker/locales/fi'),
  'fr': () => import('vanillajs-datepicker/locales/fr'),
  'gl': () => import('vanillajs-datepicker/locales/gl'),
  'he': () => import('vanillajs-datepicker/locales/he'),
  'hi': () => import('vanillajs-datepicker/locales/hi'),
  'hr': () => import('vanillajs-datepicker/locales/hr'),
  'hu': () => import('vanillajs-datepicker/locales/hu'),
  'id': () => import('vanillajs-datepicker/locales/id'),
  'it': () => import('vanillajs-datepicker/locales/it'),
  'ja': () => import('vanillajs-datepicker/locales/ja'),
  'ko': () => import('vanillajs-datepicker/locales/ko'),
  'lt': () => import('vanillajs-datepicker/locales/lt'),
  'lv': () => import('vanillajs-datepicker/locales/lv'),
  'ms': () => import('vanillajs-datepicker/locales/ms'),
  'nl': () => import('vanillajs-datepicker/locales/nl'),
  'no': () => import('vanillajs-datepicker/locales/no'),
  'pl': () => import('vanillajs-datepicker/locales/pl'),
  'pt': () => import('vanillajs-datepicker/locales/pt'),
  'pt-BR': () => import('vanillajs-datepicker/locales/pt-BR'),
  'ro': () => import('vanillajs-datepicker/locales/ro'),
  'ru': () => import('vanillajs-datepicker/locales/ru'),
  'sk': () => import('vanillajs-datepicker/locales/sk'),
  'sl': () => import('vanillajs-datepicker/locales/sl'),
  'sr-latn': () => import('vanillajs-datepicker/locales/sr-latn'),
  'sv': () => import('vanillajs-datepicker/locales/sv'),
  'th': () => import('vanillajs-datepicker/locales/th'),
  'tr': () => import('vanillajs-datepicker/locales/tr'),
  'uk': () => import('vanillajs-datepicker/locales/uk'),
  'vi': () => import('vanillajs-datepicker/locales/vi'),
  'zh-CN': () => import('vanillajs-datepicker/locales/zh-CN'),
  'zh-TW': () => import('vanillajs-datepicker/locales/zh-TW'),
};

/** Adds the locale `name` to the datepicker's locales, which its `language` option then names. */
export async function loadDatepickerLocale(datepicker: typeof Datepicker, name: string): Promise<void> {
  const load = datepickerLocaleLoaders[name];
  if (!load || name in datepicker.locales)
    return;
  Object.assign(datepicker.locales, (await load()).default);
}
