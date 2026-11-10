# Multiple languages: status

Started on 2026-11-10. See the [plan](./PLAN.md).

## Current state

All three stages of the plan are implemented and checked on macOS (2026-11-10),
and the owner went through the application in Japanese and changed its texts
(2026-11-11, [below](#the-owners-review-of-the-japanese-texts)). That work is
merged: pull request #678, on 2026-11-11.

Since then the application has 42 languages, and its list of languages has a
search field: see [More languages and a search field](#more-languages-and-a-search-field).

- Every text that the application shows is in `src-shared/i18n/locales/en.json`
  and, in Japanese, in `ja.json`. Both processes read them through `t()`
  (`src-shared/i18n/i18n.ts`), with i18next 27.0.1; templates use the `t` pipe.
  `@ngx-translate/core`, its loader, `src/assets/i18n/` and `provideHttpClient`
  are gone.
- The language is the Language setting (`auto` by default) or the operating
  system's. A Language dialog asks for it before the Welcome dialog until the
  user confirms one; the Settings dialog has a Language tab, first. A changed
  language restarts the application.
- Both show the choices in a list that scrolls, modeled on the one in the
  setup of macOS, which the owner asked for after seeing the dialog with radio
  buttons: those would not scale as languages are added. With more than seven
  entries, the list has a scrollbar that stays in view. The dialog's button is
  named in the chosen language, "決定" in Japanese.
- The menu (with a label for every item with a role), the update dialog,
  Explorer's context menu item, the map's and the chart's tooltips and the
  dates follow the language, and Photo Data Viewer gets it in its address.
- The two `window.confirm` questions are asked in a dialog of the application.
- `docs/TRANSLATING.md` tells contributors how to add or improve a language;
  `README.md`, `docs/CONTRIBUTING.md` and the About box link to it, and a unit
  test checks every translation file.

## More languages and a search field

The owner asked on 2026-11-11 for the languages that Windows and macOS support,
for a search field above the list of languages that narrows the list down, and
for the same in Photo Data Viewer, which is to have the same languages.

### What was decided

- **Which languages.** The 42 that Windows 11 has a language pack for or that
  the applications of macOS are translated into, English and Japanese among
  them. Windows also has about 40 languages as "language interface packs",
  which translate only a part of it and are added on top of another language:
  those are left out, and are a question for the owner below.
- **Their codes.** The language alone (`de`), unless a region or a script
  matters for the text: `pt-BR` and `pt-PT`, `zh-Hans` and `zh-Hant`,
  `sr-Latn`, and `nb` for Norwegian. The operating system's languages are
  matched to them by the rules of `src-shared/i18n/resolve-language.ts`
  (`zh-TW` is `zh-Hant`, `pt` is `pt-BR`, `no` is `nb`, `sr` is `sr-Latn`),
  which are Photo Data Viewer's too.
- **Their names and order.** Each under its own name, with a capital letter as
  macOS lists them; the names in Latin letters by the alphabet, then those in
  other scripts. Photo Data Viewer lists them the same.
- **The translations** of the 40 new languages were written by the coding
  agent, as machine translation that no speaker has read. `docs/TRANSLATING.md`
  says so at its top and in its table, and asks speakers to read and correct
  them. They use the words of macOS and Windows for common items, keep
  "(Language)" after the word for language, and word a text with a number so
  that the number can be any ("Geladene Dateien: 5."), as the application has
  one form for each text.
- **The search** compares without regard to case or diacritics, and finds a
  language by its own name, its English name, its name in the application's
  language (`Intl.DisplayNames`: ドイツ語 finds Deutsch in Japanese) or its
  code. The first entry, which follows the operating system, is found by its
  text. The chosen entry stays chosen while the search hides it. The box keeps
  the height of seven entries whatever the search leaves, so that the dialog
  does not move while the user types, and says "No languages found" when
  nothing is left. The Language dialog opens with the search field focused.
- **Arabic and Hebrew** are laid out from right to left, as Photo Data Viewer
  lays them out: the page has `dir="rtl"`, which Angular Material follows for
  its dialogs and menus, and the styles name their sides by the direction of
  the text. Three things stay laid out from left to right: the row of the
  sidebar and the map, which is reversed instead, as Split.js measures from the
  left; the map, as Leaflet has nothing for the other direction; and the
  chart's panel, as ECharts draws the chart the same in every language. The
  name of a file or a folder and a path are in `bdi` elements, and each value
  of a text's placeholder is on its own in the text (U+2068 and U+2069), so
  that they keep their order and their punctuation in a text written the other
  way.
- **Dates** have the digits 0 to 9 in every language, as the other numbers of
  the application have: moment's Arabic and Hindi locales would write the
  digits of those scripts.
- **Leaflet-Geoman** has texts in 25 of the 42 languages. In the other 17, the
  tooltips while a region is drawn are in English; the buttons of its toolbar
  are the application's texts in every language.
- **The tests** check every translation file in the unit tests, which take a
  second and a half as before. The e2e suite has its cases and screenshots in
  English, Japanese and Arabic only, the last for the layout from right to
  left, so that it does not get slower with every language: the owner's
  concern.

### What else changed

- The label that appears under the chart's menu icon was "More" in every
  language, as the styles wrote it. It is `chart.moreAlt` now.
- The build warns about each locale of moment as a CommonJS module, as it did
  about the Japanese one: 41 lines instead of one. They are left as they are
  here.

### Looked at

Every dialog and view was photographed in each of the 42 languages, with the
application hidden, and the elements whose content is larger than their box
were listed and compared with English.

- **The label of the clock's field** in the Date & Time tab was cut off in 16
  languages: about 16 letters fit in it. Those translations are shorter now
  ("12/24 Stunden"), and `docs/TRANSLATING.md` gives the limit.
- **The dialog that says that no photo has location data** had a fixed height,
  which its message outgrew by a line in five languages. It has a minimum
  height now, the same as before in English.
- **The chart's unit** is a select as wide as its longest option, and
  "Δευτερόλεπτο", a second in Greek, pushed the menu's icon beside it over the
  chart's Zoom buttons. The column that holds them is as wide as they need
  now, and 130px, as before, where that is enough. The button that selects the
  photos within the zoom grows with a text of three or four lines.
- **The first entry of the list** takes two lines in six languages whose words
  for it, or whose own name, are long ("Português (Portugal)"). It is left so.
- In Arabic, each screen was looked at as well: the sidebar is at the right
  and its border follows the mouse, the dialogs and menus are mirrored, a
  photo's menu opens the other way round within the map, and a path keeps its
  first slash at its start.

Nothing else differed from English. What nobody has done is read the 40 new
translations as a speaker.

### Screenshots

`test/e2e/snapshots/`, written on the Mac of the checks below with
`--update-snapshots`:

| Reference | Why |
| --- | --- |
| `language-dialog.png`, `language-dialog-ja.png`, `settings-language.png`, `settings-language-ja.png` | Changed: the search field above the list, and the list of 42 languages. In the dialog, the search field has the focus. |
| `loaded-home-ar.png` | New: the main window in Arabic, laid out from right to left, with a folder of photos open. |

The other references are unchanged and still match, so nothing else changed
in English. CI's own set for macOS is written anew on the pull request's
branch, as for the first languages.

## What changed in English

Everything else looks as it did; the e2e suite compared the screenshots.

- A new profile shows the Language dialog before the Welcome dialog. So does a
  profile of an earlier version, once, at the first launch after the update.
- The Settings dialog has a Language tab, first, and opens on it.
- The question before a restart (saving a date format or a language, deleting
  the thumbnail cache) is a dialog of the application, not `window.confirm`.
- The About box has a line that invites translations, and is 28 pixels taller
  for it.
- The chart's unit select has the unit's identifier as each option's value
  (`day`); its text is as it was.

## Resuming

Nothing is left to implement. What remains is under
[Left for the owner](#left-for-the-owner).

## Checks

On macOS (Apple Silicon), Node 26.13.0, npm 11.20.0, Electron 45.2.1, in a
worktree, on a machine whose language is Japanese.

| When | Lint | Vitest | Electron-Mocha main / renderer | e2e with `PLM_VISUAL=1` |
| --- | --- | --- | --- | --- |
| Baseline, `main` `722906a5` | pass | 96 tests | 198 / 62 | 44 passed, 1 skipped (Windows only) |
| Stage 1 | pass | 116 tests | 199 / 62 | 43 passed, 1 skipped, 1 failed: the chart's unit select has the unit's identifier as its value now, which the case was updated for |
| Stage 2 | pass | 148 tests | 199 / 62 | 47 passed, 1 skipped |
| Stage 3, final | pass | 149 tests | 199 / 62 | 47 passed, 1 skipped |
| The list in place of the radio buttons, with its scrollbar and the operating system's name | pass | 158 tests | 199 / 62 | 47 passed, 1 skipped |
| The Japanese texts as the owner changed them, and the tree's item for a file and a folder | pass | 161 tests | 199 / 62 | 47 passed, 1 skipped |
| 42 languages, the search field and the layout from right to left | pass | 389 tests | 199 / 62 | 48 passed, 1 skipped |

- The stage 1 run compared every screenshot with its reference unchanged, so
  no text or layout changed in English.
- With 42 languages, Vitest has 389 tests and takes a second and a half, as it
  did with two: each translation file adds five checks. The e2e suite has one
  more case, for Arabic, and also passed against a development build: 48
  passed, 1 skipped.
- The final state also passed the e2e suite against a development build
  (`npm run build:dev`), which fails a case that changed a binding without
  telling Angular: 47 passed, 1 skipped.
- With the list, the five cases that show it (the dialogs, the three about
  languages, and saving a setting) passed against a development build as well,
  in a clone made for it, as the owner had the application open from this
  checkout's build. The whole suite was not run against a development build
  again.
- The list was looked at with twenty languages, by adding entries to the page:
  the box shows seven of them and scrolls, with its scrollbar in view. The
  application itself has two. An e2e case adds entries in the same way and
  checks that the box scrolls and that the scrollbar takes room in it.
- The package test below was run before the list replaced the radio buttons,
  and not again: the list adds nothing to the package but code of the renderer.
- An unsigned application directory (`electron-builder build --mac dir --arm64`
  with `PLM_PACKAGE_TEST=true`, no notarization) has `i18next` and both
  translation files, and not TypeScript, which is an optional peer dependency
  of i18next that `npm ls --omit=dev` lists under it. The three e2e cases about
  languages passed against that packaged application.
- `npm run test:package` passed in a clone made for it, as it stops before its
  smoke test in a worktree (`AGENTS.md`). The clone held the files of the
  working tree and had GitHub's address as its `origin`, where electron-builder
  reads the repository from. What passed: `npm ci` from the lock file, the 19
  tests of the runner, the signed universal application (not notarized, as in
  every package test) with its DMG and zip, the bundle's icon, its two
  architectures and its minimum macOS version in `Info.plist` and
  `latest-mac.yml`, and the launch from the DMG, whose log has the main process
  and the renderer. That log also shows the application in English on this
  Japanese machine, as a test profile asks for.
- Both Electron-Mocha suites failed to start in their first run at the baseline,
  right after `npm ci` in a worktree that held compiled `.js` files of an earlier
  build ("Cannot find module …/record-error", "LogFileConfigStateHandler is
  already initalized"), and passed when run again after `npm run build:prod`,
  without any change. The cause was not looked into further; the stale `.js`
  files, which Node resolves before a `.ts`, are the likely one. The numbers
  above are of the second run.

### Screenshots

`test/e2e/snapshots/`, written on the Mac above with `--update-snapshots`:

| Reference | Why |
| --- | --- |
| `settings-appearance.png`, `settings-date.png`, `settings-cache.png` | Changed: the list of tabs has Language. In `settings-appearance.png`, the Appearance tab also has the darker color of a tab under the pointer, as the other two always had: the suite clicks it now, while the dialog used to open on it. No style of the dialog changed. |
| `about.png` | Changed: the line that invites translations, which makes the box 28 pixels taller. |
| `language-dialog.png`, `settings-language.png` | New: the Language dialog and the Language tab. Written again when the list replaced the radio buttons. |
| `language-dialog-ja.png`, `welcome-ja.png`, `settings-language-ja.png` | New: the application in Japanese. The first and the last were written again with the list. |

The other references are unchanged and still match.

`test/e2e/snapshots-ci/macos-26-arm64/`, CI's own set, was written anew by a
manual run of "CI on macOS" with `update_screenshots` on the pull request's
branch: the four changed and the five new references above, and `welcome.png`.
In that one, the content sits one pixel higher than before, and nothing else
differs: with the runner's fonts the Welcome dialog's content is a pixel taller
than the height that the dialog used to be fixed at, which its minimum height
now gives way to. The reference of `snapshots/` did not change.

### Japanese layout

Every dialog and view was looked at in Japanese. Three things did not fit and
were changed so that a translation gets the room it needs, without a change in
English: the Welcome dialog cut off its OK button (its height was fixed), the
Settings dialog's Cancel button wrapped (its width was fixed), and a photo's
menu was cut off at the map's left edge (it is wider than in English).

## The owner's review of the Japanese texts

The owner looked at the application in Japanese on 2026-11-11, changed texts
in `src-shared/i18n/locales/ja.json`, and said that the review was done. The
texts follow Photo Data Viewer's wording for the words the two share.

- Fifteen texts first: the sorting by shooting time (seven), the loading of a
  folder (four), "このファイルのみを選択" in both menus of a photo, "マップ" for
  the map in the chart's menu, the Help menu's item for the Welcome dialog,
  and "他の" in the About box. No text says "地図" any more.
- Then four more: the texts of something under way end in "〜中です..."
  (collecting files, making the map, making thumbnails), as the loading of
  files did, and the Help menu has "「ようこそダイアログ」を表示".
- "このファイルのみを選択" was shown on a folder of the list of folders as
  well, so that item has a text for a file and one for a folder,
  "このフォルダーのみを選択", as the owner decided. English says "Select Only
  This" of both.
- Two numbers of photos have their counter, as the owner asked: the photos in
  the regions drawn on the map, "範囲内の写真: 24151 枚", and those whose date
  is unknown, in the chart's menu, "撮影日時が不明な写真: 3 枚". A space stands
  before the counter, as the other numbers of the file have ("5 個のファイル").
  English has the number alone ("Photos in Regions: 24151"): the owner decided
  against "items" after it.
- The item of the Settings menu is "設定を開く" and, in English, "Open
  Settings", rather than "設定の管理" and "Manage Settings", as the owner
  decided. It has no ellipsis, as no item of the menus has one. Its log line
  and its analytics event are renamed with it, 'Clicked "Open Settings"'; the
  event of earlier versions, 'Clicked "Manage Settings"', is added to it when
  the clicks are counted, which a comment next to the event says.

## Left for the owner

- **Windows and Linux** were not run here: CI runs them. On Windows, the item of
  Explorer's context menu and the OS tab are worth a look in Japanese.
- **Not exercised**: the update dialog (updates are off in development and in
  prerelease versions), and the performance harness (`test/performance/`), whose
  changes for the two new dialogs were only checked for syntax.

## Questions for the owner

Open since the 42 languages (2026-11-11):

- **Windows' partly translated languages.** Windows has about 40 more
  languages as "language interface packs" (Icelandic, Welsh, Persian, Tamil
  and others), which macOS does not have. Should the application get those as
  well, as machine translations? They are left out so far.
- **The translations of the 40 new languages** are machine translations that
  no speaker has read. They are offered as they are, and `docs/TRANSLATING.md`
  asks speakers to correct them. If a language should rather wait until
  someone has read it, it can be taken out of the list by removing its line in
  `src-shared/i18n/languages.ts`.
- **The map and the chart in Arabic and Hebrew** stay laid out from left to
  right, with the sidebar at the right. Say so if they should be mirrored as
  well, which Leaflet and ECharts do not do by themselves.

Answered on 2026-11-10:

- Users of an earlier version see the Language dialog once, at the first launch
  after the update, as implemented (plan, decision 4).
- The languages are in a list like the one in the setup of macOS rather than
  radio buttons, which would not scale as languages are added; the dialog's
  button is "決定" in Japanese, not "OK".
- The list keeps the entry for the operating system's language, first, in the
  Language dialog as in the Settings dialog. A version of the dialog without
  it, which kept the setting on `auto` for the language on screen, was shown to
  the owner and not taken.
- The list shows a scrollbar once it has more entries than its box.
- The entry for the operating system's language names macOS and Windows, and
  says "system" ("OS" in Japanese) on any other operating system.

## Reminders for the owner

- **Pull requests from forks**, which translation contributors will open: decide
  how they pass CI once the implementation is done.
  - A contributor opens such a pull request as any other; nothing is asked of
    them beyond `docs/TRANSLATING.md`. Only the owner sees the difference.
  - The workflows of a first-time contributor's pull request wait for the
    owner's approval (the repository's setting, read on 2026-11-10).
  - GitHub gives the workflows of such a pull request a read-only token, as
    its documentation of the `pull_request` event says. electron-builder
    creates the draft release when it finds none, and such a token neither
    sees a draft nor may create one. So the last step of "CI on Windows", which
    publishes, is expected to fail there, after every test of that job has
    run. Ubuntu and macOS do not publish, so their checks tell whether the
    translation is sound; the unit test of the translation files runs on all
    three. The failure itself has not been seen: the repository's one pull
    request from a fork, in 2023, has no CI run on record.
  - `main` requires `test (windows-latest)`, so GitHub does not offer the merge
    of such a pull request to anyone but an administrator, and Mergify merges
    only the owner's own.
  - The steps are left as they are, as `AGENTS.md` asks. Until decided, the
    owner can get the three checks on the same commits by pushing them to a
    branch of this repository (`gh pr checkout <number>`, then `git push`),
    whose CI has a token that can publish.
