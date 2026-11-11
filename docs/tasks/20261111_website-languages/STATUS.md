# The website in several languages: status

Started and implemented on 2026-11-11.

## What was asked

The website, `docs/index.html` with its Windows download page, in several
languages: Japanese first, the browser's language by default, a way for the
visitor to change it, and translations that anyone with a GitHub account can
contribute.

## Current state

- The website is in English and Japanese. A visitor gets the language of the
  address (`?lang=ja`), then the one chosen in the page's list before, then the
  first of the browser's languages that the website has, then English.
- Both pages have a list of languages at their top right. A choice changes the
  texts in place, is kept for the next visit and for the other page, and is
  written into the address.
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
- **An address for each language** (`?lang=ja`), named in the head and in the
  sitemap: a search engine reads a page as a visitor whose language is
  English, so it would never see the Japanese texts otherwise.
- **A page in another language is hidden until its texts are in it**, for a
  second and a half at most, so that a Japanese visitor does not see the
  English texts first.
- **The list of languages does not wait for those texts.** It is there once
  the page is parsed. When the texts do not come, the page is shown in English
  after the second and a half, and a visitor can choose a language in the
  list. Texts that arrive after a choice do not replace it.
- **On a phone, the download buttons are as wide as their texts need.** They
  were 200px wide, which the English texts fit. The Japanese ones are longer,
  and their last letters were on a line of their own. Both buttons are now as
  wide as the wider of the two, and 200px at least, so the English page is as
  it was.
- **The texts of the file formats and the names** (Photo Location Map, JPEG,
  HEIF) are not translated.
- **The steps of the Windows download page** name the buttons of Windows'
  warning in Japanese with the English words after them, as the two pictures
  on the page are of an English Windows.
- **CI runs for a change to the website.** `.github/ci-filters.yml` listed all
  of `docs/` as documents, which skip the tests. The website is checked by CI,
  by `npm run test:website` and by the e2e suite's cases of the website, so
  the filter lists the documents of `docs/` and leaves the website out.
- **The e2e cases say the language in the address.** The website is otherwise
  in the language of the computer that the suite runs on, which is Japanese on
  the owner's.

## Checks

On macOS (Apple Silicon), 2026-11-11.

- `npm run test:website`: 15 tests pass. They check the keys and the `<link>`
  tags of each file, that each file is listed, that the pages' own texts are
  those of `en.json`, the lines for search engines in the landing page and in
  the sitemap, how the language is chosen, and that `docs/.nojekyll` is there.
- The e2e suite's two cases of the website pass with `PLM_VISUAL=1`. The
  second is new: it serves `docs/` from an address of the computer and reads
  the landing page and the download page in Japanese, and the change of the
  language in the list. It also chooses two languages one after the other
  while the texts of the first are held back: the page stays in the second.
  And it loads a page in Japanese whose texts are held back: the page is shown
  in English with its list, and stays in the language chosen there when the
  texts arrive. At the width of a phone, it checks that each download button
  keeps its Japanese text on one line and that both are equally wide. Each of
  these steps fails without the code that it checks.
- `test/e2e/snapshots/website-desktop.png` and `website-narrow.png` changed:
  the list of languages is at the top right, and the content is that much
  lower. `website-desktop-ja.png` is new.

## Not done

- The published website was not looked at: GitHub Pages serves `main`.
- The troubleshooting page that both the website and the application link to
  is a Markdown file in English.
- The website sends what a visitor does to the analytics backend
  (`docs/github-pages/analytics.js`). The language that the page is shown in
  is not among what it sends.

## Questions for the owner

- **The other languages.** The application has 42 languages, and the website
  two, as asked. The website has about 25 short texts: say so if it should get
  the application's other languages as machine translations too.
- **The Japanese texts** of `docs/github-pages/locales/ja.json` follow the
  application's wording (マップ, 使用状況データ). They have not been reviewed.
