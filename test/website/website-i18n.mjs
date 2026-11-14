// What the website's script, docs/github-pages/i18n.js, shares with the tests: its list of languages and how it
// chooses one, which test/website/website-texts.mjs, the e2e suite and layout-in-every-language.mjs read.
//
// TL;DR: The script is run here as CommonJS runs a module, with a `module` to give its functions to.
// Details: The file is a script that a browser runs as it is, from GitHub Pages, without a build. It gives its
// functions to `module.exports` where there is one, and goes on to show the page otherwise. Node would take the file
// for an ES module, as package.json says "type": "module", where there is no `module`: the script would then reach
// for the page, which Node does not have. It is run in this realm, so that what it returns compares as the tests'
// own objects do.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const file = path.join(import.meta.dirname, '../../docs/github-pages/i18n.js');
const module = { exports: {} };
vm.runInThisContext(`(function (module) {${readFileSync(file, 'utf8')}\n})`, { filename: file })(module);

export const {
  languages, defaultLanguage, matchLanguage, resolveLanguage, followsBrowser, languageParts, linkParts, textOf,
  foldForSearch, searchFinds, matchesSearch,
} = module.exports;
