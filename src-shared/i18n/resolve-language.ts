import { defaultLanguage, isLanguageCode, LanguageCode, languageCodes, languageSettingAuto } from './languages';

/** Where the language can come from. */
export interface LanguageSources {
  /** The Language setting: `auto` (the operating system's language) or a language code. */
  languageSetting: string | null;
  /** The operating system's preferred languages, the most preferred first (`systemLanguages` of the startup metadata). */
  systemLanguages: readonly string[];
}

/**
 * The supported language that a list of language tags asks for, or null. Each tag is matched as it is (`pt-BR`) and
 * then by its language alone (`pt`) before the next tag is tried, without regard to case. Photo Data Viewer matches
 * the language that this application passes it in the same way.
 */
export function matchLanguage(tags: readonly string[]): LanguageCode | null {
  for (const tag of tags) {
    for (const candidate of [tag, tag.split('-')[0]]) {
      const code = languageCodes.find(supported => supported.toLowerCase() === candidate.toLowerCase());
      if (code)
        return code;
    }
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
