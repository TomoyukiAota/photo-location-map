# The website for search engines in each language: status

Investigated and implemented on 2026-11-16. On 2026-11-17, the title of the
landing page got a description in each language, and a `robots.txt` at the
root of the account's GitHub Pages names the sitemap.

## What was asked

On 2026-11-16, the owner asked how the website does in search engines now that
it is in the application's 42 languages, and what could be done for it. After
the investigation below, the owner chose its recommendation: the landing page
written out in each language, at an address of its own.

The owner also decided that the addresses of the landing page in a language
that were published from 2026-11-14 (`?lang=ja`) need not keep working, as
they were published for two days only.

On 2026-11-17, the owner asked for the title in each language, the first of
what was left, and chose its English and Japanese wording. The owner then had
a `robots.txt` put at `https://tomoyukiaota.github.io/robots.txt`, so that
search engines find the sitemap without its being submitted again in their
tools when it changes.

## What was found

The published website, read as it is served, without running its scripts:

- `https://tomoyukiaota.github.io/photo-location-map/?lang=ja` was the same
  file as the landing page itself, to the byte: `<html lang="en">`, and the
  English title and description. The texts of a language were put in by
  `i18n.js` in the browser only, so every language's address was the English
  page to anything that does not run the script.
- The title was "Photo Location Map" in every language (`landing.pageTitle`):
  a search result's link had no word of the language.
- There was no canonical link, no Open Graph tags, no structured data, and no
  `<h1>` on the landing page.
- `https://tomoyukiaota.github.io/robots.txt` is a 404, as there is no site at
  the root of the account's GitHub Pages: nothing tells search engines where
  the sitemap is, so it is to be submitted in their tools.
- The Windows download page has `noindex`, as it should.
- A page in another language than English was hidden for up to a second and a
  half, until its texts were fetched.

What reads the page how:

- **Google** renders a page with a headless Chromium, so it can see the
  translations, and tells a page's language by its visible content, not by
  `lang`. Its guide lists URL parameters (`site.com?loc=de`) as "not
  recommended" for the versions of a page in other languages, and says that
  server-side or pre-rendering is "still a great idea", as "not all bots can
  run JavaScript". The hreflang annotations were valid, `zh-Hans`, `zh-Hant`
  and `sr-Latn` among them: the guide gives `zh-Hant` and `zh-Hans` as examples
  of a script (ISO 15924).
- **Bing** says that it processes JavaScript, with limitations at scale, and
  has said that hreflang is a weaker signal for it than `content-language`.
- **The crawlers of AI assistants** (GPTBot, OAI-SearchBot, ClaudeBot and
  others) do not run JavaScript, by a study of Vercel and MERJ (December 2024).
- **The previews of links** in social networks and chats are made from the page
  as it is served.
- **Baidu** was reported in 2019 to be refused by GitHub Pages (403). A request
  with Baiduspider's User-Agent was answered (200) on 2026-11-16, but a refusal
  by its addresses cannot be checked from here. GitHub Pages leaves nothing to
  do about it.

Sources:
[Managing multi-regional and multilingual sites](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites),
[Localized versions of your pages](https://developers.google.com/search/docs/specialty/international/localized-versions),
[JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics),
[x-default (2013)](https://developers.google.com/search/blog/2013/04/x-default-hreflang-for-international-pages),
[Bing's recommendations for JavaScript sites](https://www.searchenginejournal.com/bings-recommendations-for-optimizing-javascript-sites-for-search-crawlers/276507),
[Bing: hreflang a weak signal](https://www.seroundtable.com/bing-hreflang-weak-signal-30099.html),
[The rise of the AI crawler](https://vercel.com/blog/the-rise-of-the-ai-crawler).

## Current state

- The landing page is written out in each language, `docs/<code>/index.html`,
  at `https://tomoyukiaota.github.io/photo-location-map/<code>/`. As it is
  served, it is in its language: `lang` and `dir`, title, description and
  texts. Its canonical link is its own address, and its head names the landing
  page in every language and the landing page as it is (`x-default`).
- `script/website/generate-website.js` (`npm run generate:website`) writes
  them from `docs/index.html` and the texts of each language, and writes the
  addresses for search engines in the head of `docs/index.html` and in
  `docs/sitemap.xml`. `npm run test:website` fails until what it writes is up
  to date, and says to run it.
- The landing page as it is (`/`) is the `x-default`: it shows the language
  kept from a choice, or the browser's, in place, as before. It no longer reads
  `?lang=`.
- In the picker of a landing page, a language goes to the landing page in that
  language, and "Use browser setting" goes to the landing page as it is, which
  follows the browser, forgetting the kept choice. It forgets it on that page
  too, which still follows the browser when Back shows it again from the
  browser's cache after a language was chosen in it (a finding of the review
  of #726).
- Opening the landing page in a language keeps its language as the choice, as
  `?lang=` did, for the landing page as it is and the download page.
- The Windows download page is as it was: its language is the one of `?lang=`,
  then the kept choice, then the browser's. The landing page in a language
  links to it with `?lang=<code>`.
- `https://tomoyukiaota.github.io/robots.txt` allows everything and names
  `https://tomoyukiaota.github.io/photo-location-map/sitemap.xml`. It is in the
  repository `TomoyukiAota/tomoyukiaota.github.io`, which GitHub Pages serves
  at the root of the account's sites, as search engines read `robots.txt` only
  at the root of a host. Its README says why it is there. When the sitemap
  moves, change its `Sitemap:` line.
- The title of the landing page is the name and what the application does, in
  each language: "Photo Location Map - Show where photos were taken on a map",
  "Photo Location Map - 写真の撮影場所をマップに表示".

## What was decided, and why

- **The landing page is written out in each language**, rather than translated
  in the browser only: then every search engine, the crawlers of AI assistants
  and the previews of links read each language, as Google does. The page in a
  language is shown at once, as it holds its texts.
- **The address of a language is a folder** (`/ja/`), not a parameter: GitHub
  Pages serves files, and a page written out for a language is a file of its
  own. Google's guide lists a parameter as not recommended, and folders among
  the structures that it describes.
- **`/en/` as well as `/`**: a search for English leads to `/en/`, which is in
  English in any browser, while `/` follows the visitor, as `?lang=en` and `/`
  did. Google describes `x-default` for such a page as well, a home page whose
  content changes with the visitor's location or Accept-Language (x-default,
  2013).
- **The pages are committed, with a test that they are up to date**, rather
  than written by a workflow that publishes the website. GitHub Pages keeps
  publishing the files of `docs/` as they are, and what it publishes is in the
  repository and in the diff of a pull request. A text changed on GitHub's
  web page then needs `npm run generate:website` as well, which the maintainer
  can run for a contributor (`docs/TRANSLATING.md`).
- **`i18n.js` puts the texts into the pages for the generator** with
  `putTexts()`, which it uses in the browser as well: a page in a language is
  what the browser would show.
- **The page is parsed once, and copied for each language.** A jsdom window for
  each language took 3.1 seconds for the 42; copies take 0.8, and
  `npm run test:website` about 2.5 seconds in all.
- **CRLF is read as LF** by the generator and the test, as Git on Windows, CI's
  among them, checks the files out with CRLF.
- **No redirect of `?lang=`**, as the owner decided (above). Such an address
  shows the landing page as it is.
- **`robots.txt` names the sitemap**, rather than the sitemap being submitted
  in each search engine's tools again when it changes. Google Search Console
  had the sitemap submitted on 2020-12-02, and had last read it on 2021-09-03,
  with the one page that it listed then: Google reads a sitemap again at its
  own pace, which a `Sitemap:` line in `robots.txt` does not change either.
  Google also finds the page of a new language from the alternates in the head
  of the pages that it reads again, so neither is needed for a new language.
  `robots.txt` names the sitemap to every search engine at once. Search
  Console's Sitemaps report lists only the sitemaps submitted in it.
- **No `<lastmod>` in the sitemap**: the generator cannot tell when a page last
  changed, and Google uses the date only where it is consistently accurate.
  The dates before were of 2026-11-11, older than the pages' last changes.
- **The download page is not written out**: it has `noindex`, so search
  engines do not show it.
- **No Open Graph tags yet**: a preview is worth having with a picture, which
  is to be made (1200×630). The previews get the title and description of the
  language from the pages as they are served.
- **The title: the name, a dash, and what the application does.** The owner
  chose the English and the Japanese on 2026-11-17, the Japanese with マップ,
  as the website and the application say, rather than 地図, which people search
  with more often. The other languages say it in the words of their
  `landing.summary`, which the review of 2026-11-12 read, without its full
  stop; Korean, as the Japanese, without its polite ending (표시합니다 to 표시).
  The dash is each language's own, as in the application's
  `directoryTree.openedFolder`: ` — ` in Russian and Ukrainian, ` – ` in
  Bulgarian and Hebrew, ` - ` in the others. The name comes first in Arabic
  and Hebrew as well, as a reader of either reads it first.

## Checks

On macOS (Apple Silicon), 2026-11-16 and 17.

- `npm run test:website`: 271 tests pass. New ones check that the pages, the
  head's addresses and the sitemap are as `npm run generate:website` writes
  them; that there is a page for each language and for no other; that each
  page is in its language as served (`lang`, `dir`, title, description,
  summary, the icon's `alt`, and the words of a sentence with a link and of its
  link); the canonical link and the alternates of each page and of the landing
  page as it is; the language in the script tag of each page, its link to the
  download page in its language, and that each of its addresses of the website
  is a file. With a text of `ja.json` changed and the pages not written again,
  the first fails and says to run `npm run generate:website`.
- `npm run lint:script` passes.
- After `npm run build:prod`, `PLM_VISUAL=1 npm run test:e2e -- -g "download
  website"`: both cases of the website pass, and their five pictures are as
  before. The first opens the landing page in English from the disk. The
  second opens `/ja/`, which keeps Japanese as the choice; English chosen in
  its picker goes to `/en/`, and the change of the setting is sent by the page
  that was left; the steps with texts that come late are on the download page,
  which still shows a chosen language in place; `/ar/` is laid out from right
  to left; "Use browser setting" there goes to `/`, in the browser's language,
  with no choice kept and `auto` sent; Japanese from there goes to `/ja/`,
  whose link opens the download page in Japanese. Without the code that goes
  to the page in a language, the case fails at the address of the page in
  English; without the code that keeps the language of the page opened, at
  the kept choice. "Use browser setting" chosen again on `/`, with a language
  kept meanwhile, forgets it, and fails to without the code that does.
- The e2e case lists the analytics events of its window across page loads
  (sessionStorage), as a choice in the picker of a landing page is sent by the
  page that is left, or by the next one.
- `node test/website/layout-in-every-language.mjs --languages=ja,ar,de,lv`,
  which now opens the pages at their new addresses, finds nothing.
- With the title in each language (2026-11-17): `npm run test:website` passes,
  271 tests, among them the check that each page's `<title>` is its language's
  `landing.pageTitle`.

## Not done

- **The search engines' own tools**, which need the owner's accounts, and are
  optional: in Google Search Console, submit `sitemap.xml` once more after the
  pages in each language are published, which makes Google read it sooner; test
  `/ja/` with the URL Inspection's live test; and watch the Page indexing
  report.
- **Open Graph tags**, with a picture (above).
- **Smaller ones**: an `<h1>` for the application's name, a `title` for the
  video's frame, and structured data (`SoftwareApplication`), for which Google
  shows no rich result without ratings or reviews.
