# The website in several languages: status

Started and implemented on 2026-11-11.

## What was asked

The website, `docs/index.html` with its Windows download page, in several
languages: Japanese first, the browser's language by default, a way for the
visitor to change it, and translations that anyone with a GitHub account can
contribute.

## Current state

- The website is in the application's 42 languages. English is the source,
  Japanese was written with the application's words, and the other 40 are
  machine translations, as the application's are. A visitor gets the language
  of the address (`?lang=ja`), then the one chosen in the page's picker
  before, then the first of the browser's languages that the website has, then
  English.
- Both pages have a language picker at their top right: a button with a globe
  and the page's language, which opens a box under it with a search field
  above the list of languages, as the application's list has. Each language is
  under its own name, and the search field has a magnifying glass at its end.
  A choice changes the texts in place, is kept for the next visit and for the
  other page, and is written into the address.
- Arabic and Hebrew are laid out from right to left, as in the application:
  the picker is at the top left then.
- The texts are in `docs/github-pages/locales/<code>.json`, and
  `docs/github-pages/i18n.js` puts them into the pages. `docs/TRANSLATING.md`
  has a section on adding a language to the website.
- The head of the landing page and `docs/sitemap.xml` name the page in each
  language, for search engines. The landing page has a description for them,
  its summary, which it did not have.

## What was decided, and why

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
  widths of a desktop and of a phone. The other languages were not looked at
  one by one: the unit tests check their files.

## Not done

- The published website was not looked at: GitHub Pages serves `main`.
- The troubleshooting page that both the website and the application link to
  is a Markdown file in English.
- The website sends what a visitor does to the analytics backend
  (`docs/github-pages/analytics.js`). The language that the page is shown in
  is not among what it sends.

- **The names of Windows' two buttons in the 40 machine translations** were
  written from memory, not read off a Windows in each language. Where one is
  not what Windows shows, the English words after it and the pictures still
  say which button is meant.

## Questions for the owner

- **The Japanese texts** of `docs/github-pages/locales/ja.json` follow the
  application's wording (マップ, 使用状況データ). They have not been reviewed.
- **The 40 machine translations** are published with the website when this is
  merged, as the application's are with its next release.
