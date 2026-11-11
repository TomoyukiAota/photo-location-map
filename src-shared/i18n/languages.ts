import ar from './locales/ar.json';
import bg from './locales/bg.json';
import ca from './locales/ca.json';
import cs from './locales/cs.json';
import da from './locales/da.json';
import de from './locales/de.json';
import el from './locales/el.json';
import en from './locales/en.json';
import es from './locales/es.json';
import et from './locales/et.json';
import eu from './locales/eu.json';
import fi from './locales/fi.json';
import fr from './locales/fr.json';
import gl from './locales/gl.json';
import he from './locales/he.json';
import hi from './locales/hi.json';
import hr from './locales/hr.json';
import hu from './locales/hu.json';
import id from './locales/id.json';
import it from './locales/it.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import lt from './locales/lt.json';
import lv from './locales/lv.json';
import ms from './locales/ms.json';
import nb from './locales/nb.json';
import nl from './locales/nl.json';
import pl from './locales/pl.json';
import ptBR from './locales/pt-BR.json';
import ptPT from './locales/pt-PT.json';
import ro from './locales/ro.json';
import ru from './locales/ru.json';
import sk from './locales/sk.json';
import sl from './locales/sl.json';
import srLatn from './locales/sr-Latn.json';
import sv from './locales/sv.json';
import th from './locales/th.json';
import tr from './locales/tr.json';
import uk from './locales/uk.json';
import vi from './locales/vi.json';
import zhHans from './locales/zh-Hans.json';
import zhHant from './locales/zh-Hant.json';

/**
 * The languages that the application can be shown in, in the order that the Language dialog and the Settings dialog
 * list them: the names in Latin letters by the alphabet, then those in other scripts. They are the languages that
 * Windows or macOS is fully translated into, and the same ones as Photo Data Viewer's, which is shown in the
 * application's language. To add one, see docs/TRANSLATING.md: add `locales/<code>.json` and an entry here.
 *
 * - `name` is the language's own name, written as macOS lists it, which the lists show. `englishName` is what the
 *   search of the lists also finds it by.
 * - `flag` is the flag that the lists show beside the name, by its name in the flag-icons package: the code of a
 *   country, of a region (`es-ct`) or of a group of countries (`arab`). Its file is listed in
 *   src/app/language/language-list.component.scss.
 *   TL;DR: The flag of the country that Unicode gives as the language's own, but for Catalan, Basque, Galician and
 *   Arabic.
 *   Details: That country is the region of the language's likely subtags (`new Intl.Locale(code).maximize()`): the
 *   United States for English, Spain for Spanish, Brazil for `pt-BR` and Taiwan for `zh-Hant`. Catalan, Basque and
 *   Galician, which that gives Spain too, have the flags of their regions, Catalonia, the Basque Country and Galicia.
 *   Arabic, which it gives Egypt, has the flag of the Arab League, as the language of many countries.
 * - `direction` is `rtl` for a language written from right to left, which the page is then laid out in
 *   (src/start-app.ts).
 * - `momentLocale` is its locale in moment (`moment/locale/<name>`, loaded in src/app/shared/i18n/moment-locales.ts).
 * - `geomanLocale` is its locale in Leaflet-Geoman (`SupportLocales` of its type definitions), or `en` when it has
 *   none: the tooltips while a region is drawn are then in English.
 */
export const languages = [
  { code: 'id', name: 'Bahasa Indonesia', englishName: 'Indonesian', flag: 'id', direction: 'ltr', momentLocale: 'id', geomanLocale: 'id', translation: id },
  { code: 'ms', name: 'Bahasa Melayu', englishName: 'Malay', flag: 'my', direction: 'ltr', momentLocale: 'ms', geomanLocale: 'en', translation: ms },
  { code: 'ca', name: 'Català', englishName: 'Catalan', flag: 'es-ct', direction: 'ltr', momentLocale: 'ca', geomanLocale: 'en', translation: ca },
  { code: 'cs', name: 'Čeština', englishName: 'Czech', flag: 'cz', direction: 'ltr', momentLocale: 'cs', geomanLocale: 'cz', translation: cs },
  { code: 'da', name: 'Dansk', englishName: 'Danish', flag: 'dk', direction: 'ltr', momentLocale: 'da', geomanLocale: 'da', translation: da },
  { code: 'de', name: 'Deutsch', englishName: 'German', flag: 'de', direction: 'ltr', momentLocale: 'de', geomanLocale: 'de', translation: de },
  { code: 'et', name: 'Eesti', englishName: 'Estonian', flag: 'ee', direction: 'ltr', momentLocale: 'et', geomanLocale: 'en', translation: et },
  { code: 'en', name: 'English', englishName: 'English', flag: 'us', direction: 'ltr', momentLocale: 'en', geomanLocale: 'en', translation: en },
  { code: 'es', name: 'Español', englishName: 'Spanish', flag: 'es', direction: 'ltr', momentLocale: 'es', geomanLocale: 'es', translation: es },
  { code: 'eu', name: 'Euskara', englishName: 'Basque', flag: 'es-pv', direction: 'ltr', momentLocale: 'eu', geomanLocale: 'en', translation: eu },
  { code: 'fr', name: 'Français', englishName: 'French', flag: 'fr', direction: 'ltr', momentLocale: 'fr', geomanLocale: 'fr', translation: fr },
  { code: 'gl', name: 'Galego', englishName: 'Galician', flag: 'es-ga', direction: 'ltr', momentLocale: 'gl', geomanLocale: 'en', translation: gl },
  { code: 'hr', name: 'Hrvatski', englishName: 'Croatian', flag: 'hr', direction: 'ltr', momentLocale: 'hr', geomanLocale: 'en', translation: hr },
  { code: 'it', name: 'Italiano', englishName: 'Italian', flag: 'it', direction: 'ltr', momentLocale: 'it', geomanLocale: 'it', translation: it },
  { code: 'lv', name: 'Latviešu', englishName: 'Latvian', flag: 'lv', direction: 'ltr', momentLocale: 'lv', geomanLocale: 'en', translation: lv },
  { code: 'lt', name: 'Lietuvių', englishName: 'Lithuanian', flag: 'lt', direction: 'ltr', momentLocale: 'lt', geomanLocale: 'en', translation: lt },
  { code: 'hu', name: 'Magyar', englishName: 'Hungarian', flag: 'hu', direction: 'ltr', momentLocale: 'hu', geomanLocale: 'hu', translation: hu },
  { code: 'nl', name: 'Nederlands', englishName: 'Dutch', flag: 'nl', direction: 'ltr', momentLocale: 'nl', geomanLocale: 'nl', translation: nl },
  { code: 'nb', name: 'Norsk bokmål', englishName: 'Norwegian Bokmål', flag: 'no', direction: 'ltr', momentLocale: 'nb', geomanLocale: 'no', translation: nb },
  { code: 'pl', name: 'Polski', englishName: 'Polish', flag: 'pl', direction: 'ltr', momentLocale: 'pl', geomanLocale: 'pl', translation: pl },
  { code: 'pt-BR', name: 'Português (Brasil)', englishName: 'Portuguese (Brazil)', flag: 'br', direction: 'ltr', momentLocale: 'pt-br', geomanLocale: 'pt_br', translation: ptBR },
  { code: 'pt-PT', name: 'Português (Portugal)', englishName: 'Portuguese (Portugal)', flag: 'pt', direction: 'ltr', momentLocale: 'pt', geomanLocale: 'pt_pt', translation: ptPT },
  { code: 'ro', name: 'Română', englishName: 'Romanian', flag: 'ro', direction: 'ltr', momentLocale: 'ro', geomanLocale: 'ro', translation: ro },
  { code: 'sk', name: 'Slovenčina', englishName: 'Slovak', flag: 'sk', direction: 'ltr', momentLocale: 'sk', geomanLocale: 'en', translation: sk },
  { code: 'sl', name: 'Slovenščina', englishName: 'Slovenian', flag: 'si', direction: 'ltr', momentLocale: 'sl', geomanLocale: 'en', translation: sl },
  { code: 'sr-Latn', name: 'Srpski (latinica)', englishName: 'Serbian (Latin)', flag: 'rs', direction: 'ltr', momentLocale: 'sr', geomanLocale: 'en', translation: srLatn },
  { code: 'fi', name: 'Suomi', englishName: 'Finnish', flag: 'fi', direction: 'ltr', momentLocale: 'fi', geomanLocale: 'fi', translation: fi },
  { code: 'sv', name: 'Svenska', englishName: 'Swedish', flag: 'se', direction: 'ltr', momentLocale: 'sv', geomanLocale: 'sv', translation: sv },
  { code: 'vi', name: 'Tiếng Việt', englishName: 'Vietnamese', flag: 'vn', direction: 'ltr', momentLocale: 'vi', geomanLocale: 'en', translation: vi },
  { code: 'tr', name: 'Türkçe', englishName: 'Turkish', flag: 'tr', direction: 'ltr', momentLocale: 'tr', geomanLocale: 'tr', translation: tr },
  { code: 'el', name: 'Ελληνικά', englishName: 'Greek', flag: 'gr', direction: 'ltr', momentLocale: 'el', geomanLocale: 'el', translation: el },
  { code: 'bg', name: 'Български', englishName: 'Bulgarian', flag: 'bg', direction: 'ltr', momentLocale: 'bg', geomanLocale: 'en', translation: bg },
  { code: 'ru', name: 'Русский', englishName: 'Russian', flag: 'ru', direction: 'ltr', momentLocale: 'ru', geomanLocale: 'ru', translation: ru },
  { code: 'uk', name: 'Українська', englishName: 'Ukrainian', flag: 'ua', direction: 'ltr', momentLocale: 'uk', geomanLocale: 'ua', translation: uk },
  { code: 'he', name: 'עברית', englishName: 'Hebrew', flag: 'il', direction: 'rtl', momentLocale: 'he', geomanLocale: 'en', translation: he },
  { code: 'ar', name: 'العربية', englishName: 'Arabic', flag: 'arab', direction: 'rtl', momentLocale: 'ar', geomanLocale: 'en', translation: ar },
  { code: 'hi', name: 'हिन्दी', englishName: 'Hindi', flag: 'in', direction: 'ltr', momentLocale: 'hi', geomanLocale: 'en', translation: hi },
  { code: 'th', name: 'ไทย', englishName: 'Thai', flag: 'th', direction: 'ltr', momentLocale: 'th', geomanLocale: 'en', translation: th },
  { code: 'ko', name: '한국어', englishName: 'Korean', flag: 'kr', direction: 'ltr', momentLocale: 'ko', geomanLocale: 'ko', translation: ko },
  { code: 'ja', name: '日本語', englishName: 'Japanese', flag: 'jp', direction: 'ltr', momentLocale: 'ja', geomanLocale: 'ja', translation: ja },
  { code: 'zh-Hans', name: '简体中文', englishName: 'Chinese (Simplified)', flag: 'cn', direction: 'ltr', momentLocale: 'zh-cn', geomanLocale: 'zh', translation: zhHans },
  { code: 'zh-Hant', name: '繁體中文', englishName: 'Chinese (Traditional)', flag: 'tw', direction: 'ltr', momentLocale: 'zh-tw', geomanLocale: 'zh_tw', translation: zhHant },
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
