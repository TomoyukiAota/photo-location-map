import { defaultLanguage, isLanguageCode, LanguageCode, languageCodes, languageSettingAuto } from './languages.js';

/** Where the language can come from. */
export interface LanguageSources {
  /** The Language setting: `auto` (the operating system's language) or a language code. */
  languageSetting: string | null;
  /** The operating system's preferred languages, the most preferred first (`systemLanguages` of the startup metadata). */
  systemLanguages: readonly string[];
}

/** The language of the list with this code, however its case is written, or null. */
function listed(code: string): LanguageCode | null {
  return languageCodes.find(supported => supported.toLowerCase() === code.toLowerCase()) ?? null;
}

/** The regions that write Chinese in traditional characters: Taiwan, Hong Kong and Macao. */
const traditionalChineseRegions = ['tw', 'hk', 'mo'];

/**
 * The code of the list for a language that the list has under another code than its own, from the subtags of a tag in
 * lower case, or null.
 * - Chinese is listed by its script, while an operating system may name a region: `zh-TW`, `zh-HK` and `zh-MO` are
 *   `zh-Hant`; `zh`, `zh-CN` and any other are `zh-Hans`.
 * - Portuguese is listed by its region: `pt` alone is `pt-BR`, where most of its speakers are; a region other than
 *   Brazil (`pt-AO`) is `pt-PT`, whose spelling those regions follow.
 * - Norwegian is listed as Bokmål, `nb`: `no` is Bokmål by default, and a reader of Nynorsk, `nn`, reads Bokmål too.
 * - Serbian is listed in Latin letters, `sr-Latn`, which a reader of `sr-Cyrl` reads too.
 */
function listedUnderAnotherCode([language, ...rest]: string[]): string | null {
  switch (language) {
    case 'zh':
      return rest.some(subtag => traditionalChineseRegions.includes(subtag)) ? 'zh-Hant' : 'zh-Hans';
    case 'pt':
      return rest.length === 0 || rest.includes('br') ? 'pt-BR' : 'pt-PT';
    case 'no':
    case 'nn':
      return 'nb';
    case 'sr':
      return 'sr-Latn';
    default:
      return null;
  }
}

/**
 * The language of the list that one language tag asks for, or null. The tag is matched as it is (`pt-BR`, `zh-Hant`),
 * then without its last part, again and again (`zh-Hant-TW` is `zh-Hant`, `en-GB` is `en`), then as a language that
 * the list has under another code (`zh-TW`, `no`), without regard to case.
 */
function matchTag(tag: string): LanguageCode | null {
  const subtags = tag.toLowerCase().split('-');
  for (let length = subtags.length; length > 0; length--) {
    const code = listed(subtags.slice(0, length).join('-'));
    if (code)
      return code;
  }
  const otherCode = listedUnderAnotherCode(subtags);
  return otherCode ? listed(otherCode) : null;
}

/**
 * The supported language that a list of language tags asks for, or null: the first tag that names a language of the
 * list, in any of the ways of `matchTag`. Photo Data Viewer matches the language that this application passes it, and
 * a browser's languages, in the same way.
 */
export function matchLanguage(tags: readonly string[]): LanguageCode | null {
  for (const tag of tags) {
    const code = matchTag(tag);
    if (code)
      return code;
  }
  return null;
}

/** The language that the `auto` setting stands for: the operating system's, or English when it has no translation. */
export function systemLanguageOf(systemLanguages: readonly string[]): LanguageCode {
  return matchLanguage(systemLanguages) ?? defaultLanguage;
}

/** The language to show the application in: the Language setting unless it is `auto`, then the operating system's. */
export function resolveLanguage(sources: LanguageSources): LanguageCode {
  const setting = sources.languageSetting;
  if (setting && setting !== languageSettingAuto && isLanguageCode(setting))
    return setting;
  return systemLanguageOf(sources.systemLanguages);
}
