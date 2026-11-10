import type en from './locales/en.json';

/** The keys of the texts in `T`, each as its path with dots: `settings.cache.title`. */
type KeysOf<T, Prefix extends string = ''> = {
  [Key in keyof T & string]: T[Key] extends string ? `${Prefix}${Key}` : KeysOf<T[Key], `${Prefix}${Key}.`>
}[keyof T & string];

/**
 * A key of a text in locales/en.json. t() and the `t` pipe take nothing else, so that the compiler catches a
 * misspelled key: `tsc` in TypeScript, and a production build in templates, which `strictTemplates` checks.
 */
export type TranslationKey = KeysOf<typeof en>;

/** The values of the `{{placeholders}}` of a text. */
export type TranslationValues = Readonly<Record<string, string | number>>;
