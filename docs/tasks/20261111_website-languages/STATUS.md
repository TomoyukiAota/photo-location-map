# The website in several languages: status

Started and implemented on 2026-11-11. On 2026-11-12, the 40 machine
translations were reviewed, and the layout was looked at in every language. On
2026-11-13, the language picker got an entry that follows the browser. On
2026-11-14, the pages send the Language setting to the analytics backend.

## What was asked

The website, `docs/index.html` with its Windows download page, in several
languages: Japanese first, the browser's language by default, a way for the
visitor to change it, and translations that anyone with a GitHub account can
contribute.

On 2026-11-13, having tried the website, the owner asked what Claude thought of
an entry "Use browser setting" in the picker, as Photo Data Viewer's list has,
and then to add it.

On 2026-11-14, the owner asked that a page send, as it is opened, the browser's
languages and the visitor's Language setting to the analytics backend, and
send the setting again whenever it is changed.

## Current state

- The website is in the application's 42 languages. English is the source,
  Japanese was written with the application's words, and the other 40 are
  machine translations, as the application's are. A visitor gets the language
  of the address (`?lang=ja`), then the one chosen in the page's picker
  before, then the first of the browser's languages that the website has, then
  English. The picker's first entry, "Use browser setting", goes back to the
  browser's language.
- Both pages have a language picker at their top right: a button with a globe
  and the page's language, which opens a box under it with a search field
  above the list, as the application's list has: "Use browser setting (日本語)"
  first, with the language that the browser stands for, then each language
  under its own name. The search field has a magnifying glass at its end. A
  choice of a language changes the texts in place, is kept for the next visit
  and for the other page, and is written into the address.
- Arabic and Hebrew are laid out from right to left, as in the application:
  the picker is at the top left then.
- The texts are in `docs/github-pages/locales/<code>.json`, and
  `docs/github-pages/i18n.js` puts them into the pages. `docs/TRANSLATING.md`
  has a section on adding a language to the website.
- The head of the landing page and `docs/sitemap.xml` name the page in each
  language, for search engines. The landing page has a description for them,
  its summary, which it did not have.
- The 40 machine translations were reviewed on 2026-11-12, by sessions of
  Claude, in seven rounds, together with the application's and Photo Data
  Viewer's: 69 of the website's 1,040 texts were changed. The record of that
  review, with its sources and what it left open, is in the pull request of
  the application's translations (#692), as
  `docs/tasks/20261112_translation-review/`.
- The layout was looked at in all 42 languages, and holds in each: see
  [Checks](#checks).
- Each page load sends the analytics backend the browser's languages, as it
  did, and now the Language setting and the language that the page is in. A
  change of the setting in the picker is an event of its own.

## What was decided, and why

- **The Language setting goes with each page load, and each change of it is
  an event** (`Changed Language Setting`), as the owner asked on 2026-11-14,
  of the application as well. Photo Data Viewer sends its setting in the same
  way.
  - The setting is `auto` while the page follows the browser, and otherwise
    the language chosen in the picker or asked for in the address, which the
    page keeps. The language that the page is in goes with it: the browser's,
    for `auto`.
  - Choosing the setting that the page has sends nothing, as nothing changed.
  - `i18n.js` makes them, and `analytics.js`, which is loaded after it, sends
    them, as it does the other events of the pages.

- **"Use browser setting" first in the picker**, as the application's list has
  "Use macOS setting" and Photo Data Viewer's "Use browser setting". A
  language chosen in the picker, or asked for by a link with `?lang=`, is kept
  for every later visit, and the page had no way back to the browser's
  language but to clear the site's data. Chosen, the entry shows the page in
  the browser's language, forgets the kept choice and takes the language out
  of the address, so that the page follows the browser from then on, and an
  address sent to someone opens in their language. It is the chosen entry
  while the page follows the browser.
  - Its text is Photo Data Viewer's, in all 42 languages, which the review of
    2026-11-12 read with the rest: the two are the same entry, on two pages of
    the web.
  - The name of the browser's language is in an element of its own, so that
    it keeps its order in a page written in the other direction.
  - The search finds it by its words, the language's name among them, as the
    application's does. Enter in the search field chooses the first language
    that the search finds, and the entry only when it finds no language: a
    visitor who types 日本 and presses Enter means 日本語.
  - The box of the picker is 260 pixels wide, and wider where the entry needs
    more to be on one line, up to the window's width: 277 pixels in Japanese,
    with 日本語 as the browser's language. The languages' names all fit in 260
    pixels, and English stays at 260. In a window narrower than the entry
    needs, it takes another line.
- **No build step.** The website is the files of `docs/` as GitHub Pages
  serves them, so the texts are put into the page by a script in the browser.
  Pages written out for each language would need a generator, and a check that
  its output is up to date.
- **The pages hold the English texts**, and the script replaces them. Without
  the script, or when a language's file cannot be fetched, the page is in
  English. A test checks that the pages' texts are those of `en.json`.
- **An address for each language** (`?lang=ja`): a search engine reads a page
  as a visitor whose language is English, so it would never see the Japanese
  texts otherwise. The head of the landing page says which address is the page
  in which language, and the sitemap lists the addresses. The sitemap named
  the languages under each address too, while there were two: with 42, that
  would be 43 lines under each of 43 addresses, and search engines ask for it
  in one place.
- **The application's languages, all of them.** The website had English and
  Japanese at first, as asked then, and the owner expected the application's
  list in the picker. The list in `i18n.js` is the application's, in its order
  and under its names, which a test checks, and a language is found as the
  application finds it: `zh-TW` is `zh-Hant`, `pt` alone is `pt-BR`, `no` is
  `nb`.
- **The 40 machine translations use the application's words** for a photo,
  location data, the map, usage data and the application itself, and its
  register (formal in German, informal in Spanish). Four texts are the
  application's own in every language: the word for the language, the search
  field's placeholder, what the list says when the search finds nothing, and
  the sentence about the troubleshooting page.
- **A globe on the picker's button**, Material Icons' `language`: it says what
  the button is for to a visitor who cannot read the language that the page is
  in. It was proposed to the owner in the place of the flags.
- **Right to left for Arabic and Hebrew**: the script sets `dir` on the page
  with the language, and the styles name the sides by the direction of the
  text. The pictures of Windows on the download page are as they are.
- **A page in another language is hidden until its texts are in it**, for a
  second and a half at most, so that a Japanese visitor does not see the
  English texts first.
- **The language picker does not wait for those texts.** It is there once
  the page is parsed. When the texts do not come, the page is shown in English
  after the second and a half, and a visitor can choose a language in the
  picker. Texts that arrive after a choice do not replace it, even a choice of
  the language that the page is in.
- **A picker rather than the browser's own list**, which was here at first:
  the owner asked for a box like the application's, with a search field. The
  search finds a language by its own name, its English name, its name in the
  page's language or its code, as the application's does. The keyboard opens
  it, moves in it and chooses (the arrow keys, Enter, Escape), and a letter
  typed on the list moves to the language that starts with it, as in the
  application's list and Photo Data Viewer's.
- **The list shows seven languages and a half**, with a scrollbar that stays
  in view where the browser lets it be styled: half an entry at the box's edge
  shows in any browser that the list goes on.
- **A magnifying glass at the end of the search field**, as the owner asked
  for the application, Photo Data Viewer and the website alike: Material
  Icons' search, 20 pixels in the grey of the placeholder, 8 pixels from the
  field's end, over the field and taking no click.
- **No flags.** They were beside the names for a while, and the owner decided
  against them: a flag stands for a country, while English, Spanish or Arabic
  is the language of many, and the lists of macOS, Windows and most
  applications name each language in itself without one.
- **On a phone, the download buttons are as wide as their texts need.** They
  were 200px wide, which the English texts fit. The Japanese ones are longer,
  and their last letters were on a line of their own. Both buttons are now as
  wide as the wider of the two, and 200px at least, so the English page is as
  it was.
- **In a wider window, the two download buttons are side by side when they fit
  in the page's language, and one above the other when they do not.** They
  were side by side from 501px, where the English ones fit. In 14 languages
  they did not, and each text was on two lines: the Latvian ones need 578px.
  The owner decided that a natural translation comes before the layout, and
  that the layout is one for all languages which stretches and shrinks with
  the texts, rather than one made for the longest: a width from which every
  language fits would put the English buttons one above the other where they
  fit side by side. So the row wraps, which is by the texts' own widths, and
  `i18n.js` marks a row that wrapped, so that the styles give both buttons the
  width of the wider, as on a phone.
- **The centered sentences are broken into lines of about the same length**
  (`text-wrap: balance`), each sentence by itself. On a phone, most languages
  had the last word of a sentence alone on its line.
- **A line ends where the page's language ends its lines**, in every text of
  both pages (`i18n.css`). Japanese is broken between its phrases
  (`word-break: auto-phrase`) and Korean between its words
  (`word-break: keep-all`): a browser otherwise ends a line inside a word in
  both (トラブルシュー / ティング), and a Japanese sentence of the download
  page ended with one letter on a line of its own in a desktop's window
  (...してくださ / い。). That is a rule for one language, as the direction is
  for Arabic and Hebrew: how a language's lines are broken is the language's
  own. In the other languages, a text of several lines does not end with a
  word alone on its last line where the browser can avoid it
  (`text-wrap: pretty`): the steps of the download page ended with "info)."
  on a line of its own. A browser that does not know one of these breaks the
  lines as before.
- **A name stays on one line**: Photo Location Map, Photo Data Viewer, the
  developer's, and the English names of Windows' two buttons, which the steps
  of the download page have in parentheses. Lines of the same length put the
  end of a line inside the application's name in most languages on a phone
  (... Photo Location / Map ...), and the steps had "(More / info)". `i18n.js`
  gives these names no-break spaces in what a page shows; the pages' own
  texts and the languages' files keep ordinary spaces, so that they are
  written and checked as they read.
- **The texts of the file formats and the names** (Photo Location Map, JPEG,
  HEIF) are not translated.
- **The steps of the Windows download page** name the buttons of Windows'
  warning in the language, with the English words after them, as the two
  pictures on the page are of an English Windows. A test checks that the
  English words are there.
- **CI runs for a change to the website.** `.github/ci-filters.yml` listed all
  of `docs/` as documents, which skip the tests. The website is checked by CI,
  by `npm run test:website` and by the e2e suite's cases of the website, so
  the filter lists the documents of `docs/` and leaves the website out.
- **The e2e cases say the language in the address.** The website is otherwise
  in the language of the computer that the suite runs on, which is Japanese on
  the owner's.

## Checks

On macOS (Apple Silicon), 2026-11-11.

- `npm run test:website`: 222 tests pass, five of them for each language's
  file. They check the keys, the `<link>` tags, the names and the numbers of
  the steps of each file, that each file is listed, that the list is in the
  application's order and under its names, that the pages' own texts are those
  of `en.json`, the lines for search engines in the landing page and the
  addresses in the sitemap, how the language is chosen, the picker's search,
  and that `docs/.nojekyll` is there.
- The e2e suite's two cases of the website pass with `PLM_VISUAL=1`. The
  second is new: it serves `docs/` from an address of the computer and reads
  the landing page and the download page in Japanese, and the change of the
  language in the list. It also chooses two languages one after the other
  while the texts of the first are held back: the page stays in the second.
  And it loads a page in Japanese whose texts are held back: the page is shown
  in English with its list, and stays in the language chosen there when the
  texts arrive. It opens the picker, checks its globe, its 42 languages and
  where its magnifying glass is, searches in it, moves in it with the
  keyboard and by typing, and chooses with the mouse and with Enter. At the
  width of a phone, it checks that each download button keeps its Japanese
  text on one line and that both are equally wide. In Arabic, it checks that
  the page is laid out from right to left, with the picker at the left. Each
  of these steps fails without the code that it checks.
- `test/e2e/snapshots/website-desktop.png` and `website-narrow.png` changed:
  the language picker is at the top right, and the content is that much
  lower. `website-desktop-ja.png`, and `website-picker-ja.png` and
  `website-picker-ar.png`, the picker open, are new.
- The pages were looked at in Japanese, English, German and Arabic, at the
  widths of a desktop and of a phone.
- On 2026-11-12, after the review of the translations:
  `node test/website/layout-in-every-language.mjs` opened both pages in each
  of the 42 languages at 18 widths from 320px to 1200px, and found nothing
  that does not fit: no page wider than its window, no text cut, no download
  button on two lines, the two buttons of equal width when one is above the
  other, no name divided between two lines, and the picker's box within a
  window of 320px. Its pictures of both pages were looked at in all 42
  languages, at the width of a phone and at the width of a desktop; at the
  width of a phone, where the texts take several lines, again after the last
  changes to where a line ends, and at the width of a desktop in six
  languages then.
- The e2e case of the website also checks that the two download buttons are
  one above the other, equally wide, in Japanese in a window a little
  narrower than the two need side by side, and side by side in English in the
  same window. It measures what the two need, as that depends on the
  machine's fonts: 536px in Japanese on a Mac. It also checks that the
  application's name is on one line of the sentence about the source code, in
  English on a narrow phone. Without the code that it checks, each of these
  fails.
- On 2026-11-13, with "Use browser setting": `npm run test:website` passes,
  267 tests, which check that each language's text keeps its `{{language}}`.
  The e2e case of the website checks the entry's place and words, in Japanese
  and in Arabic, with the name of the language that the browser of the
  machine stands for; that it is not the chosen entry while the address asks
  for a language; that the search finds it, and Home goes to it; and that
  choosing it shows the browser's language, takes the language out of the
  address and forgets the kept choice, so that the download page follows the
  browser too, with the entry chosen. The last fails when the entry keeps a
  language. `website-picker-ja.png` changed: the box is 277 pixels wide.
  `node test/website/layout-in-every-language.mjs` finds nothing in any of
  the 42 languages, and measures the entry too: it is on one line in a
  desktop's window in each, in a box of 260 to 459 pixels (Greek). Its
  pictures of the box with the top of the list were looked at in all 42.
- On 2026-11-14, with the Language setting sent: the e2e case of the website
  answers the pages' analytics requests itself, and checks the fields of each
  page load (the browser's languages, `languageSetting`, `languageInUse`) on
  both pages, with `ja` from the address and with `auto`; the change to
  English, and to "Use browser setting" as `auto` with the browser's language;
  and that choosing the setting that the page has sends nothing. With that
  check of i18n.js taken out, or with the setting never `auto`, the case
  fails.

## Not done

- The published website was not looked at: GitHub Pages serves `main`.
- The troubleshooting page that both the website and the application link to
  is a Markdown file in English.
- The website sends what a visitor does to the analytics backend
  (`docs/github-pages/analytics.js`). The language that the page is shown in
  is not among what it sends.

- **The names of Windows' two buttons in the 40 machine translations** were
  looked up in the review. Where a page shows or quotes the warning of a
  Windows in the language, the names are the ones it has: the Estonian link's
  name is from a picture on a page of the Estonian state. In about half of the
  languages no such page was found, and the names are the reviewers' best
  knowledge; the review's record lists them. Where one is not what Windows
  shows, the English words after it and the pictures still say which button
  is meant.

## Questions for the owner

- **The Japanese texts** of `docs/github-pages/locales/ja.json` follow the
  application's wording (マップ, 使用状況データ). They have not been reviewed.
- **The 40 machine translations** are published with the website when this is
  merged, as the application's are with its next release.
