# Multiple languages: plan

This plan is written so that the work can be stopped and picked up at any point.
[`STATUS.md`](./STATUS.md) says how far it has got, what was checked and what is
left for the owner; the checklists under [the stages](#the-work-in-three-stages)
say which steps are done. To resume, read `STATUS.md`, then start at the first
unchecked step.

## Goal

Let users read the application in their own language, with Japanese as the
first translation.

- The default language comes from the operating system's settings.
- A language selection appears when the application is launched for the first
  time.
- The language can be changed in the Settings dialog.
- Anyone with a GitHub account can add or improve a translation through a pull
  request, and a check tells them what is wrong before anyone reviews it.
- Photo Data Viewer, which shows a photo's data in its own window, is shown in
  the same language. It already supports languages and waits for this
  application to pass one
  ([its plan](https://github.com/TomoyukiAota/photo-data-viewer/blob/main/docs/tasks/20261108_multiple-languages/PLAN.md)).

## What the application is like today

Found by reading the code on 2026-11-10, at `main` `722906a5`.

- **Every text is English, written where it is shown**, about 170 texts in
  three kinds of places:

  | Where | Examples | Texts |
  | --- | --- | --- |
  | Angular templates (22 files) | Dialogs, settings, status bars | about 100 |
  | TypeScript of the renderer | The photo's thumbnail with its buttons and menu, the map's region controls, the tree's context menu, two `window.confirm` messages | about 40 |
  | Main process | The application menu, the update dialog, Explorer's context menu item | about 30 |

- **Much of the renderer's text is outside Angular.** The content of a photo
  (`src/app/photo-info-viewer/`), the map's controls and the popups are built
  with plain DOM calls in static classes, some while a module is evaluated
  (`photo-info-unavailable-element.ts`). The application menu is built while
  `src-main/menu/menu.ts` is imported. A translation that only Angular's
  templates can reach covers a little more than half of the texts.
- **`@ngx-translate/core` is installed and wired up with a single key**
  (`SIDEBAR.OPEN_FOLDER`). It loads `assets/i18n/en.json` over HTTP after the
  application has started, and works only inside Angular.
- **What both processes share is already in `src-shared/`**, and is available
  while modules are evaluated: the startup metadata, which the main window's
  preload asks for synchronously, and the settings (`currentUserSettings`).
- **A changed date or clock format restarts the application**
  (`saveUserSettingsAndRestartApp`), after a confirmation.
- **Some English words are identifiers as well as labels**: the settings tabs
  (`'Date & Time'`), the chart's units (`'Day'`), the clock formats
  (`'12-hour'`). They keep their value and get a translated label beside it.
  Analytics events and the log stay in English.
- **Electron**, checked with Electron 45.2.1 on macOS:
  - `app.getPreferredSystemLanguages()` answers before the `ready` event
    (`["ja-JP"]` on the owner's Mac); `app.getLocale()` is empty until then.
  - The labels of menu items with a `role` (Zoom In, Quit, …) are English in
    Electron's source (`shell/browser/api/electron_api_menu_roles.cc`), in any
    language of the operating system, so a translated menu passes each label.
  - `window.confirm` shows its buttons in Chromium's language, which follows the
    operating system, not the application's setting.
  - The Windows installer already follows the language of Windows (electron-builder's
    default for NSIS), and the packaged application has every Chromium locale.
- **Libraries with texts of their own**: Leaflet-Geoman 2.20.4 has Japanese
  built in (`setLang`), moment has a locale per language, and ECharts' and
  Leaflet's few tooltips take a text as an option.
- **The e2e suite finds elements by their English text** in about 150 places,
  and compares screenshots. On a machine whose language is Japanese, such as the
  owner's, a default that follows the operating system would turn the suite
  Japanese locally and leave it English on CI.
- **The application has recorded its users' preferred languages since 1.12.1**
  (`recordLanguages` in `src-main/record-at-app-launch.ts`), which shows which
  translations matter after Japanese.

## Decisions

The owner decided these on 2026-11-10, after the investigation: decisions 3 and
4 as written here, and the rest as recommended.

### 1. One set of texts in `src-shared/`, shown through i18next

The texts live in `src-shared/i18n/locales/<code>.json`, one file per language,
and both processes read them through one function, `t()`, of
`src-shared/i18n/i18n.ts`. [i18next](https://www.i18next.com/) 27.0.1, the
version Photo Data Viewer uses, looks the texts up. It has no dependencies,
ships CommonJS for the main process and ES modules for the renderer, and is in
`dependencies`, as the main process needs it at run time.

- The files are bundled, and i18next is initialized while the module is
  evaluated, so `t()` is synchronous everywhere: in a template, in a static
  class and in the menu's template.
- Angular's templates use a pure pipe, `{{ 'sidebar.openFolder' | t }}`
  (`src/app/shared/i18n/`). The language does not change while the application
  runs (decision 3), so the pipe has nothing to watch.
- Keys are type-checked: `TranslationKey` is derived from `en.json`, `t()` and
  the pipe accept nothing else, and `strictTemplates` checks the templates in a
  production build. i18next's own typed keys need TypeScript's `strict`, which
  this repository does not set, so the type is the application's own.
- The format is Photo Data Viewer's: nested keys by component,
  `{{placeholders}}`, and `<tags>` around the part of a sentence that is a link.
  A translator who knows one application's files knows the other's.
- `@ngx-translate/core`, `@ngx-translate/http-loader`, `src/assets/i18n/` and
  `provideHttpClient`, which only the loader used, are removed.

Considered and not chosen:

| Option | Why not |
| --- | --- |
| `@ngx-translate/core` 18.1, already installed | Works only inside Angular, so the main process and the plain DOM code would need a second mechanism. Its strength, switching while the application runs, is not needed. Keys are not type-checked. |
| Angular's own i18n (`@angular/localize` 22) | Its documented setup builds one application per language; `loadTranslations()` at run time is not reactive either. Texts are extracted into XLIFF with hashed IDs, a format Photo Data Viewer does not share, and the main process is out of its reach. |
| Transloco 8.4 | Works only inside Angular, as ngx-translate. |
| `angular-i18next` 21 | Its peer dependencies allow Angular 21 and i18next 25 only, so installing it needs `overrides`, which [dependencies.md](../../contributing/dependencies.md) rules out. The pipe it would give is a few lines. |
| Paraglide 3 | Compiles the texts to functions, which adds a step before both `tsc` and `ng build`; its third major version was a week old. |
| A hand-written lookup | Possible, and the files would be the same. i18next gives the behavior Photo Data Viewer has, plural forms when a language needs them, and a format that translation platforms import. |

### 2. Where the language comes from

The first of these that gives a supported language wins:

1. the Language setting (`UserSettings` / `Language`), unless it is `auto`, the
   default;
2. the operating system's preferred languages
   (`app.getPreferredSystemLanguages()`), each matched as it is (`pt-BR`) and
   then by its language alone (`pt`), without regard to case;
3. English.

This is Photo Data Viewer's rule (`resolve-language.ts` there). The main process
puts the operating system's languages in the startup metadata
(`systemLanguages`), and both processes resolve the language with the same pure
function, so they always agree.

**A test does not follow the machine's languages.** With a test profile
(`PLM_TEST_ROOT`) or in a unit test, `systemLanguages` is `en-US`, or what
`PLM_TEST_SYSTEM_LANGUAGES` gives (comma-separated), so that the suites pass on
a machine in any language and a test can ask for Japanese.

### 3. A changed language restarts the application

The menu, the elements kept for each photo, the texts made while modules are
evaluated, and the locales of the libraries would all have to be made again;
the date format already restarts the application. Saving a changed language in
the Settings dialog asks for the same confirmation and restarts.

### 4. The language is chosen first, in a dialog of its own

When the application is launched and the user has not confirmed a language yet
(`History` / `ClickedOkOnLanguageDialog`), a Language dialog is shown before
anything else, in the language that decision 2 gives. The Welcome dialog comes
after it, so that its messages are read in the language the user chose.

- The dialog lists the operating system's language first, which is `auto` and
  chosen, then each language under its own name ("English", "日本語"), so that
  a user who cannot read the current language still finds theirs. The first
  entry names the operating system where users know it by a name, as the owner
  asked: "Use macOS setting (…)", "Use Windows setting (…)", and "Use system
  setting (…)" on any other, the wording that the owner chose among five; in
  Japanese, "macOS の設定に従う（…）", "Windows の設定に従う（…）" and
  "OS の設定に従う（…）". They are three whole texts, so that a language can
  write each as it needs.
- The list is a box that scrolls, modeled on the one in the setup of macOS,
  which the owner asked for on 2026-11-10: the radio buttons that it had at
  first would not scale as languages are added. The box shows seven entries;
  with more, it has a scrollbar of its own, which stays in view, as the owner
  asked: the one of macOS hides until the list is scrolled.
- The button under the list saves the choice. It is named in the chosen
  language: "OK", and "決定" in Japanese, as the owner asked. When the chosen
  language is the one shown, the dialog closes and the Welcome dialog follows;
  otherwise the application restarts and shows the Welcome dialog in the chosen
  language. A note in the chosen language says that it will restart.
- Users who installed an earlier version have not confirmed a language either,
  so they see the dialog once, at the first launch after the update. The owner
  confirmed this on 2026-11-10, rather than showing it only to new
  installations.

### 5. A Language tab in the Settings dialog

A tab of its own, first in the list and the one the dialog opens on, with the
same list as the Language dialog. The tab's name in another language keeps the
English word, "言語 (Language)", so that it can be found from any language.

### 6. The main process

- The menu's labels come from `t()`, and each item with a `role` gets its label
  too; in English they are the labels Electron gives.
- The update dialog, and Explorer's context menu item on Windows, are
  translated. The item is written to the registry in the application's language
  at the time **Add** is clicked; after a change of language, **Remove** and
  **Add** write it again.
- The language is resolved once the settings can be read and before the menu is
  built (the import order of `src-main/electron-main.ts`).
- Photo Data Viewer gets `language=<code>` in its address, next to `dateFormat`.
  A language it has no translation for is shown in English there.
- The dialog of `electron-unhandled`, which shows an error's stack, stays in
  English.

### 7. Dates, and the libraries' own texts

- The day of the week and AM/PM come from moment's locale of the language, used
  per date (`moment().locale(…)`), not as moment's global locale: the log and
  analytics keep formatting in English. As in Photo Data Viewer, each language's
  file says how a date writes the day of the week (`dateTime.weekdayPattern`:
  `ddd` in English, `(ddd)` in Japanese, shown as `(月)`).
- The month in `MMM/YYYY`, which only the `MM/DD/YYYY` format uses, stays
  English, as it was chosen to be.
- The date formats themselves stay the user's setting; they do not follow the
  language.
- Leaflet-Geoman falls back to its own translation of the language for the
  texts the application does not set; the chart's and the map's tooltips are set
  from `t()`.
- `<html lang>` follows the language, by which Chromium chooses the glyphs of
  Japanese and Chinese.

### 8. `window.confirm` becomes a dialog of the application

The two confirmations (restart after saving settings, deleting the thumbnail
cache) are shown with a Material dialog whose buttons are translated, instead of
`window.confirm`, whose buttons follow the operating system.

### 9. Translations are contributed as files in this repository

As in Photo Data Viewer: a contributor copies `en.json`, translates the values,
and adds the language to `src-shared/i18n/languages.ts`, all of which GitHub's
web editor can do. A unit test checks every file: its keys exist in `en.json`,
no text is empty, the `{{placeholders}}` and `<tags>` are those of the English
text, and every file is listed. A text not translated yet may be left out and is
shown in English. `docs/TRANSLATING.md` is the guide; `README.md`,
`docs/CONTRIBUTING.md` and the About box link to it. A hosted translation
platform can import these files later, if contributors ask for one.

### 10. Out of scope for now

- Right-to-left languages.
- Plural forms. English keeps its texts as they are ("Loaded 1 files."); a
  language that needs plural forms can get i18next's plural keys later.
- The website (`docs/index.html`), the troubleshooting page and the README.
- Names: Photo Location Map, the map layers' names, file formats (JPEG, HEIF),
  EXIF.
- Chromium's own texts (the folder picker belongs to the operating system) and
  Leaflet's hard-coded accessibility label of a popup's close button.
- Following the language for the default date format.

## Design

```
src-main/i18n/
  i18n-setup.ts              Imports the texts once the settings can be read, before the menu, and logs the language.
src-shared/i18n/
  locales/en.json, ja.json   The texts. English is the source.
  languages.ts               The languages offered: code, own name, the locale names of moment and Leaflet-Geoman.
  resolve-language.ts        matchLanguage() and resolveLanguage(): pure, shared by both processes.
  translation-key.ts         TranslationKey, derived from en.json.
  i18n.ts                    Initializes i18next once per process; t(), tIn(), currentLanguage, systemLanguage.
  tagged-text.ts             splitAtTag(): a sentence with one <tag>…</tag> as before / inside / after.
src/app/shared/i18n/
  translate.pipe.ts          {{ key | t }} and {{ key | t: { count } }}
  tag-parts.pipe.ts          {{ text | tagParts: 'pageLink' }} for a sentence with a link
  moment-locales.ts          Loads moment's locale of each language, and keeps moment's global locale English.
src/app/language/            The list of languages (used by the dialog and the tab), and the Language dialog.
src/app/shared/confirm-dialog/  The confirmation dialog of decision 8.
```

- `StartupMetadata` gains `systemLanguages`. `UserSettings` gains `language`
  (`auto` or a language code), read and saved with the other settings.
- `src-shared/i18n/i18n.ts` is first imported, in the main process, after the
  startup metadata and the settings' storage are set and before the menu; in the
  renderer the bridge gives both synchronously.
- A sentence with a link is one text with a tag. The template splits it and
  keeps its own `<a>`, so that the elements, their styles and their click
  handlers stay where they are:

  ```html
  @let parts = 'welcome.troubleshooting' | t | tagParts: 'pageLink';
  {{ parts.before }}<a href="" #troubleshootingPageLink>{{ parts.inside }}</a>{{ parts.after }}
  ```

## The work, in three stages

Each stage leaves the application working. The checkboxes are updated as the
steps are done.

### Stage 1: the texts move out of the code

Nothing visible changes in English, apart from the confirmation dialog of
decision 8: the e2e suite and its screenshots pass as they are, which is the
check that no text was lost or changed.

- [x] Baseline: `npm ci`, lint, unit tests, production build, e2e with
      `PLM_VISUAL=1`, recorded in `STATUS.md`.
- [x] Add `i18next` 27.0.1 to `dependencies`; remove `@ngx-translate/core` and
      `@ngx-translate/http-loader`; `resolveJsonModule` in `tsconfig.json` and
      `tsconfig.src-main.json`.
- [x] `src-shared/i18n/`: `en.json` with every text, `languages.ts` (English
      only for now), `resolve-language.ts`, `translation-key.ts`, `i18n.ts`,
      `tagged-text.ts`, with unit tests, among them the check of every
      translation file (decision 9).
- [x] `StartupMetadata.systemLanguages`, with the rule for tests of decision 2,
      and `UserSettings.language` (`UserDataStoragePath.UserSettings.Language`),
      which the settings load and save, and which the renderer may write
      (`renderer-storage-access.ts`). `i18n.ts` resolves the language from both.
- [x] The pipes of `src/app/shared/i18n/`, with tests.
- [x] Renderer, templates: every text through the pipe. Tabs and chart units
      get an identifier apart from their label.
- [x] Renderer, TypeScript: the photo info viewer, the map, the tree's context
      menu, the chart, the status bar's summary, the settings' messages.
- [x] Main process: the menu with a label for every item, the update dialog,
      Explorer's context menu item.
- [x] The confirmation dialog replaces `window.confirm` (decision 8); the e2e
      cases that answered the native dialog click the new one.
- [x] Remove ngx-translate's providers, pipe, spec setup and
      `src/assets/i18n/`, and `provideHttpClient`.
- [x] Checks: lint, unit tests (Vitest and both Electron-Mocha suites), a
      production build and e2e with `PLM_VISUAL=1`. The run against a
      development build is made once, at the end of stage 3.

### Stage 2: the language can be chosen, and Japanese

- [x] `ja.json`, reviewed against Photo Data Viewer's wording for the words they
      share; Japanese in `languages.ts` with moment's and Leaflet-Geoman's
      locales.
- [x] Dates: the weekday pattern and the locale per date (decision 7).
- [x] `<html lang>`, the text of the loading indicator, Leaflet's and the
      chart's tooltips.
- [x] The list of languages, the Language tab (first, with restart on save) and
      the Language dialog before the Welcome dialog
      (`History` / `ClickedOkOnLanguageDialog`).
- [x] Photo Data Viewer's address gets `language`.
- [x] Analytics: the Language setting and the language in use are recorded at
      launch with the other settings; the Language dialog's choice is recorded.
- [x] e2e: the suite confirms the Language dialog at launch; new cases for the
      dialog, the tab with its restart, the menu's labels, a Japanese launch
      (`PLM_TEST_SYSTEM_LANGUAGES=ja-JP`) and the viewer's address; screenshots
      updated where the Settings dialog gained a tab, and added for the new
      dialog and for Japanese.
- [x] Dialogs and buttons take the room that a translation needs: the Welcome
      dialog and the About box have a minimum height instead of a fixed one, the
      buttons a minimum width, the confirmation dialog the width of its longest
      line, and a photo's menu stays within the map. English looks as it did.
- [x] Checks: as stage 1.

### Stage 3: contributors can find the way

- [x] `docs/TRANSLATING.md`: how to add a language or fix a text from GitHub's
      web editor, what the check verifies and how to run it, how the language is
      chosen at run time, the table of languages and who reviewed them.
- [x] `README.md` and `docs/CONTRIBUTING.md` link to it; the About box gets a
      line inviting translations, linking to it.
- [x] `AGENTS.md`: a short section saying that every text the user sees goes
      through `t()` and into `en.json`.
- [x] `docs/contributing/dependencies.md` if it lists the changed packages: it
      does not, and i18next is in `dependencies`, as its rule for a module of
      the main process says.
- [x] `test/e2e/README.md` says how the suite deals with languages, and the
      performance harness (`test/performance/`) confirms the Language dialog and
      answers the new confirmation.
- [x] `STATUS.md` with the checks of all stages, what is left for the owner, and
      the reminder about pull requests from forks.

## What must not change

- English: every text as it is today, checked by the e2e suite and its
  screenshots. The screenshots that change are named and explained in
  `STATUS.md`: the Settings dialog gains a tab, the About box a line.
- What is stored: the existing keys and their values. The new ones are
  `UserSettings` / `Language` and `History` / `ClickedOkOnLanguageDialog`.
- What analytics and the log record: English event names, labels and messages.
  New events are added; none is renamed.
- The documented setup: no npm `overrides`, patches or custom builders.
- The windows of test runs stay off the owner's screen.

## Verification

On macOS, in this order, each through `mise exec --` (in a worktree, with
`MISE_TRUSTED_CONFIG_PATHS="$PWD/mise.toml"`):

1. `npm run lint:all`
2. `npm run test:unit:ng`, `npm run test:unit:em:main`,
   `npm run test:unit:em:renderer`
3. `npm run build:prod`, then `PLM_VISUAL=1 npm run test:e2e`
4. `npm run build:dev`, then `npm run test:e2e` (reports a binding that changed
   without telling Angular)

`npm run test:package` stops before its smoke test in a worktree on macOS
(`AGENTS.md`); CI runs it whole, on three operating systems, and compares CI's
own screenshots (`test/e2e/snapshots-ci/`), which only the "CI on macOS"
workflow can write anew. What the package contains can still be looked at in a
worktree, without signing or notarization:
`PLM_PACKAGE_TEST=true npx electron-builder build --mac dir --arm64 --publish never -c.mac.identity=null`,
and the e2e suite runs against it with `PLM_PACKAGED_EXECUTABLE`.

## Later, if wanted

- The next languages, chosen from the recorded preferred languages.
- Plural forms, and matching of scripts (`zh-Hant`) when Chinese is added.
- A hosted translation platform, importing `src-shared/i18n/locales/*.json`.
- Chromium's own language (`--lang`), which changes `app.getLocale()` on macOS
  too, if its texts should follow the setting.
