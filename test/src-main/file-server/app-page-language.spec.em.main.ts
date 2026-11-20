import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { appPageInLanguage, appPageWith } from '../../../src-main/file-server/app-page-language.js';
import { tIn } from '../../../src-shared/i18n/i18n.js';
import { languages } from '../../../src-shared/i18n/languages.js';

describe('The app\'s page in a language (in main process)', () => {
  // The page of the source; the build adds to it, as the next case does, and the e2e suite checks the page of the build.
  const sourcePage = fs.readFileSync(path.join(import.meta.dirname, '..', '..', '..', '..', '..', 'src', 'index.html'), 'utf8');

  /** The language and direction of the page's root element, and its loading text. */
  const writtenIn = (html: string) => ({
    lang: html.match(/<html\b[^>]*\slang="([^"]*)"/)?.[1],
    dir: html.match(/<html\b[^>]*\sdir="([^"]*)"/)?.[1],
    loadingText: html.match(/\bid="app-loading-text"[^>]*>([^<]*)</)?.[1],
  });

  it('is written in each language, with its direction and the loading text in it', () => {
    for (const { code, direction } of languages) {
      const page = appPageInLanguage(sourcePage, code);
      assert.deepStrictEqual(writtenIn(page), { lang: code, dir: direction, loadingText: tIn(code, 'app.loading') }, code);
      // Only those change.
      assert.strictEqual(page.replace(/<html\b[^>]*>/, '').replace(/(id="app-loading-text"[^>]*>)[^<]*/, '$1'),
        sourcePage.replace(/<html\b[^>]*>/, '').replace(/(id="app-loading-text"[^>]*>)[^<]*/, '$1'), code);
    }
  });

  it('keeps the attributes that the build gives the root element, with one language and one direction', () => {
    const built = '<!doctype html>\n<html lang="en" dir="ltr" data-beasties-container>\n<head></head><body>'
      + '<span class="app-loading-text" id="app-loading-text">Loading...</span></body></html>';
    const page = appPageInLanguage(built, 'ar');
    assert.match(page, /<html lang="ar" dir="rtl" data-beasties-container>/);
    assert.strictEqual(page.match(/\slang="/g)?.length, 1);
    assert.strictEqual(page.match(/\sdir="/g)?.length, 1);
  });

  it('writes the loading text as text, not as HTML', () => {
    const page = appPageWith(sourcePage, { lang: 'en', dir: 'ltr', loadingText: '<b>Tom & Jerry</b>' });
    assert.strictEqual(writtenIn(page).loadingText, '&lt;b&gt;Tom &amp; Jerry&lt;/b&gt;');
  });

  it('says so when the page has nowhere to write its language', () => {
    assert.throws(() => appPageInLanguage('<!doctype html><title>app</title><span id="app-loading-text">Loading...</span>', 'ja'),
      /no <html> start tag/);
    assert.throws(() => appPageInLanguage('<!doctype html><html><title>app</title></html>', 'ja'), /app-loading-text/);
  });
});
