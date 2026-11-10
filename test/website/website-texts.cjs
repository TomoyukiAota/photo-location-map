// Checks the texts of the website (docs/index.html and the Windows download page) in each of its languages, and how
// its script chooses the language. What a pull request that translates the website is checked against
// (docs/TRANSLATING.md). Run with `npm run test:website`.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { describe, it } = require('node:test');

const docs = path.join(__dirname, '../../docs');
const localesDirectory = path.join(docs, 'github-pages/locales');
const { languages, matchLanguage, resolveLanguage, linkParts, textOf } = require(path.join(docs, 'github-pages/i18n.js'));

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
    });
  }

  it('are named for search engines: the landing page links to itself in each language', () => {
    const landing = pages['docs/index.html'];
    for (const { code } of languages)
      assert.ok(landing.includes(`<link rel="alternate" hreflang="${code}" href="https://tomoyukiaota.github.io/photo-location-map/?lang=${code}">`), code);
    assert.ok(landing.includes('<link rel="alternate" hreflang="x-default" href="https://tomoyukiaota.github.io/photo-location-map/">'));
  });
});

describe('The language of the website (docs/github-pages/i18n.js)', () => {
  it('is the first of a list of language tags that the website has, as it is or without its last parts', () => {
    assert.equal(matchLanguage(['ja']), 'ja');
    assert.equal(matchLanguage(['ja-JP']), 'ja');
    assert.equal(matchLanguage(['JA-jp']), 'ja');
    assert.equal(matchLanguage(['en-GB']), 'en');
    assert.equal(matchLanguage(['is-IS', 'ja-JP', 'en-US']), 'ja');
    assert.equal(matchLanguage(['is-IS', 'cy']), null);
    assert.equal(matchLanguage([null, undefined, '']), null);
    assert.equal(matchLanguage([]), null);
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
