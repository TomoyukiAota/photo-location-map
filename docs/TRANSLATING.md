# Translating this application

Photo Location Map can be shown in the [languages](#languages) that Windows or
macOS is fully translated into. The translations are files in this repository,
so anyone with a GitHub account can improve one or add a language through a
pull request, from GitHub's web editor, without setting anything up on their
computer.

**Most of the translations were written by a machine and have not been read by
a speaker of the language yet.** If you speak one of them, reading its texts
in the application and correcting what is wrong or unnatural is the most
useful contribution: see [Improve a translation](#improve-a-translation).

In November 2026 they were reviewed, again by a machine, in seven rounds, for
accuracy and for what similar software says in each language
([the record](./tasks/20261112_translation-review/STATUS.md)). What that
review could not settle without a speaker is listed for each language in
`docs/tasks/20261112_translation-review/evidence/open-<group>.md`, with the
sources of what it did settle in `decisions-<group>.md` beside it, and where
those sources are read in `sources.md`: a good place to start.

## Where the texts are

| File | What it is |
| --- | --- |
| `src-shared/i18n/locales/en.json` | English, the source. Every other file is a translation of it. |
| `src-shared/i18n/locales/<code>.json` | One file per language, named by its language tag (`ja`, `de`, `pt-BR`), with the keys of `en.json`. |
| `src-shared/i18n/languages.ts` | The languages that the application offers, in the order that it lists them. |
| `src/app/shared/i18n/moment-locales.ts` | Loads, for each language, the days of the week and AM and PM of dates. |

Each text has a key on the left and the text on the right:

```json
"sidebar": {
  "openFolder": "Open Folder"
}
```

Translate the texts on the right. Never change the keys on the left: the code
finds the texts by them.

## Add a language

1. Fork the repository and open your fork in GitHub's web editor (press `.` on
   its page), or edit the files one at a time with the pencil button.
2. Create `src-shared/i18n/locales/<code>.json`, where `<code>` is the
   language's tag: the language alone (`de`, `fr`, `ko`) unless a region matters
   for the text (`pt-BR`, `zh-Hant`). Paste the content of `en.json` into it and
   translate every text.
3. Add the language to `src-shared/i18n/languages.ts`. For German, say:
   - at the top, `import de from './locales/de.json';`
   - in the `languages` list,
     `{ code: 'de', name: 'Deutsch', englishName: 'German', direction: 'ltr', momentLocale: 'de', geomanLocale: 'de', translation: de },`
     - `name` is the language's name written in the language itself, with a
       capital letter where the script has them. The list is in the order of
       these names: those in Latin letters by the alphabet, then those in
       other scripts.
     - `englishName` is its name in English, which the search of the list
       also finds it by.
     - `direction` is `rtl` for a language written from right to left, such
       as Arabic and Hebrew, which the application is then laid out in, and
       `ltr` for any other.
     - `momentLocale` is the name of the language in
       [moment's locales](https://github.com/moment/moment/tree/develop/locale),
       most of which have the language's code in lower case (`pt-br`, `zh-tw`).
     - `geomanLocale` is its name among `SupportLocales` in
       [Leaflet-Geoman's type definitions](https://github.com/geoman-io/leaflet-geoman/blob/develop/leaflet-geoman.d.ts),
       which gives the tooltips shown while a region is drawn on the map. Write
       `en` when the language is not there.
4. Add `import 'moment/locale/de';` to `src/app/shared/i18n/moment-locales.ts`,
   with the name you gave as `momentLocale`. Without it, dates keep English
   days of the week.
5. Open a pull request titled `Add <language> translation`. If you can, add
   screenshots of the application in your language; see
   [Checking how it looks](#checking-how-it-looks).

The website has texts of its own, in the same languages: translate them too,
so that the website offers your language as well ([The website](#the-website)).

Photo Data Viewer, which opens for **View Data**, has translations of its own,
in the same languages:
[its guide](https://github.com/TomoyukiAota/photo-data-viewer/blob/main/docs/TRANSLATING.md).
Until it has a new language too, its window is in English. The two applications
share many words (folder, thumbnail, settings), so use the same ones in both.

## Improve a translation

Edit the text in `src-shared/i18n/locales/<code>.json` and open a pull request
titled `Improve <language> translation`, saying what was wrong. Once you have
read every text of a language, say so in the pull request and change its row
in the [table](#languages) to "Reviewed by" with your GitHub name.

## What the check verifies

Tests in this repository run on every pull request, on three operating systems,
and tell you what is wrong before anyone reviews the pull request
(`src-shared/i18n/locales.spec.ts`, `src/app/shared/moment-to-string.spec.ts`):

- Every key in your file exists in `en.json`. A misspelled key, or a key for a
  text that no longer exists, fails.
- No text is empty. A text you cannot translate yet: delete its line, and the
  application shows the English text in its place. When the line was the last
  one in its group, also delete the comma at the end of the line before it;
  otherwise the file is no longer valid JSON, and the check fails at once. The
  test's output names the texts that a language is still missing, without
  failing.
- The `{{placeholders}}` of a text are those of the English text. The
  application fills them in: `{{appName}}` is "Photo Location Map", `{{count}}`
  is a number of files or photos, `{{path}}` is a folder's path.
- The `<tags>` of a text are those of the English text. A tag pair such as
  `<pageLink>the troubleshooting page</pageLink>` becomes a link around the
  words inside it, so keep the pair and put it around the words that are the
  link in your language, wherever they are in the sentence.
- `dateTime.weekdayPattern`, when the file has it, contains `ddd`.
- Every file is listed in `src-shared/i18n/languages.ts`, and the locale of
  moment that each language names is loaded.
- The list of `languages.ts` is in the order of the languages' names, each has
  the English name that `Intl.DisplayNames` gives its code, and each names a
  locale that Leaflet-Geoman has (`src-shared/i18n/languages.spec.ts`).

To run them on your computer, set the repository up as
[CONTRIBUTING.md](./CONTRIBUTING.md) says, then:

```bash
npm run test:unit:ng
```

## Writing the texts

- A natural and accurate translation comes before the layout. Write what a
  speaker of your language would write: the words that widely used software
  has for the same thing in your language (Windows, macOS, a photo application,
  a file manager, a map), in a way that fits this application, which shows on
  a map where photos were taken, to anyone who has photos. Do not shorten or
  abbreviate a text for the room that it has. The layout is the same in every
  language and is made to hold for long words and long sentences; where a text
  is cut or runs out of its box, that is a bug of the layout: say so in the
  pull request, or open an issue.
- Names stay as they are: Photo Location Map, macOS, Windows, EXIF, DateTimeOriginal, JPEG,
  HEIF, TIFF, Live Photos, GitHub, Google Maps, Google Street View, Explorer
  (or the name that Windows gives it in your language).
- `language.title` and `settings.tabs.language` keep the English word in
  parentheses, as in `言語 (Language)`, so that someone who cannot read the
  current language still finds where to change it.
- The three texts under `language.systemLanguage` are one choice, to use the
  language that the operating system is set to, as it is shown on macOS, on
  Windows and on any other operating system. Write each as your language needs it around the
  name. `{{language}}` is the language that the choice stands for on the
  computer, such as `English`.
- `directoryTree.contextMenu.selectOnlyThisFile` and `selectOnlyThisFolder` are
  one item of the menu of the list of folders, as it is shown on a file and on
  a folder. English says the same of both; name the file and the folder where
  your language does, as Japanese does.
- `language.confirm` is the button that confirms the language at the first
  launch, shown in the language that is chosen in the list above it. Use the
  word that a button confirming a choice has in your language: Japanese has
  `決定` rather than `OK`.
- `language.search` is the placeholder of the field above the list of
  languages, which narrows the list down to what is typed in it;
  `language.noLanguagesFound` is shown in the list when nothing is left.
- Quotation marks are those of your language: “ ” in English, 「 」 in
  Japanese, « » in French. A straight double quote would have to be written
  `\"` in the file.
- The texts under `menu` are the application menu. Use the words that
  applications of your language use on macOS and Windows for the same items
  (Quit, Hide Others, Actual Size, Undo).
- A line break is written `\n`. Keep the ones in the questions asked before a
  restart (`settings.confirmRestart`, `settings.cache.confirmDelete`) and in
  the update dialog (`autoUpdate.message`). `chart.resetZoom` is a tooltip under
  a small icon: two short lines.
- `unhandledError.message` is shown in a dialog when an error occurs that the
  application did not handle, above the error's details, which stay in English.
  `unhandledError.copyError` is the dialog's button that copies the message and
  the details, for a report.
- `explorerContextMenu.openWithAccessKey` is the item added to Explorer's
  context menu on Windows. `&` marks the letter after it as the item's access
  key; languages that do not write in Latin letters put it at the end, as
  `(&P)`.
- The days of the week and AM and PM in dates come from moment's locale, not
  from the file. One value in the file is not a text but a pattern of moment:
  `dateTime.weekdayPattern`, how a date writes the day of the week. `ddd` is its
  short name (Mon, 月); Japanese writes `(ddd)`, shown as `(月)`. Keep `ddd` and
  change only what is around it, or leave the key out when your language writes
  the day of the week plainly. Letters would be read as a pattern too, so a word
  goes in square brackets: `[le] ddd`.
- Texts with a number keep one form, whatever the number is ("Loaded 1
  files."). Where your language has several forms of a word for several
  numbers, word the text so that the number can be any, as "Loaded files:
  {{count}}." or "All files were loaded ({{count}} in total)." If it cannot do
  without plural forms, say so in the pull request.
- `photoInfo.pathTooLong` and `photoInfo.generatedThumbnailPathTooLong`, which
  are shown on Windows, name a shortcut, `Ctrl+Shift+I`. Write its keys as
  keyboards and Windows name them in your language: `Strg+Umschalt+I` in
  German, `Ctrl+Maj+I` in French, and `Ctrl+Shift+I` where the keys keep their
  English names.
- In a language written from right to left, the application puts each value of
  a placeholder on its own in the text, so that a path, a number or a name in
  Latin letters keeps its order: write the text around the placeholder as you
  read it.
- `settings.dateTime.clockSystem` is the label of the field that chooses
  between a clock of 12 hours and one of 24, and `clock12` and `clock24` are
  its two choices. Name them as the settings of phones and computers do in your
  language, not as a number of hours, which reads as a length of time:
  `12- oder 24-Stunden-Format` with `12-Stunden-Format` and `24-Stunden-Format`
  in German. The field is as wide as its label and its choices need.
- English is written plainly, without exclamation marks. Follow the register
  that an application's dialogs have in your language.
- The Welcome dialog says what the application collects
  (`welcome.usageInfoCollection`). Translate it faithfully: a user agrees to it
  by using the application.
- Machine translation can give a first draft, but a wrong text is worse than an
  English one for the people it is for. Say in the pull request whether the
  translation was reviewed by a speaker of the language; until it is, it is
  marked so in the table below.

## Checking how it looks

With the repository set up ([CONTRIBUTING.md](./CONTRIBUTING.md)), `npm start`
starts the application; choose your language in **Settings**, on its first tab,
and the application restarts in it. Look at the Welcome dialog (**Help** >
**Show Welcome Dialog**), the About box, each tab of the Settings dialog, the
menus, and the main window with a folder of photos opened: the status bar, a
photo's popup on the map with its menu, and the chart.

## The website

The [website](https://tomoyukiaota.github.io/photo-location-map/), where the
application is downloaded from, has translations of its own, in the
application's languages. A visitor sees it in the browser's language when the
website has it, and can choose another one in the language picker at the top
of the page, which keeps it for later visits. The picker's first entry, "Use
browser setting", goes back to the browser's language.

| File | What it is |
| --- | --- |
| `docs/github-pages/locales/en.json` | English, the source, which the pages themselves hold as well. |
| `docs/github-pages/locales/<code>.json` | One file per language, with the keys of `en.json`. |
| `docs/github-pages/i18n.js` | The languages that the website offers, at its top, and how a page gets its texts. |

To add a language:

1. Create `docs/github-pages/locales/<code>.json`, paste the content of
   `en.json` into it and translate every text, with the application's words
   for the same things. A text that you leave out is shown in English.
   - `<link>` and `</link>` are around the words of a link: keep the pair,
     around the words that are the link in your language.
   - `useBrowserSetting` is the first entry of the language picker, which
     follows the browser's language: the page puts that language's name in
     the place of `{{language}}`, which you keep as it is. Word it as Photo
     Data Viewer's `language.useBrowserSetting` is in your language, as the
     two are the same entry.
   - The names stay as they are: Photo Location Map, Photo Data Viewer,
     Windows Defender SmartScreen, GitHub, EXIF. Write them with ordinary
     spaces: the page keeps Photo Location Map, Photo Data Viewer, the
     developer's name, More info and Run anyway on one line by itself.
   - The steps of the Windows download page name the two buttons of Windows'
     warning as a Windows in your language shows them, with the English words
     after them in parentheses, as the two pictures on the page are of an
     English Windows: `„Weitere Informationen“ (More info)` in German.
2. Add the language to the `languages` list at the top of
   `docs/github-pages/i18n.js`, where the application's list has it, with the
   same name and English name, and with `rtl: true` when it is written from
   right to left.
3. So that search engines find the page in your language, add its line next to
   those of the other languages in the head of `docs/index.html`
   (`<link rel="alternate" hreflang="<code>" …>`), and its address next to
   theirs in `docs/sitemap.xml`.
4. Open a pull request titled `Add <language> translation of the website`, or
   add this to the pull request of the application's translation.

`npm run test:website`, which runs on every pull request, checks what the check
of the application's texts checks, and a little more: the keys, the `<link>`
tags, the `{{language}}`, the names, the numbers of the steps, that each file
is listed, and that the list is in the order of the application's. To look at
the result, serve the folder (`python3 -m http.server 8080 --directory docs`)
and open `http://localhost:8080/?lang=<code>`.

`node test/website/layout-in-every-language.mjs` opens the two pages in every
language at 18 widths, from a phone's to a desktop's, and reports what does not
fit: run it after a change to the website's layout or to a text of a button.
The layout is the same for every language and follows its texts: the two
download buttons are side by side when they fit in the page's language, and
one above the other when they do not. A line ends where the page's language
ends its lines, Japanese between its phrases and Korean between its words,
and not inside one of the names that the page keeps on one line.

The website's texts have the status of the application's
([Languages](#languages)): English is the source, Japanese is the
maintainer's, and the others are machine translations until a speaker reviews
them. In those, the names of Windows' two buttons were looked up in the review
of November 2026. Where a page was found that shows or quotes the warning of a
Windows in the language, the name is the one it has; in the other languages it
is the reviewers' best knowledge, not read off a Windows.

## How the language is chosen

- The Language setting, on the first tab of the Settings dialog. Its default,
  to use the operating system's setting ("Use macOS setting" on macOS, "Use
  Windows setting" on Windows, "Use system setting" elsewhere), follows the
  operating system's preferred languages, and the first that has a translation
  wins. Each is tried as it is (`pt-BR`, `zh-Hant`), then without its last
  parts (`zh-Hant-TW` is `zh-Hant`, `en-GB` is `en`), then as a language that
  the list has under another code: `zh-TW`, `zh-HK` and `zh-MO` are `zh-Hant`
  and any other Chinese is `zh-Hans`; `pt` alone is `pt-BR` and any other
  Portuguese is `pt-PT`; `no` and `nn` are `nb`; `sr` is `sr-Latn`
  (`src-shared/i18n/resolve-language.ts`). English is shown when none has a
  translation.
- At the first launch, the application asks for the language before anything
  else, with the operating system's language chosen.
- A changed language restarts the application.

## Languages

The languages that Windows 11 has a language pack for or that the applications
of macOS are translated into, in the order that the application lists them.
Photo Data Viewer has the same ones.

| Code | Language | In English | Status |
| --- | --- | --- | --- |
| `id` | Bahasa Indonesia | Indonesian | Machine translation, not reviewed by a speaker yet. |
| `ms` | Bahasa Melayu | Malay | Machine translation, not reviewed by a speaker yet. |
| `ca` | Català | Catalan | Machine translation, not reviewed by a speaker yet. |
| `cs` | Čeština | Czech | Machine translation, not reviewed by a speaker yet. |
| `da` | Dansk | Danish | Machine translation, not reviewed by a speaker yet. |
| `de` | Deutsch | German | Machine translation, not reviewed by a speaker yet. |
| `et` | Eesti | Estonian | Machine translation, not reviewed by a speaker yet. |
| `en` | English | English | The source. |
| `es` | Español | Spanish | Machine translation, not reviewed by a speaker yet. |
| `eu` | Euskara | Basque | Machine translation, not reviewed by a speaker yet. |
| `fr` | Français | French | Machine translation, not reviewed by a speaker yet. |
| `gl` | Galego | Galician | Machine translation, not reviewed by a speaker yet. |
| `hr` | Hrvatski | Croatian | Machine translation, not reviewed by a speaker yet. |
| `it` | Italiano | Italian | Machine translation, not reviewed by a speaker yet. |
| `lv` | Latviešu | Latvian | Machine translation, not reviewed by a speaker yet. |
| `lt` | Lietuvių | Lithuanian | Machine translation, not reviewed by a speaker yet. |
| `hu` | Magyar | Hungarian | Machine translation, not reviewed by a speaker yet. |
| `nl` | Nederlands | Dutch | Machine translation, not reviewed by a speaker yet. |
| `nb` | Norsk bokmål | Norwegian Bokmål | Machine translation, not reviewed by a speaker yet. |
| `pl` | Polski | Polish | Machine translation, not reviewed by a speaker yet. |
| `pt-BR` | Português (Brasil) | Portuguese (Brazil) | Machine translation, not reviewed by a speaker yet. |
| `pt-PT` | Português (Portugal) | Portuguese (Portugal) | Machine translation, not reviewed by a speaker yet. |
| `ro` | Română | Romanian | Machine translation, not reviewed by a speaker yet. |
| `sk` | Slovenčina | Slovak | Machine translation, not reviewed by a speaker yet. |
| `sl` | Slovenščina | Slovenian | Machine translation, not reviewed by a speaker yet. |
| `sr-Latn` | Srpski (latinica) | Serbian (Latin) | Machine translation, not reviewed by a speaker yet. |
| `fi` | Suomi | Finnish | Machine translation, not reviewed by a speaker yet. |
| `sv` | Svenska | Swedish | Machine translation, not reviewed by a speaker yet. |
| `vi` | Tiếng Việt | Vietnamese | Machine translation, not reviewed by a speaker yet. |
| `tr` | Türkçe | Turkish | Machine translation, not reviewed by a speaker yet. |
| `el` | Ελληνικά | Greek | Machine translation, not reviewed by a speaker yet. |
| `bg` | Български | Bulgarian | Machine translation, not reviewed by a speaker yet. |
| `ru` | Русский | Russian | Machine translation, not reviewed by a speaker yet. |
| `uk` | Українська | Ukrainian | Machine translation, not reviewed by a speaker yet. |
| `he` | עברית | Hebrew | Machine translation, not reviewed by a speaker yet. |
| `ar` | العربية | Arabic | Machine translation, not reviewed by a speaker yet. |
| `hi` | हिन्दी | Hindi | Machine translation, not reviewed by a speaker yet. |
| `th` | ไทย | Thai | Machine translation, not reviewed by a speaker yet. |
| `ko` | 한국어 | Korean | Machine translation, not reviewed by a speaker yet. |
| `ja` | 日本語 | Japanese | Complete; reviewed by the maintainer. |
| `zh-Hans` | 简体中文 | Chinese (Simplified) | Machine translation, not reviewed by a speaker yet. |
| `zh-Hant` | 繁體中文 | Chinese (Traditional) | Machine translation, not reviewed by a speaker yet. |

When a language is added, add it here with who reviewed it, or "Machine
translation, not reviewed by a speaker yet." until a speaker has.
