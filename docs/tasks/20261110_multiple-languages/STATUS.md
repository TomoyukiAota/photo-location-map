# Multiple languages: status

Started on 2026-11-10. See the [plan](./PLAN.md).

## Current state

All three stages of the plan are implemented and checked on macOS (2026-11-10),
and the owner went through the application in Japanese and changed its texts
(2026-11-11, [below](#the-owners-review-of-the-japanese-texts)).

- Authorized (owner, 2026-11-11): merge the work. It is committed on the branch
  `claude/internationalization-investigation-fad0bb` for a pull request, which
  gets CI's macOS screenshots written anew and is merged with the `automerge`
  label once CI passes and its review is addressed.

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

- The stage 1 run compared every screenshot with its reference unchanged, so
  no text or layout changed in English.
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

- **CI's own screenshots** (`test/e2e/snapshots-ci/macos-26-arm64/`) do not have
  the new and changed references, so "CI on macOS" fails its visual comparison
  until they are written anew: run the workflow by hand with
  `update_screenshots` on the pushed branch, and commit its artifact
  (`test/e2e/README.md`).
- **Windows and Linux** were not run here: CI runs them. On Windows, the item of
  Explorer's context menu and the OS tab are worth a look in Japanese.
- **Not exercised**: the update dialog (updates are off in development and in
  prerelease versions), and the performance harness (`test/performance/`), whose
  changes for the two new dialogs were only checked for syntax.

## Questions for the owner

None is open.

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
