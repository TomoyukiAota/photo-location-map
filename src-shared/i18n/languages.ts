import ar from './locales/ar.json' with { type: 'json' };
import bg from './locales/bg.json' with { type: 'json' };
import ca from './locales/ca.json' with { type: 'json' };
import cs from './locales/cs.json' with { type: 'json' };
import da from './locales/da.json' with { type: 'json' };
import de from './locales/de.json' with { type: 'json' };
import el from './locales/el.json' with { type: 'json' };
import en from './locales/en.json' with { type: 'json' };
import es from './locales/es.json' with { type: 'json' };
import et from './locales/et.json' with { type: 'json' };
import eu from './locales/eu.json' with { type: 'json' };
import fi from './locales/fi.json' with { type: 'json' };
import fr from './locales/fr.json' with { type: 'json' };
import gl from './locales/gl.json' with { type: 'json' };
import he from './locales/he.json' with { type: 'json' };
import hi from './locales/hi.json' with { type: 'json' };
import hr from './locales/hr.json' with { type: 'json' };
import hu from './locales/hu.json' with { type: 'json' };
import id from './locales/id.json' with { type: 'json' };
import it from './locales/it.json' with { type: 'json' };
import ja from './locales/ja.json' with { type: 'json' };
import ko from './locales/ko.json' with { type: 'json' };
import lt from './locales/lt.json' with { type: 'json' };
import lv from './locales/lv.json' with { type: 'json' };
import ms from './locales/ms.json' with { type: 'json' };
import nb from './locales/nb.json' with { type: 'json' };
import nl from './locales/nl.json' with { type: 'json' };
import pl from './locales/pl.json' with { type: 'json' };
import ptBR from './locales/pt-BR.json' with { type: 'json' };
import ptPT from './locales/pt-PT.json' with { type: 'json' };
import ro from './locales/ro.json' with { type: 'json' };
import ru from './locales/ru.json' with { type: 'json' };
import sk from './locales/sk.json' with { type: 'json' };
import sl from './locales/sl.json' with { type: 'json' };
import srLatn from './locales/sr-Latn.json' with { type: 'json' };
import sv from './locales/sv.json' with { type: 'json' };
import th from './locales/th.json' with { type: 'json' };
import tr from './locales/tr.json' with { type: 'json' };
import uk from './locales/uk.json' with { type: 'json' };
import vi from './locales/vi.json' with { type: 'json' };
import zhHans from './locales/zh-Hans.json' with { type: 'json' };
import zhHant from './locales/zh-Hant.json' with { type: 'json' };

/**
 * The languages that the application can be shown in, in the order that the Language dialog and the Settings dialog
 * list them: the names in Latin letters by the alphabet, then those in other scripts. They are the languages that
 * Windows or macOS is fully translated into, and the same ones as Photo Data Viewer's, which is shown in the
 * application's language. To add one, see docs/TRANSLATING.md: add `locales/<code>.json` and an entry here.
 *
 * - `name` is the language's own name, written as macOS lists it, which the lists show. `englishName` is what the
 *   search of the lists also finds it by.
 * - `direction` is `rtl` for a language written from right to left, which the page is then laid out in
 *   (src/start-app.ts).
 * - `momentLocale` is its locale in moment (`moment/locale/<name>`, loaded in src/app/shared/i18n/moment-locales.ts).
 * - `geomanLocale` is its locale in Leaflet-Geoman (`SupportLocales` of its type definitions), or `en` when it has
 *   none: the tooltips while a region is drawn are then in English.
 */
export const languages = [
  { code: 'id', name: 'Bahasa Indonesia', englishName: 'Indonesian', direction: 'ltr', momentLocale: 'id', geomanLocale: 'id', translation: id },
  { code: 'ms', name: 'Bahasa Melayu', englishName: 'Malay', direction: 'ltr', momentLocale: 'ms', geomanLocale: 'en', translation: ms },
  { code: 'ca', name: 'Català', englishName: 'Catalan', direction: 'ltr', momentLocale: 'ca', geomanLocale: 'en', translation: ca },
  { code: 'cs', name: 'Čeština', englishName: 'Czech', direction: 'ltr', momentLocale: 'cs', geomanLocale: 'cz', translation: cs },
  { code: 'da', name: 'Dansk', englishName: 'Danish', direction: 'ltr', momentLocale: 'da', geomanLocale: 'da', translation: da },
  { code: 'de', name: 'Deutsch', englishName: 'German', direction: 'ltr', momentLocale: 'de', geomanLocale: 'de', translation: de },
  { code: 'et', name: 'Eesti', englishName: 'Estonian', direction: 'ltr', momentLocale: 'et', geomanLocale: 'en', translation: et },
  { code: 'en', name: 'English', englishName: 'English', direction: 'ltr', momentLocale: 'en', geomanLocale: 'en', translation: en },
  { code: 'es', name: 'Español', englishName: 'Spanish', direction: 'ltr', momentLocale: 'es', geomanLocale: 'es', translation: es },
  { code: 'eu', name: 'Euskara', englishName: 'Basque', direction: 'ltr', momentLocale: 'eu', geomanLocale: 'en', translation: eu },
  { code: 'fr', name: 'Français', englishName: 'French', direction: 'ltr', momentLocale: 'fr', geomanLocale: 'fr', translation: fr },
  { code: 'gl', name: 'Galego', englishName: 'Galician', direction: 'ltr', momentLocale: 'gl', geomanLocale: 'en', translation: gl },
  { code: 'hr', name: 'Hrvatski', englishName: 'Croatian', direction: 'ltr', momentLocale: 'hr', geomanLocale: 'en', translation: hr },
  { code: 'it', name: 'Italiano', englishName: 'Italian', direction: 'ltr', momentLocale: 'it', geomanLocale: 'it', translation: it },
  { code: 'lv', name: 'Latviešu', englishName: 'Latvian', direction: 'ltr', momentLocale: 'lv', geomanLocale: 'en', translation: lv },
  { code: 'lt', name: 'Lietuvių', englishName: 'Lithuanian', direction: 'ltr', momentLocale: 'lt', geomanLocale: 'en', translation: lt },
  { code: 'hu', name: 'Magyar', englishName: 'Hungarian', direction: 'ltr', momentLocale: 'hu', geomanLocale: 'hu', translation: hu },
  { code: 'nl', name: 'Nederlands', englishName: 'Dutch', direction: 'ltr', momentLocale: 'nl', geomanLocale: 'nl', translation: nl },
  { code: 'nb', name: 'Norsk bokmål', englishName: 'Norwegian Bokmål', direction: 'ltr', momentLocale: 'nb', geomanLocale: 'no', translation: nb },
  { code: 'pl', name: 'Polski', englishName: 'Polish', direction: 'ltr', momentLocale: 'pl', geomanLocale: 'pl', translation: pl },
  { code: 'pt-BR', name: 'Português (Brasil)', englishName: 'Portuguese (Brazil)', direction: 'ltr', momentLocale: 'pt-br', geomanLocale: 'pt_br', translation: ptBR },
  { code: 'pt-PT', name: 'Português (Portugal)', englishName: 'Portuguese (Portugal)', direction: 'ltr', momentLocale: 'pt', geomanLocale: 'pt_pt', translation: ptPT },
  { code: 'ro', name: 'Română', englishName: 'Romanian', direction: 'ltr', momentLocale: 'ro', geomanLocale: 'ro', translation: ro },
  { code: 'sk', name: 'Slovenčina', englishName: 'Slovak', direction: 'ltr', momentLocale: 'sk', geomanLocale: 'en', translation: sk },
  { code: 'sl', name: 'Slovenščina', englishName: 'Slovenian', direction: 'ltr', momentLocale: 'sl', geomanLocale: 'en', translation: sl },
  { code: 'sr-Latn', name: 'Srpski (latinica)', englishName: 'Serbian (Latin)', direction: 'ltr', momentLocale: 'sr', geomanLocale: 'en', translation: srLatn },
  { code: 'fi', name: 'Suomi', englishName: 'Finnish', direction: 'ltr', momentLocale: 'fi', geomanLocale: 'fi', translation: fi },
  { code: 'sv', name: 'Svenska', englishName: 'Swedish', direction: 'ltr', momentLocale: 'sv', geomanLocale: 'sv', translation: sv },
  { code: 'vi', name: 'Tiếng Việt', englishName: 'Vietnamese', direction: 'ltr', momentLocale: 'vi', geomanLocale: 'en', translation: vi },
  { code: 'tr', name: 'Türkçe', englishName: 'Turkish', direction: 'ltr', momentLocale: 'tr', geomanLocale: 'tr', translation: tr },
  { code: 'el', name: 'Ελληνικά', englishName: 'Greek', direction: 'ltr', momentLocale: 'el', geomanLocale: 'el', translation: el },
  { code: 'bg', name: 'Български', englishName: 'Bulgarian', direction: 'ltr', momentLocale: 'bg', geomanLocale: 'en', translation: bg },
  { code: 'ru', name: 'Русский', englishName: 'Russian', direction: 'ltr', momentLocale: 'ru', geomanLocale: 'ru', translation: ru },
  { code: 'uk', name: 'Українська', englishName: 'Ukrainian', direction: 'ltr', momentLocale: 'uk', geomanLocale: 'ua', translation: uk },
  { code: 'he', name: 'עברית', englishName: 'Hebrew', direction: 'rtl', momentLocale: 'he', geomanLocale: 'en', translation: he },
  { code: 'ar', name: 'العربية', englishName: 'Arabic', direction: 'rtl', momentLocale: 'ar', geomanLocale: 'en', translation: ar },
  { code: 'hi', name: 'हिन्दी', englishName: 'Hindi', direction: 'ltr', momentLocale: 'hi', geomanLocale: 'en', translation: hi },
  { code: 'th', name: 'ไทย', englishName: 'Thai', direction: 'ltr', momentLocale: 'th', geomanLocale: 'en', translation: th },
  { code: 'ko', name: '한국어', englishName: 'Korean', direction: 'ltr', momentLocale: 'ko', geomanLocale: 'ko', translation: ko },
  { code: 'ja', name: '日本語', englishName: 'Japanese', direction: 'ltr', momentLocale: 'ja', geomanLocale: 'ja', translation: ja },
  { code: 'zh-Hans', name: '简体中文', englishName: 'Chinese (Simplified)', direction: 'ltr', momentLocale: 'zh-cn', geomanLocale: 'zh', translation: zhHans },
  { code: 'zh-Hant', name: '繁體中文', englishName: 'Chinese (Traditional)', direction: 'ltr', momentLocale: 'zh-tw', geomanLocale: 'zh_tw', translation: zhHant },
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
