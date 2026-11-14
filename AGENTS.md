# AGENTS.md

What this app does and how to contribute is in [`README.md`](README.md) and
[`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md). This file holds only what is
needed at the start of a session.

## This is the only instruction file for agents

Claude Code, Codex and other coding agents all read this file. There is no
`CLAUDE.md` on purpose: Claude Code reads `AGENTS.md`, but skips it when a
`CLAUDE.md`, `.claude/CLAUDE.md` or `CLAUDE.local.md` exists in the working
directory or above it. Do not add one; put instructions here instead.

## Write in English

This repository is written in English — code, comments, `README.md`, docs, commit
messages, branch names, pull request titles and descriptions, and this file.
Keep it that way.

## This repository is public

`TomoyukiAota/photo-location-map` is a **public** repository. Everything that
lands here is readable by anyone: pull request titles and descriptions, issues,
**commit messages**, branch names, and comments in the code.

**Do not put private things here** — names of private repositories, third-party
services used privately, photos which reveal personal information. When such a source is needed, carry over
**the content only**, without naming where it came from. When in doubt, leave it
out and ask.

## Knowledge about this repo lives in this repo

Do not use an agent's own memory, such as Claude Code's
(`~/.claude/projects/…/memory/`), as the place to keep knowledge about this
repository. Memory is **per clone and per machine**, so it does not travel: work
on another computer and it is simply not there.

Put it in the repository instead. Git carries it to every clone and every machine,
and a pull request makes it reviewable.

For Claude Code, this is not a promise to remember:
[`.claude/settings.json`](.claude/settings.json) sets `"autoMemoryEnabled": false`,
which turns its memory off entirely (both reading and writing). That file is
tracked, so the switch travels with the repository.

## Keep CONTRIBUTING.md short

[`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) is the introduction that a human
developer new to this repository reads first. Before adding to it, decide where
the text belongs:

- **Needed in most development work**: a short section in CONTRIBUTING.md that
  links to a page in `docs/contributing/`, like "Dependencies".
- **Needed only in a particular situation**: a page in `docs/contributing/`,
  linked from where that situation shows up (a test's failure message, a
  comment in the code) rather than from CONTRIBUTING.md, like
  `minimum-os-versions.md`.
- **About a single setting**: a comment next to that setting, like the one in
  `.vscode/settings.json`.

**Why:** agents added details to CONTRIBUTING.md as they worked, until it was
too long to read as an introduction.

## Texts that the user sees are translated

Every text that the application shows comes from `t()` of
[`src-shared/i18n/i18n.ts`](src-shared/i18n/i18n.ts), or from the `t` pipe in a
template, and lives in `src-shared/i18n/locales/en.json`, with its translations
next to it. Do not write such a text where it is shown: not in a template, a DOM
call, the menu or a dialog. Add it to `en.json`, and translate it in every
other file of `locales/`: the owner reviews the Japanese, and the other
languages are machine translations until a speaker reviews them
(`docs/TRANSLATING.md`, "Languages"). A text left out of a file is shown in
English.

- The log, analytics events and the messages of errors stay in English, written
  where they are used.
- A word that the code also compares or saves, such as a tab or a unit, gets an
  identifier apart from its text.
- A sentence with a link is one text, with a tag around the linked words, which
  the `tagParts` pipe splits.
- The tests run in English on a machine in any language. A test of another
  language asks for it with `PLM_TEST_SYSTEM_LANGUAGES`.
- Every translation file is checked by a unit test, which takes no time to
  speak of. The e2e cases and their screenshots are for English, Japanese and
  Arabic only, the last for the layout from right to left: do not add a case
  or a screenshot for each language, which would make the suite slower with
  every language.
- Arabic and Hebrew are laid out from right to left (`dir="rtl"` on the page).
  In styles, name the sides by the direction of the text (`margin-inline-start`,
  `inset-inline-end`, `text-align: start`), not `left` and `right`. The map
  and the chart stay laid out from left to right. A file's name or path is in a
  `<bdi>` element, so that it keeps its order in either direction.

[`docs/TRANSLATING.md`](docs/TRANSLATING.md) is the guide for translators.

**Why:** a text written in the code is shown in English to every user, and no
check finds it.

## One layout for every language, which gives the texts room

A natural and accurate translation comes before the layout. Do not shorten or
abbreviate a text so that it fits, and do not ask a translator to: change the
layout.

- The layout is the same in every language: no size, rule or breakpoint for
  one language. It is made to hold whatever the length of a language's words
  and sentences is, by stretching and shrinking with the texts: an element is
  as wide as its text needs (the fields of the Date & Time settings, the tabs
  of the Settings dialog, the button that selects the photos within the
  chart's zoom), a long sentence takes another line (the status bars, the
  loading dialog), and what is side by side goes on to a second row when it
  does not fit (the fields of the Date & Time settings).
- Do not size a layout for the longest text among the languages: the
  languages with shorter texts, English among them, would then show empty room
  around theirs. What fits in English keeps its size in English.
- A text is not cut, by "..." or by its box, and a word is not broken in its
  middle.
- Where a language breaks its lines is part of its writing, as its direction
  is, and not a layout of its own: Japanese between its phrases, Korean
  between its words. A short text that takes two or three lines, such as a
  button's or a heading's, gets that, and lines of about the same length, from
  the `balanced-lines` mixin (`src/styles/_balanced-lines.scss`).
- After a change to a layout, or to a text that is shown where room is short,
  look at it in every language, not in English alone: German has long words,
  Finnish, Greek and the Slavic languages long sentences, and Arabic and Hebrew
  the other direction. `test/layout/app-in-every-language.mjs` goes through the
  application's screens in every language, reports the texts that are cut, out
  of their box or on more lines than in English, and takes the pictures to look
  at (`test/layout/README.md`).

**Why:** the first translations were shortened to fit a layout made for
English ("12/24 hodin" for a label of 16 letters, abbreviated names in a
column of 130px), and the owner decided that the wording comes first, by far,
and that the layout follows it: one layout for all languages, which stretches
and shrinks with their texts and never breaks, rather than one made for the
longest of them.

## What the application shows is an Angular component

Do not build what the application shows with DOM calls
(`document.createElement`, `innerHTML`, `appendChild`, `element.style`). Write
an Angular component, with its texts from `t()` or the `t` pipe and its styles
in its own file.

- What Leaflet shows in an element of its own making, a popup's content or a
  control's, gets its component from `LeafletContentService`
  (`src/app/map/leaflet-map/`), which makes it outside any template.
- A component that is there for every photo, as `PhotoInfoViewerComponent` is
  in each row of the folder tree, is kept light, in the ways that its comment
  lists. Measure a change to it with `test/performance/tree-rows.mjs`, which
  opens a folder of thousands of photos in the build before and in the build
  after (`test/performance/README.md`).
- What a component of a photo has to keep while it is not shown is in a
  service, as `ThumbnailRotationService` keeps how far a thumbnail is turned:
  the component is destroyed when its row or popup goes.
- The label of a marker on the map (`div-icon.ts`) is the exception, for the
  reason in its comment.

**Why:** the content that shows a photo was built with DOM calls, apart from
Angular. Its texts, styles and events were set in TypeScript, and each place
that showed it changed its elements one by one after they were made
(`docs/tasks/20261111_photo-info-viewer-angular/STATUS.md`).

## Keep windows off the owner's screen

Run anything that opens a browser or an app window **headless**, unless you are
asking the owner to check the UI. The owner keeps working on the same machine
while you run things.

- `npm run test:e2e` keeps the app's windows off the screen on macOS and Windows.
  Add `-- --headed` only when the owner is to watch. On Linux it still shows them
  (see `test/e2e/README.md`), so ask before running it there.
- `npm run test:package` launches the packaged app hidden and in the background.
- Anything else that starts a browser, such as a Playwright script, has a
  headless mode: use it.

If something cannot run headless, say so and ask before starting it.

**Why:** the e2e tests used to bring a window to the front at every launch of
the app, in the way of the owner's own work.

## In a git worktree

Two things work differently in a git worktree, such as one that Claude Code
makes under `.claude/worktrees/`:

- **mise does not trust the worktree's `mise.toml`**, as mise keeps its trust
  per path, so `mise exec` fails there. Pass the file to each command rather
  than running `mise trust`, which would change mise's own settings:
  `MISE_TRUSTED_CONFIG_PATHS="$PWD/mise.toml" mise exec -- npm ci`.
- **`npm run test:package` stops before its smoke test on macOS**, and would
  on Windows. electron-builder writes the update feed (`release/latest-mac.yml`,
  `release/latest.yml` on Windows) for the GitHub repository that it finds in
  `package.json` or `.git/config`, and `.git` is a file in a worktree, so it
  finds none there. Without `GH_TOKEN` or `GITHUB_TOKEN`, the
  package is built and signed, but the test's check of the feed fails, so the
  smoke test of the packaged app does not run (nor, on macOS, the checks of
  the bundle's architectures). With either token, the build fails with
  "Cannot detect repository by .git/config". This was seen on macOS; Windows
  checks its feed the same way, and Linux checks none. The CI jobs, which work
  in a clone, run the whole test.

## In the Claude desktop app on Windows

When the Claude desktop app on Windows is installed as an MSIX package, it
runs from `C:\Program Files\WindowsApps\Claude_...`. A session is inside it
when that `claude.exe` is among the shell's parent processes
(`Get-CimInstance Win32_Process`, following `ParentProcessId`). It is not the
shell's parent, and the shell has no package identity of its own.

Windows then redirects some writes of the shell, and of every program started
from it, to the desktop app's own storage, as seen in November 2026: writes
to `HKCU\Software\Classes` (the rest of `HKCU` was not tried), and a new
folder directly under `%APPDATA%` or `%LOCALAPPDATA%`, which lands in
`%LOCALAPPDATA%\Packages\Claude_...\LocalCache\`. A folder that is already
there is written in place. Those programs read the redirected copy, so a
change looks done from inside, while Explorer and every program started
outside the desktop app still see the real registry and folders.

- To read the real registry, start `reg.exe` outside the desktop app through
  WMI, which runs it as the same user. Hide its console window, which would
  otherwise open on the owner's screen, and wait for it to end, as the call
  returns once it has started; stop when it has not ended in time, as its
  output is then incomplete. `Win32_Process.Create` says only whether the
  process started, so have `cmd.exe` write `reg.exe`'s exit code as the last
  line of the output, and check it: `exit=0` when it worked. Write the output
  to a new folder under `%USERPROFILE%`, which only the owner can change, and
  delete the folder when done:

  ```powershell
  $hidden = New-CimInstance -CimClass (Get-CimClass Win32_ProcessStartup) -ClientOnly -Property @{ ShowWindow = [uint16]0 }
  $p = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
    # /v:on reads !errorlevel! once reg.exe has ended, not when cmd.exe reads the line.
    CommandLine = 'cmd.exe /v:on /c "reg query "<key>" /s > "<folder>\reg.txt" 2>&1 & echo exit=!errorlevel! >> "<folder>\reg.txt""'
    ProcessStartupInformation = $hidden
  }
  if ($p.ReturnValue -ne 0) { throw "Win32_Process.Create failed with $($p.ReturnValue)." }
  # Get-Process finds nothing when the process has already ended.
  $process = Get-Process -Id $p.ProcessId -ErrorAction SilentlyContinue
  if ($process -and -not $process.WaitForExit(60000)) { throw 'reg.exe did not end in 60 seconds.' }
  ```

- Before a check that changes keys of the real registry, such as
  `explorerContextMenuKeys` in
  `src-main/explorer-context-menu/explorer-context-menu.ts`, record which of
  them exist with `reg query`, and export each one that exists with
  `reg export`, both started the same way. Start the check only once every
  export has written its file. To restore, delete all of those keys with
  `reg delete <key> /f`, so that the ones that did not exist are gone again,
  then import the exports with `reg import`, all started that way too. Without
  `/f`, `reg delete` asks for a confirmation and waits for it, and nobody can
  answer a hidden process. When one of these fails, go on with the rest and
  report it.
- When Photo Location Map must change the real registry, as for a check of
  the OS tab's menu in Explorer, ask the owner to start it from Explorer, for
  example `release\win-unpacked\Photo Location Map.exe` after
  `npm run package:windows`.

**Why:** a check of the OS tab run inside the desktop app added and removed
the menu's keys, and every `reg query` there agreed, but only the desktop
app's copy changed: the real registry kept the keys of the installed Photo
Location Map all along, and Explorer kept showing its item
(`docs/tasks/20261107_angular-signals-zoneless/STATUS.md`, "Settings: OS
(Windows)").

## You can run the signed mac build yourself

Run `npm run package:mac` (and the other packaging scripts) directly. The macOS
signing and notarization credentials are expected to be already set up on the machine and need
no interaction:

- The Developer ID Application certificate is in the login keychain, so `CSC_LINK`
  and `CSC_KEY_PASSWORD` are not needed.
- `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD` and `APPLE_TEAM_ID` are exported from
  the shell profile, which is what the `afterSign` hook
  `script/notarize/notarize.js` reads.

Budget about five minutes end to end: roughly a minute for the Angular production
build, a couple more for universal packaging, and about two waiting on Apple's
notarization service. **Run it in the background and read the log** rather than
blocking on it.

Note that `PLM_PACKAGE_TEST=true` (set by `npm run test:package`) skips
notarization, so the package test is **not** a substitute when a notarized
artifact is actually needed.

Publishing the result to GitHub is a separate, outward-facing step — confirm
before uploading.

## Stay on the documented setup

Use each tool the way its documentation sets it up. Do not depart from that with
npm `overrides`, patches to installed packages or custom environments unless a
needed feature or a serious security vulnerability requires it. A deprecation
warning is not such a reason, and it is not the kind of failure the narrow
workaround below is for: record it in
[`docs/contributing/dependencies.md`](docs/contributing/dependencies.md#known-deprecation-warnings)
instead. Departures kept for such a reason are listed on the same page, each
with its reason and when to remove it.

**Why:** upstream updates to the standard setup remove these warnings over
time, and they are not urgent. An earlier pull request removed every warning by
adding five overrides and two install-time source patches, each pinned to exact
versions that every later upgrade had to review again.

## Module formats

Everything is an ES module (`"type": "module"` in `package.json`): the
renderer, the main process, the scripts and the tests. The preload scripts,
`electron-util/preload/*.cjs`, are CommonJS, as Electron runs the preload of a
sandboxed page.

- A relative import names its file: `.js` for a `.ts`
  (`'../log/logger.js'`), as Node asks of an ES module.
- `tsc` writes the main process into `out/app` and the Electron-Mocha tests
  into `out/em`, not beside the sources, which the renderer's build would take
  in place of the TypeScript.
- There is no `require`, `__dirname` or `__filename`: use `import`,
  `import()` for what is loaded late, and `import.meta.dirname`.
- Import a CommonJS package by its default export (`import _ from 'lodash'`).
- A test that replaces a function of Node's modules calls
  `syncBuiltinESMExports()` after it.

[`docs/contributing/module-formats.md`](docs/contributing/module-formats.md)
has the table of what is which, and the reasons.

**Why:** ES modules are JavaScript's standard format and what new code is
written in. The owner had the main process, which ran as CommonJS, moved to
them in November 2026, while the work was on what users do not see.

## Prefer a narrow workaround over a risky upgrade

When an intermittent failure turns out to be a known upstream bug, propose a
**narrow workaround** (a retry, a guard) rather than pinning unusual binaries or
bumping a major dependency version.

**Why:** the build and release pipeline here — electron-builder, NSIS,
notarization, auto-update — is the part that ships to users. A beta toolset or a
two-major-version jump risks breaking releases for a benefit that only shows up
in CI.

Scope the workaround as tightly as the evidence allows. The Windows installer
retry, for example, keys on exit code 3221225477 on win32 only, so a real
installer failure is still surfaced. Record the investigation — the evidence, the
hypotheses ruled out, why other fixes were rejected — in a comment next to the
workaround rather than in an issue, using a `TL;DR:` / `Details:` structure.

## Classify a CI failure before rerunning it

When asked to keep a pull request green, **read the failed job's log and classify
the cause before rerunning**. The push and pull_request triggers build the same
commit, so compare the two runs: if one passed on the same commit, the failure is
environmental.

**Why:** blind reruns hide real defects. An intermittent Windows failure here
looked like a flake for weeks; reading it properly showed the installer was
crashing with `0xC0000005` and not installing at all.

**Rerun without asking when the cause is in the CI environment, not in this
repository's code**, and a rerun is likely to pass. The owner prefers a rerun
whenever one can be expected to pass. Examples:

- GitHub Releases download failures: `socket hang up`,
  `Get "https://github.com/...": EOF`, `status code 5xx`, or
  `getaddrinfo ENOTFOUND github.com` while `npm ci` downloads Electron.
- The runner's disk images: `hdiutil: couldn't eject "diskN" - Resource busy`
  while electron-builder makes the macOS DMG, before any test runs.
- Any other failure whose log points at the runner rather than the code, when
  the other trigger passed on the same commit.

Tell the owner what was rerun and why. Stop and report anything that may be a
real defect: a failure both triggers share, or one in the app's own tests or
behavior. If the same environmental cause keeps coming back, propose a narrow
workaround (see above) instead of rerunning indefinitely.

**Handle each failed check as soon as it fails.** Do not wait for all checks to
finish: the slowest job takes about 10 minutes (15–28 for `macos-26-intel` when
it is run on demand), and a failed job would sit unattended that long.

## CI skips pushes that change only documents

Each CI workflow first runs a `changes` job, which finds the files the push or
pull request changes with [dorny/paths-filter](https://github.com/dorny/paths-filter)
and `.github/ci-filters.yml`. When every one of them is a document — a
Markdown file directly in `docs/`, any file in its `contributing/`, `tasks/`,
`troubleshooting/` or `README/` folder, `README.md`, `AGENTS.md`, `LICENSE` or
`.github/ISSUE_TEMPLATE/` — the `test` job is skipped. A skipped job passes
GitHub's required checks, and `.mergify.yml` accepts `check-skipped`, so such a
pull request does not wait for the tests.

The website is not a document: `docs/index.html`, `docs/github-pages/`,
`docs/docs-resources/` and `docs/sitemap.xml`. CI checks its texts in each of
its languages (`npm run test:website`) and its layout (the e2e suite's cases of
the website), so a change to it runs the tests.

**Why:** nothing in CI checks the documents (`lint:script` covers `script/`,
`ng lint` covers `src/`, and the app's package does not contain `docs/`), yet
every push ran the tests on three OSes for about 10 minutes.

Keep anything that the app or CI uses out of `.github/ci-filters.yml`. Write
out the `test` jobs' names rather than giving them by a matrix or an
expression: a skipped job neither expands its matrix nor evaluates its name, so
it would report no `test (<os>)` check and leave the required check pending.
If the `changes` job fails, the tests run.

## The Windows CI publishes on purpose

`.github/workflows/ci-on-windows.yml` runs the `[Publish to GitHub Releases]`
steps (`npm run publish:windows`) on every push to every branch, unless the
push changes only documents (see above). This is deliberate: it verifies that
publishing still works, rather than finding out on release day. The draft
GitHub release that appears as a result (`1.12.1-alpha`, for example) is an
**expected byproduct, not leftover junk**.

**Do not propose removing or gating these steps any further, and do not treat
the draft releases as cleanup work.**

Only the Windows publish path is exercised this way. The equivalent steps in
`ci-on-ubuntu.yml` are commented out, and macOS publishing is not in CI at all
because it needs the signing and notarization credentials described above.

## The Intel macOS CI runs only on demand

`.github/workflows/ci-on-mac.yml` runs on `macos-26` (Apple Silicon) for every
push and pull request. The `macos-26-intel` (x64) job runs only when the
workflow is run manually, together with `macos-26`: **Run workflow** on the
"CI on macOS" page of the Actions tab, or
`gh workflow run ci-on-mac.yml --ref <branch>`.

**Run it before merging a pull request that can break the x64 half of the
universal app** — a new Electron or electron-builder version, a change to the
macOS settings in `electron-builder.json`, or a dependency with native code —
and report the result to the owner. If it fails, classify the failure as above
before rerunning.

**Why:** run on every push, the Intel job took about twice as long as
`macos-26` (19–25 minutes against about 10) and accounted for every macOS
failure in the 100 runs from August to October 2026: 12, none of them caused by
the app. The app's own code is the same on x64 and arm64, so the job is worth
its cost only when something that differs between them changes.

Remove the manual trigger when GitHub retires the Intel runner (expected around
2028).
