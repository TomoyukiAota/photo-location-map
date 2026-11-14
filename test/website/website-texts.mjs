// Checks the texts of the website (docs/index.html and the Windows download page) in each of its languages, and how
// its script chooses the language. What a pull request that translates the website is checked against
// (docs/TRANSLATING.md). Run with `npm run test:website`.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import {
  languages, matchLanguage, resolveLanguage, followsBrowser, languageParts, linkParts, textOf, foldForSearch, searchFinds, matchesSearch,
} from './website-i18n.mjs';

const docs = path.join(import.meta.dirname, '../../docs');
const localesDirectory = path.join(docs, 'github-pages/locales');

const pages = {
  'docs/index.html': fs.readFileSync(path.join(docs, 'index.html'), 'utf8'),
  'docs/github-pages/downloading-for-windows/downloading-for-windows.html':
    fs.readFileSync(path.join(docs, 'github-pages/downloading-for-windows/downloading-for-windows.html'), 'utf8'),
};
const files = fs.readdirSync(localesDirectory).filter(file => file.endsWith('.json')).sort();
const read = file => JSON.parse(fs.readFileSync(path.join(localesDirectory, file), 'utf8'));

/** The texts of a file, each under its full key, such as `landing.summary`. */
function flatten(value, prefix = '') {
  if (typeof value === 'string') return { [prefix]: value };
  assert.ok(value !== null && typeof value === 'object' && !Array.isArray(value), `${prefix} is neither a text nor an object of texts`);
  return Object.assign({}, ...Object.entries(value).map(([key, child]) => flatten(child, prefix ? `${prefix}.${key}` : key)));
}

const english = flatten(read('en.json'));
const tags = text => (text.match(/<\/?[a-zA-Z][^>]*>/g) ?? []).join(' ');
/** The places of a text where the page puts a value, as {{language}}. */
const placeholders = text => (text.match(/\{\{[^}]*\}\}/g) ?? []).sort().join(' ');
/** The names that every language writes as English does. Each is found in a word with an ending too, as Windowsille. */
const names = ['Photo Location Map', 'Photo Data Viewer', 'Windows Defender SmartScreen', 'GitHub', 'Tomoyuki Aota', 'EXIF',
  'Windows', 'macOS', 'exe'];
const oneLine = text => text.replace(/\s+/g, ' ').trim();

/** The element of a page that has `attribute="key"`: its opening tag, and what is between that and its closing tag. */
function elementWith(html, attribute, key) {
  const at = html.indexOf(`${attribute}="${key}"`);
  assert.notEqual(at, -1, `${attribute}="${key}" is in no page`);
  const start = html.lastIndexOf('<', at);
  const end = html.indexOf('>', at);
  const openingTag = html.slice(start, end + 1);
  const name = /^<([a-zA-Z0-9]+)/.exec(openingTag)[1];
  const closing = html.indexOf(`</${name}>`, end);
  return { openingTag, content: closing === -1 ? '' : html.slice(end + 1, closing) };
}

/** Which keys the pages ask for, by the attribute that asks: data-i18n for a text, data-i18n-alt for an attribute. */
function keysOfPages() {
  const keys = [];
  for (const [page, html] of Object.entries(pages)) {
    for (const [, attribute, key] of html.matchAll(/(data-i18n(?:-[a-z-]+)?)="([^"]+)"/g)) keys.push({ page, html, attribute, key });
  }
  return keys;
}

describe('The texts of the website (docs/github-pages/locales)', () => {
  it('are listed once each in i18n.js, with a file for each language listed', () => {
    const codes = languages.map(language => language.code);
    assert.equal(new Set(codes).size, codes.length);
    assert.deepEqual(codes.map(code => `${code}.json`).sort(), files);
  });

  it('are in languages of the application, in the order of its list, under the same names', () => {
    // The list of the application, read as text: it is TypeScript, with the application's texts imported into it.
    const source = fs.readFileSync(path.join(docs, '../src-shared/i18n/languages.ts'), 'utf8');
    const ofApplication = [...source.matchAll(/\{ code: '([^']+)', name: '([^']+)', englishName: '([^']+)', direction: '(ltr|rtl)'/g)]
      .map(([, code, name, englishName, direction]) => ({ code, name, englishName, rtl: direction === 'rtl' }));
    assert.ok(ofApplication.length > 40, `${ofApplication.length} languages read from languages.ts`);
    // A language of the application alone is passed over: its translation of the website may follow later.
    const codes = languages.map(language => language.code);
    assert.deepEqual(languages.map(({ code, name, englishName, rtl }) => ({ code, name, englishName, rtl: rtl === true })),
      ofApplication.filter(({ code }) => codes.includes(code)));
  });

  it('have an English text for every key that a page asks for, and no English text that no page asks for', () => {
    const asked = [...new Set(keysOfPages().map(({ key }) => key))].sort();
    assert.deepEqual(asked, Object.keys(english).sort());
  });

  it('are, in English, what the pages themselves hold, which is shown when a file cannot be fetched', () => {
    for (const { page, html, attribute, key } of keysOfPages()) {
      const { openingTag, content } = elementWith(html, attribute, key);
      const inPage = attribute === 'data-i18n'
        // The element's one link stands for <link>…</link> in the text.
        ? oneLine(content.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/, '<link>$1</link>')).replace(/&quot;/g, '"')
        : new RegExp(`\\s${attribute.slice('data-i18n-'.length)}="([^"]*)"`).exec(openingTag)?.[1];
      assert.equal(inPage, english[key], `${key} in ${page}`);
    }
  });

  for (const file of files) {
    describe(file, () => {
      const texts = flatten(read(file));

      it('has only keys that en.json has', () => {
        assert.deepEqual(Object.keys(texts).filter(key => !(key in english)), []);
      });

      it('has no empty text: a text not translated yet is left out, and shown in English', () => {
        assert.deepEqual(Object.keys(texts).filter(key => texts[key].trim() === ''), []);
      });

      it('keeps the <link> tags of each English text', () => {
        assert.deepEqual(Object.keys(texts).filter(key => key in english && tags(texts[key]) !== tags(english[key])), []);
      });

      it('keeps the {{language}} of each English text, where the page puts the name of a language', () => {
        assert.deepEqual(Object.keys(texts).filter(key => key in english && placeholders(texts[key]) !== placeholders(english[key])), []);
      });

      it('writes the names as English does: Photo Location Map, Windows, GitHub and the others', () => {
        const without = Object.keys(texts).flatMap(key =>
          names.filter(name => (english[key] ?? '').includes(name) && !texts[key].includes(name)).map(name => `${key}: ${name}`));
        assert.deepEqual(without, []);
      });

      it('numbers the steps of the installation, and names the two buttons of Windows as the pictures show them', () => {
        for (const step of [1, 2, 3, 4]) {
          const text = texts[`downloading.step${step}`];
          if (text !== undefined) assert.ok(text.startsWith(`${step}. `), `downloading.step${step}: ${text}`);
        }
        // The pictures are of an English Windows, so a step has the English words, beside the language's own.
        if ('downloading.step2' in texts) assert.ok(texts['downloading.step2'].includes('More info'), texts['downloading.step2']);
        if ('downloading.step3' in texts) assert.ok(texts['downloading.step3'].includes('Run anyway'), texts['downloading.step3']);
      });
    });
  }

  it('are named for search engines: the landing page links to itself in each language', () => {
    const landing = pages['docs/index.html'];
    for (const { code } of languages)
      assert.ok(landing.includes(`<link rel="alternate" hreflang="${code}" href="https://tomoyukiaota.github.io/photo-location-map/?lang=${code}">`), code);
    assert.ok(landing.includes('<link rel="alternate" hreflang="x-default" href="https://tomoyukiaota.github.io/photo-location-map/">'));
  });

  it('have their addresses in the sitemap: the landing page\'s, as it is and in each language, in the order of the list', () => {
    const site = 'https://tomoyukiaota.github.io/photo-location-map/';
    const sitemap = fs.readFileSync(path.join(docs, 'sitemap.xml'), 'utf8');
    const addresses = [...sitemap.matchAll(/<url>\s*<loc>([^<]*)<\/loc>/g)].map(([, address]) => address);
    assert.deepEqual(addresses, [site, ...languages.map(({ code }) => `${site}?lang=${code}`)]);
  });

  it('are published as the files are: docs/.nojekyll keeps GitHub Pages from running Jekyll over them', () => {
    // Jekyll reads {{ … }} in a Markdown document of docs/ as an expression of its own, and failed the website's
    // publication on one that quoted a template.
    assert.ok(fs.existsSync(path.join(docs, '.nojekyll')));
  });
});

describe('The language of the website (docs/github-pages/i18n.js)', () => {
  // Icelandic and Welsh stand for the languages that the website has no texts in. The cases are those of the
  // application's matching, which this is to be the same as (src-shared/i18n/resolve-language.spec.ts).
  it('is the first of a list of language tags that the website has, as it is or without its last parts', () => {
    assert.equal(matchLanguage(['ja']), 'ja');
    assert.equal(matchLanguage(['ja-JP']), 'ja');
    assert.equal(matchLanguage(['JA-jp']), 'ja');
    assert.equal(matchLanguage(['en-GB']), 'en');
    assert.equal(matchLanguage(['es-419']), 'es');
    assert.equal(matchLanguage(['fr-CA']), 'fr');
    assert.equal(matchLanguage(['pt-BR']), 'pt-BR');
    assert.equal(matchLanguage(['pt-br']), 'pt-BR');
    assert.equal(matchLanguage(['zh-Hant-TW']), 'zh-Hant');
    assert.equal(matchLanguage(['zh-Hans-CN']), 'zh-Hans');
    assert.equal(matchLanguage(['sr-Latn-RS']), 'sr-Latn');
    assert.equal(matchLanguage(['nb-NO']), 'nb');
    assert.equal(matchLanguage(['is-IS', 'ja-JP', 'en-US']), 'ja');
    assert.equal(matchLanguage(['en-US', 'ja-JP']), 'en');
    assert.equal(matchLanguage(['is-IS', 'cy']), null);
    assert.equal(matchLanguage([null, undefined, '']), null);
    assert.equal(matchLanguage([]), null);
  });

  it('is found under another code where the list has it so: Chinese by its script, Portuguese by its region, Bokmål and Serbian in Latin letters', () => {
    for (const [tag, code] of [['zh-TW', 'zh-Hant'], ['zh-HK', 'zh-Hant'], ['zh-MO', 'zh-Hant'], ['zh-CN', 'zh-Hans'], ['zh-SG', 'zh-Hans'],
      ['zh', 'zh-Hans'], ['pt', 'pt-BR'], ['pt-PT', 'pt-PT'], ['pt-AO', 'pt-PT'], ['no', 'nb'], ['no-NO', 'nb'], ['nn-NO', 'nb'],
      ['sr', 'sr-Latn'], ['sr-RS', 'sr-Latn'], ['sr-Cyrl-RS', 'sr-Latn']])
      assert.equal(matchLanguage([tag]), code, tag);
  });

  it('is the one in the address, then the one chosen before, then the browser\'s, then English', () => {
    assert.equal(resolveLanguage({ param: 'ja', saved: 'en', browserLanguages: ['en-US'] }), 'ja');
    assert.equal(resolveLanguage({ param: null, saved: 'ja', browserLanguages: ['en-US'] }), 'ja');
    assert.equal(resolveLanguage({ param: null, saved: null, browserLanguages: ['ja-JP', 'en-US'] }), 'ja');
    assert.equal(resolveLanguage({ param: null, saved: null, browserLanguages: ['is-IS'] }), 'en');
    assert.equal(resolveLanguage({ param: null, saved: null, browserLanguages: [] }), 'en');
    // A language that the website does not have, in the address or kept from before, is passed over.
    assert.equal(resolveLanguage({ param: 'xx', saved: 'ja', browserLanguages: ['en-US'] }), 'ja');
    assert.equal(resolveLanguage({ param: 'xx', saved: 'yy', browserLanguages: ['en-US'] }), 'en');
    // The address gives a code in any case, and one that the list has under another code.
    assert.equal(resolveLanguage({ param: 'zh-hant', saved: null, browserLanguages: ['en-US'] }), 'zh-Hant');
    assert.equal(resolveLanguage({ param: 'zh-TW', saved: null, browserLanguages: ['en-US'] }), 'zh-Hant');
  });

  it('follows the browser while neither the address nor a choice kept from before asks for a language of the website', () => {
    assert.equal(followsBrowser({ param: null, saved: null }), true);
    assert.equal(followsBrowser({ param: 'ja', saved: null }), false);
    assert.equal(followsBrowser({ param: null, saved: 'ja' }), false);
    assert.equal(followsBrowser({ param: 'zh-TW', saved: null }), false);
    // A language that the website does not have asks for nothing.
    assert.equal(followsBrowser({ param: 'xx', saved: 'yy' }), true);
  });

  it('puts the name of the browser\'s language where {{language}} is in the first entry of the picker', () => {
    assert.deepEqual(languageParts('Use browser setting ({{language}})'), { before: 'Use browser setting (', after: ')' });
    assert.deepEqual(languageParts('ブラウザの設定に従う（{{language}}）'), { before: 'ブラウザの設定に従う（', after: '）' });
    assert.deepEqual(languageParts('No name here'), { before: 'No name here', after: '' });
  });

  it('finds the first entry of the picker by any part of its words, the name of the browser\'s language among them', () => {
    assert.equal(searchFinds(['ブラウザの設定に従う（日本語）'], 'ブラウザ'), true);
    assert.equal(searchFinds(['ブラウザの設定に従う（日本語）'], '日本'), true);
    assert.equal(searchFinds(['Use browser setting (English)'], 'BROWSER'), true);
    assert.equal(searchFinds(['Use browser setting (English)'], 'deutsch'), false);
    assert.equal(searchFinds(['Use browser setting (English)'], ' '), true);
  });

  it('is found in the picker\'s list by any part of its own name, English name, name in the page\'s language or code', () => {
    const [english, japanese] = ['en', 'ja'].map(code => languages.find(language => language.code === code));
    assert.equal(foldForSearch('Čeština'), 'cestina');
    assert.equal(matchesSearch(english, 'ENG'), true);
    assert.equal(matchesSearch(japanese, '日本'), true);
    assert.equal(matchesSearch(japanese, 'japan'), true);
    assert.equal(matchesSearch(japanese, ' ja '), true);
    assert.equal(matchesSearch(english, '英語', '英語'), true);
    assert.equal(matchesSearch(english, '英語'), false);
    assert.equal(matchesSearch(japanese, 'eng'), false);
    // Nothing typed lists every language.
    assert.equal(matchesSearch(japanese, '  '), true);
  });

  it('finds the words of a text\'s link, and the text of a key', () => {
    assert.deepEqual(linkParts('See <link>the page</link>.'), { before: 'See ', inside: 'the page', after: '.' });
    assert.deepEqual(linkParts('<link>Photo Data Viewer</link> is also available.'),
      { before: '', inside: 'Photo Data Viewer', after: ' is also available.' });
    assert.deepEqual(linkParts('No link here.'), { before: 'No link here.', inside: null, after: '' });
    assert.equal(textOf({ landing: { summary: 'A summary.' } }, 'landing.summary'), 'A summary.');
    assert.equal(textOf({ landing: {} }, 'landing.summary'), undefined);
    assert.equal(textOf({}, 'landing.summary'), undefined);
  });
});
