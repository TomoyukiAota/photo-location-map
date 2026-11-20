import { tIn } from '../../src-shared/i18n/i18n.js';
import { getLanguage, LanguageCode } from '../../src-shared/i18n/languages.js';

// TL;DR: The main window's page, index.html, as the main process serves it (app-page.ts): in the application's
// language from its first byte, so that the window's first frame shows the loading text in that language.
// Details: The page shows its loading text until Angular starts, which can take seconds: when two instances started at
// once on one profile, as Explorer starts one for each item that "Open with Photo Location Map" opens, the page's main
// thread waited 0.5 to 4 s before the app's code ran, in every one of 13 tries on macOS
// (docs/tasks/20261121_launch-loading-screen/REPORT.md). Only the window's first frame was shown meanwhile, so the text
// has to be in the application's language there: src/start-app.ts, which would set it, runs after that wait. The
// language and the direction of the page are written with it, so that Chromium chooses the glyphs of Japanese and
// Chinese, which share code points, by the language, and lays out Arabic and Hebrew from the right, from the first
// frame on.

/** What the page is written in: its language and direction, and its loading text in that language. */
export interface AppPageLanguage {
  lang: string;
  dir: 'ltr' | 'rtl';
  loadingText: string;
}

/** The start tag of the page's root element, with the attributes that the build gave it. */
const htmlStartTag = /<html\b[^>]*>/;
/** The language and the direction in that start tag, with the space before each. */
const languageAttributes = /\s(?:lang|dir)="[^"]*"/g;
/** The loading text of the page: the text of its element whose ID is app-loading-text (src/index.html). */
const loadingTextElement = /(<span\b[^>]*\bid="app-loading-text"[^>]*>)[^<]*(<\/span>)/;

/** The page's language, its direction and its loading text, in `language`. */
export function appPageLanguageOf(language: LanguageCode): AppPageLanguage {
  return { lang: language, dir: getLanguage(language).direction, loadingText: tIn(language, 'app.loading') };
}

/** The page `html` in `language`. Throws when the page has no root element or no loading text to write it in. */
export function appPageInLanguage(html: string, language: LanguageCode): string {
  return appPageWith(html, appPageLanguageOf(language));
}

/** The page `html` with `page`'s language, direction and loading text. Throws when the page has nowhere to put them. */
export function appPageWith(html: string, page: AppPageLanguage): string {
  if (!htmlStartTag.test(html))
    throw new Error('The app\'s page has no <html> start tag to write its language in.');
  if (!loadingTextElement.test(html))
    throw new Error('The app\'s page has no element with the ID app-loading-text to write its loading text in.');
  return html
    .replace(htmlStartTag, tag => tag.replace(languageAttributes, '').replace(/^<html/, `<html lang="${page.lang}" dir="${page.dir}"`))
    .replace(loadingTextElement, (_element, start: string, end: string) => `${start}${escapeText(page.loadingText)}${end}`);
}

/** `text` as the text of an element in HTML. */
function escapeText(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
