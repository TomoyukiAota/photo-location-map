// What the website's script, docs/github-pages/i18n.js, shares with Node: its list of languages, how it chooses one,
// and how it puts the texts of a language into a page. generate-website.js writes the landing page in each language
// with it, and the tests of the website (test/website/) and the e2e suite read it.
//
// TL;DR: The script is run here as CommonJS runs a module, with a `module` to give its functions to.
// Details: The file is a script that a browser runs as it is, from GitHub Pages. It gives its functions to
// `module.exports` where there is one, and goes on to show the page otherwise. Node would take the file for an ES
// module, as package.json says "type": "module", where there is no `module`: the script would then reach for the
// page, which Node does not have. It is run in this realm, so that what it returns compares as the tests' own objects
// do.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const file = path.join(import.meta.dirname, '../../docs/github-pages/i18n.js');
const module = { exports: {} };
vm.runInThisContext(`(function (module) {${readFileSync(file, 'utf8')}\n})`, { filename: file })(module);

export const {
  languages, browserSettingLabels, defaultLanguage, matchLanguage, resolveLanguage, followsBrowser, withLanguage, linkParts,
  textOf, foldForSearch, searchFinds, matchesSearch, putTexts,
} = module.exports;
