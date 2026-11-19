import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { defaultLanguage, languages, putTexts, withLanguage } from './website-i18n.js';

// Writes the landing page of the website in each of its languages, the addresses of them all for search engines, and
// the language picker's first entry in each language. Run `npm run generate:website` after a change to
// docs/index.html, to a text in docs/github-pages/locales/ or to the list of languages in docs/github-pages/i18n.js,
// and commit what it writes: test/website/website-texts.mjs fails until that is done (docs/TRANSLATING.md, "The
// website").
//
// TL;DR: A search engine or the preview of a link reads a page as it is served, mostly without running its scripts.
// Details: docs/index.html holds the English texts, and github-pages/i18n.js puts those of the visitor's language into
// it in the browser. Read without that script, the page is in English at any address, so it is written out in each
// language as a browser shows it, with an address of its own (docs/tasks/20261116_website-seo/STATUS.md):
// - docs/<code>/index.html: docs/index.html with the texts of the language put into it by i18n.js's own putTexts(),
//   its own address as the canonical one and as og:url, which the preview of a link names, its other addresses from
//   a folder deeper, and its language in data-language of the script tag of i18n.js, which then keeps the page in it;
// - in the head of docs/index.html, and so of each of those pages, the address of the page in each language, and what
//   the application is, in the words of schema.org (structured data), with the summary of the page's language;
// - docs/sitemap.xml, with those addresses.
// The picker's first entry, "Use browser setting", is written in the browser's language, on a page in any language
// (docs/github-pages/i18n.js). The page has the texts of its own language only, so this writes into i18n.js the
// entry's text in every language, from useBrowserSetting of each language's file, which the entry then has without a
// request.

const docs = path.resolve(import.meta.dirname, '../../docs');
/** Where GitHub Pages publishes the website. */
export const site = 'https://tomoyukiaota.github.io/photo-location-map/';

/** The address of the landing page in a language, or of the landing page as it is for no language. */
export const addressOf = code => (code ? `${site}${code}/` : site);

/** The application's icon, which the previews of links show (Open Graph) and the structured data names. */
export const iconAddress = `${site}docs-resources/app-icon-512x512.png`;

/** What a landing page in a language says in its first comment, by which a folder is found to hold one. */
export const writtenMark = 'Written by `npm run generate:website` (script/website/generate-website.js)';

// The head of docs/index.html has the lines that this writes between these two comments.
const startOfLinks = '<!-- Written by `npm run generate:website`:';
const endOfLinks = '<!-- End of what `npm run generate:website` writes. -->';
// And github-pages/i18n.js between these two.
const startOfLabels = '// Written by `npm run generate:website`:';
const endOfLabels = '// End of what `npm run generate:website` writes.';

/**
 * A file's text with the line endings of the repository. A checkout on Windows may have CRLF, as Git converts them
 * there by default, and the HTML parser reads either as LF.
 */
export const readText = file => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

/** The head's lines for search engines: the page's own address, `canonical`, and the page in each language. */
const linksForSearchEngines = canonical => [
  `<link rel="canonical" href="${canonical}">`,
  ...languages.map(({ code }) => `<link rel="alternate" hreflang="${code}" href="${addressOf(code)}">`),
  `<link rel="alternate" hreflang="x-default" href="${addressOf(null)}">`,
];

/**
 * What the application is, for search engines, in the words of schema.org, with the summary of the page's language and
 * the page's own address. Google shows no rich result for an application without ratings or reviews, which the
 * website has none of, but search engines and AI assistants read it as what the page is about. No version: it would be
 * one more thing to change at each release.
 */
export const structuredData = (code, summary) => ({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Photo Location Map',
  description: summary,
  url: addressOf(code),
  image: iconAddress,
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Windows, macOS',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  inLanguage: languages.map(language => language.code),
  author: { '@type': 'Person', name: 'Tomoyuki Aota', url: 'https://github.com/tomoyukiaota' },
});

/** The text of the head's script of structured data, which starts and ends each of its lines with `indent`. */
const structuredDataScript = (data, indent) =>
  `\n${JSON.stringify(data, null, 2).replace(/</g, '\\u003c').split('\n').map(line => `${indent}${line}\n`).join('')}${indent}`;

/** docs/index.html with the lines for search engines that it is to have, in English. */
function landingPage(source, summary) {
  const start = source.indexOf(startOfLinks);
  const end = source.indexOf(endOfLinks);
  if (start === -1 || end < start) throw new Error(`The head of docs/index.html has no "${startOfLinks} … -->" followed by "${endOfLinks}".`);
  const afterStart = source.indexOf('-->', start) + '-->'.length;
  const indent = source.slice(source.lastIndexOf('\n', end) + 1, end);
  const lines = [
    ...linksForSearchEngines(addressOf(null)),
    `<script type="application/ld+json">${structuredDataScript(structuredData(null, summary), indent)}</script>`,
  ].map(line => `${indent}${line}\n`).join('');
  return `${source.slice(0, afterStart)}\n${lines}${indent}${source.slice(end)}`;
}

/** An address of the landing page as it is, for the page in a folder of the website's: from the folder above. */
const fromFolder = address => (/^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(address) ? address : `../${address.replace(/^\.\//, '')}`);

/**
 * The landing page in a language, written from the landing page as it is, `landing`, and the texts of the language.
 * The page is parsed once, and each language has a copy of it: a window for each would take ten times as long.
 */
function pageInLanguage(landing, code, texts) {
  const document = landing.cloneNode(true);
  const one = selector => document.querySelector(selector) ?? (() => {
    throw new Error(`docs/index.html has no ${selector}, which the page in each language changes.`);
  })();
  putTexts(document, code, texts);
  one('link[rel="canonical"]').setAttribute('href', addressOf(code));
  one('meta[property="og:url"]').setAttribute('content', addressOf(code));
  // The summary of the language, which putTexts() has put into the description, as the page shows it.
  const script = one('script[type="application/ld+json"]');
  const indent = script.previousSibling.data.slice(script.previousSibling.data.lastIndexOf('\n') + 1);
  script.textContent = structuredDataScript(structuredData(code, one('meta[name="description"]').getAttribute('content')), indent);
  for (const element of document.querySelectorAll('[href], [src]')) {
    for (const attribute of ['href', 'src'].filter(attribute => element.hasAttribute(attribute)))
      element.setAttribute(attribute, fromFolder(element.getAttribute(attribute)));
  }
  // The link to the Windows download page says the language, which that page is then in.
  const download = one('a[href$="downloading-for-windows.html"]');
  download.setAttribute('href', `${download.getAttribute('href')}?lang=${code}`);
  one('script[src$="github-pages/i18n.js"]').setAttribute('data-language', code);
  // The comment before <html> says where the page comes from, in the place of what the landing page says there.
  if (!document.childNodes[1] || document.childNodes[1].nodeType !== document.COMMENT_NODE)
    throw new Error('docs/index.html has no comment between <!DOCTYPE html> and <html>.');
  const comment = ` ${writtenMark} from ../index.html, with the texts
     of ../github-pages/locales/${code}.json. Change those, and run it again, rather than this file. `;
  // The parser leaves out the line between <html> and <head>.
  return `<!DOCTYPE html>\n<!--${comment}-->\n${document.documentElement.outerHTML.replace(/^(<html[^>]*>)<head>/, '$1\n<head>')}\n`;
}

/**
 * The language picker's first entry in each language, "Use browser setting" with the language's own name, by its code:
 * 「ブラウザの設定に従う（日本語）」 for `ja`. `textsOf` gives the texts of a language's file. A language whose file
 * leaves the text out has the English one, as a page shows any text that its language leaves out.
 */
export function browserSettingLabelsOf(textsOf) {
  const english = textsOf(defaultLanguage).useBrowserSetting;
  return Object.fromEntries(languages.map(({ code, name }) => [code, withLanguage(textsOf(code).useBrowserSetting ?? english, name)]));
}

/** A text as a string of JavaScript in single quotes, as i18n.js writes its strings. */
const quoted = text => `'${text.replace(/[\\']/g, '\\$&').replace(/\n/g, '\\n')}'`;

/** github-pages/i18n.js, `source`, with `labels`, the picker's first entry in each language, between its two comments. */
function scriptWithLabels(source, labels) {
  const start = source.indexOf(startOfLabels);
  const end = source.indexOf(endOfLabels);
  if (start === -1 || end < start) throw new Error(`docs/github-pages/i18n.js has no "${startOfLabels}" followed by "${endOfLabels}".`);
  const afterStart = source.indexOf('\n', start) + 1;
  const indent = source.slice(source.lastIndexOf('\n', end) + 1, end);
  const lines = [
    'const browserSettingLabels = {',
    ...Object.entries(labels).map(([code, label]) => `  ${/^[a-z]+$/.test(code) ? code : quoted(code)}: ${quoted(label)},`),
    '};',
  ].map(line => `${indent}${line}\n`).join('');
  return `${source.slice(0, afterStart)}${lines}${indent}${source.slice(end)}`;
}

/** docs/sitemap.xml: the landing page as it is, then in each language. */
function sitemap() {
  const pages = languages.length + 1;
  const urls = [addressOf(null), ...languages.map(({ code }) => addressOf(code))]
    .map((url, at) => `<url>\n  <loc>${url}</loc>\n${at === 0 ? '  <priority>1.0</priority>\n' : ''}</url>\n`);
  return `<?xml version="1.0" encoding="UTF-8"?>
<!--
  ${writtenMark}:
  the landing page as it is for a visitor, then the landing page in each of its languages, in the order of their list
  (github-pages/i18n.js).
  TL;DR: The addresses alone. Which address is the page in which language is said in the head of each page.
  Details: Search engines ask for that in one place, the head or the sitemap. Here every address would name every
  other: with ${languages.length} languages, ${pages} lines under each of ${pages} addresses.
  There is no <lastmod>: this cannot tell when a page last changed, and Google uses the date only where it is
  consistently accurate.
-->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

${urls.join('\n')}
</urlset>
`;
}

/** What this writes: each file by its path in docs/, with its text. */
export function websiteFiles() {
  const textsOf = code => JSON.parse(readText(path.join(docs, 'github-pages/locales', `${code}.json`)));
  const landing = landingPage(readText(path.join(docs, 'index.html')), textsOf(defaultLanguage).landing.summary);
  const files = new Map([['index.html', landing]]);
  const { document } = new JSDOM(landing).window;
  for (const { code } of languages)
    files.set(`${code}/index.html`, pageInLanguage(document, code, textsOf(code)));
  files.set('sitemap.xml', sitemap());
  files.set('github-pages/i18n.js', scriptWithLabels(readText(path.join(docs, 'github-pages/i18n.js')), browserSettingLabelsOf(textsOf)));
  return files;
}

/** The folders of docs/ that hold a landing page in a language, as their pages say. */
export function foldersOfLanguagePages() {
  return fs.readdirSync(docs, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && fs.existsSync(path.join(docs, entry.name, 'index.html')))
    .map(entry => entry.name)
    .filter(folder => readText(path.join(docs, folder, 'index.html')).includes(`<!-- ${writtenMark}`))
    .sort();
}

if (import.meta.main) {
  const files = websiteFiles();
  let changed = 0;
  for (const [file, text] of files) {
    const target = path.join(docs, file);
    if (fs.existsSync(target) && readText(target) === text) continue;
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, text);
    console.log(`Wrote docs/${file}.`);
    changed += 1;
  }
  // The page of a language that the list no longer has.
  for (const folder of foldersOfLanguagePages().filter(folder => !files.has(`${folder}/index.html`))) {
    fs.rmSync(path.join(docs, folder, 'index.html'));
    if (fs.readdirSync(path.join(docs, folder)).length === 0) fs.rmdirSync(path.join(docs, folder));
    console.log(`Removed docs/${folder}/index.html, as i18n.js does not list the language.`);
    changed += 1;
  }
  console.log(changed === 0 ? 'The website was up to date.' : `${changed} file(s) of the website written or removed.`);
}
