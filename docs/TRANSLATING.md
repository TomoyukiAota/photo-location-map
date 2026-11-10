# Translating this application

Photo Location Map can be shown in several languages. The translations are
files in this repository, so anyone with a GitHub account can add a language or
improve one through a pull request, from GitHub's web editor, without setting
anything up on their computer.

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
3. Add the language to `src-shared/i18n/languages.ts`, next to the others. For
   German, say:
   - at the top, `import de from './locales/de.json';`
   - in the `languages` list,
     `{ code: 'de', name: 'Deutsch', momentLocale: 'de', geomanLocale: 'de', translation: de },`
     with the language's name written in the language itself.
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

Photo Data Viewer, which opens for **View Data**, has translations of its own:
[its guide](https://github.com/TomoyukiAota/photo-data-viewer/blob/main/docs/TRANSLATING.md).
Until it has your language too, its window is in English.

## Improve a translation

Edit the text in `src-shared/i18n/locales/<code>.json` and open a pull request
titled `Improve <language> translation`, saying what was wrong.

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

To run them on your computer, set the repository up as
[CONTRIBUTING.md](./CONTRIBUTING.md) says, then:

```bash
npm run test:unit:ng
```

## Writing the texts

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
- The texts under `menu` are the application menu. Use the words that
  applications of your language use on macOS and Windows for the same items
  (Quit, Hide Others, Actual Size, Undo).
- A line break is written `\n`. Keep the ones in the questions asked before a
  restart (`settings.confirmRestart`, `settings.cache.confirmDelete`) and in
  the update dialog (`autoUpdate.message`). `chart.resetZoom` is a tooltip under
  a small icon: two short lines.
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
  files."). If your language cannot do without plural forms, say so in the pull
  request.
- Prefer short texts for buttons, tabs and tooltips. The dialogs grow with
  their texts, but the status bar at the bottom and the sidebar do not.
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
application is downloaded from, has translations of its own. A visitor sees it
in the browser's language when the website has it, and can choose another one
in the list at the top of the page.

| File | What it is |
| --- | --- |
| `docs/github-pages/locales/en.json` | English, the source, which the pages themselves hold as well. |
| `docs/github-pages/locales/<code>.json` | One file per language, with the keys of `en.json`. |
| `docs/github-pages/i18n.js` | The languages that the website offers, at its top, and how a page gets its texts. |

To add a language:

1. Create `docs/github-pages/locales/<code>.json`, paste the content of
   `en.json` into it and translate every text. `<link>` and `</link>` are
   around the words of a link: keep the pair, around the words that are the
   link in your language. A text that you leave out is shown in English.
2. Add the language to the `languages` list at the top of
   `docs/github-pages/i18n.js`, with its name written in the language itself.
3. So that search engines find the page in your language, add its line next to
   those of the other languages in the head of `docs/index.html`
   (`<link rel="alternate" hreflang="<code>" …>`), and its address with those
   lines in `docs/sitemap.xml`.
4. Open a pull request titled `Add <language> translation of the website`.

`npm run test:website`, which runs on every pull request, checks what the
check of the application's texts checks: the keys, the `<link>` tags, and that
each file is listed. To look at the result, serve the folder
(`python3 -m http.server 8080 --directory docs`) and open
`http://localhost:8080/?lang=<code>`.

The website is in English and Japanese (日本語) so far.

## How the language is chosen

- The Language setting, on the first tab of the Settings dialog. Its default,
  to use the operating system's setting ("Use macOS setting" on macOS, "Use
  Windows setting" on Windows, "Use system setting" elsewhere), follows the
  operating system's preferred languages: each is tried as it is (`pt-BR`) and
  then as its language alone (`pt`), and the first that has a translation wins.
  English is shown when none has.
- At the first launch, the application asks for the language before anything
  else, with the operating system's language chosen.
- A changed language restarts the application.

## Languages

| Code | Language | Status |
| --- | --- | --- |
| `en` | English | The source. |
| `ja` | 日本語 | Complete; written with the application's support for languages, to be reviewed by the maintainer. |

When a language is added, add it here with who reviewed it, or "machine
translation, not reviewed yet" until a speaker has.
