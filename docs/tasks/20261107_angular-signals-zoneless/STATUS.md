# Execution status and handoff

Updated 2026-11-08 (Asia/Tokyo). This file is the execution ledger: update it
after every meaningful result and before stopping. Do not infer completion from
the existence of the plan or from an agent's earlier messages.

## Current checkpoint

- State: COMPLETE: stages 0 to 3, every stage 4 item but pinned photos as a
  `computed`, which the owner has had explained and has not chosen, and the
  fix of question 4 (stage ledger). What is left is the owner's: the checks
  after the merges (the OS tab on Windows, Google Maps with an API key), and
  the questions below.
- Authorized (owner, 2026-11-08): carry out the whole plan once the
  prerequisite is met, one pull request per stage or slice; address the
  CodeRabbit review of each pull request, then merge it (the `automerge`
  label, which Mergify merges once CI passes). Keep going to the end of the
  plan, and collect what needs the owner's judgment under "Questions for the
  owner" below, to be asked together at the end.
- Prerequisite (owner's decision, 2026-11-08): all four pull requests open on
  that day, #638, #639, #640 and #642, are merged before stage 0 starts.
  Checked by merging them into main locally: no conflicts; the counters below
  are unchanged (PLAN.md, "Boundaries", names what each one changes). Met on
  2026-11-08: the check under "Resume first action" reported all four merged,
  and stage 0 started from main at cd5bdf8.
- Branch of these documents: `claude/angular-signals-zoneless`, rebased on
  main at ba7b832d552920a1dfcd73c428e88d47343e1368. The investigation used
  45e0415720984d3f72e28f3c140c33a457b8a3f1; the commits in between (headless
  e2e suite, Leaflet bundled from `node_modules`) do not change the plan.
- Investigation: complete on 2026-11-07 (REPORT.md, INVENTORY.md, MCP.md).
  The Angular unit tests passed under the zoneless TestBed default that day:
  25 files, 37 tests.
- Last accepted slice: the stage 4 item standalone, #662, merged on 2026-11-08
  as 7bf8755.
  Baseline (stage 0.4): recorded under "Baseline" below.
- Runtime, dependency, test or build changes made by this plan: stage 0 added
  e2e cases, the MCP configuration and lint policy comments. 1A keeps the
  tree's sort settings in signals and fixes the storage reset of the unit
  tests (see "Findings while executing"). 1B keeps the opened folder, its
  photos and the loaded-files status bar in signals, 1C the loading progress,
  1D the thumbnail generation, 1E-1 the pinned photos and the tree's
  selection, 1E-2 the selected photos and the chart, and 1F the settings
  dialog and the map switch; 1F also gives `src/**/*.ts` typed linting for
  `@angular-eslint/no-uncalled-signals`. Stage 2 makes every component
  OnPush, uses signal queries and a signal input, and adds to development
  builds a check for bindings changed without notification, on which the e2e
  suite fails (NG0100). Stage 3 removes Zone.js. Stage 4 removes the
  `NgZone.run` wrappers and `RouterTestingModule`, and checks the templates
  strictly. The fix of question 4 makes the tree's context menu listen to its
  own backdrop. The Material tree's accessors replace the deprecated flat tree
  classes in the directory tree. The dependencies come through `inject()`, and
  the services are declared with `@Service`. Templates bind classes with
  `[class.name]` rather than `[ngClass]`. The components are standalone, and
  `src/app/app.config.ts` holds the application's providers.
- Processes or CI runs owned by this work: none.
- `provideCheckNoChangesConfig` (PLAN.md, 3.5) stays in development builds:
  the e2e suite run against one relies on it to find bindings changed
  without notification (`test/e2e/README.md`).
- Order relative to the `@electron/remote` removal (PLAN.md, "Boundaries"),
  decided by the owner on 2026-11-08: this plan goes first, and that removal
  comes after it.
- Checks left to the owner, decided on 2026-11-08: the OS tab on Windows and
  Google Maps with an API key, after the merges.

## Resume first action

The plan is complete ("Current checkpoint" above), so do not begin it again.
The next action is the owner's: the checks left to the owner and the open
questions under "Questions for the owner" below. If the owner chooses another
item, such as pinned photos as a `computed` (question 6), branch from the
fetched main as below, follow PLAN.md's "Checkpoint discipline", and give the
item a row in the stage ledger.

How the plan was started: read AGENTS.md, PLAN.md and this file. Before stage
0, check the prerequisite:
each of the four pull requests must be `MERGED`, with its merge commit on
`origin/main`. A pull request closed without being merged is not merged; ask
the owner then.

```sh
git fetch origin
for n in 638 639 640 642; do
  state=$(gh pr view "$n" --repo TomoyukiAota/photo-location-map --json state --jq .state)
  oid=$(gh pr view "$n" --repo TomoyukiAota/photo-location-map --json mergeCommit --jq '.mergeCommit.oid // ""')
  if [ "$state" = MERGED ] && git merge-base --is-ancestor "$oid" origin/main; then
    echo "#$n merged into main"
  else
    echo "#$n NOT merged into main ($state)"
  fi
done
```

Branch from the fetched main, not from a local `main` that may be behind:
`git switch -c <branch> origin/main`. Run `mise exec -- npm ci`; the plan
began with PLAN.md step 0.1. If a slice is in progress, open its pull request
and continue from "Next action" in the ledger below.

## Stage ledger

| Stage / slice | State | Branch / PR | Accepted commit | Tests | Manual checks | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| 0 preparation | ACCEPTED | #643 | c448beb | 2026-11-08, macOS: lint, unit (Vitest 46, Electron-Mocha 121 and 70), live-reload, `build:prod`, and `PLM_VISUAL=1` e2e with 25 cases in 2.1 min, all pass; CI green; CodeRabbit: no actionable comments | none needed: no application change | none |
| 1A sort settings | ACCEPTED | #644 | 62f01d0 | 2026-11-08, macOS: lint, unit (Vitest 49, Electron-Mocha 121 and 70), live-reload, `build:prod`, and `PLM_VISUAL=1` e2e with 26 cases in 2.2 min, all pass; CI green; CodeRabbit: a docstring and the photo order in the sort case, both addressed, then no actionable comments | headless e2e "the sort menu orders the tree by name and by shooting time, shows its choice, and keeps it across a restart" | none |
| 1B folder-open state, loaded-files status bar, home | ACCEPTED | #645 | 171a830 | 2026-11-08, macOS, on the slice's changes before the 1A review fixes: lint, unit (Vitest 54, Electron-Mocha 121 and 70), live-reload, `build:prod`, and `PLM_VISUAL=1` e2e with 28 cases in 2.4 min, all pass; CI green; CodeRabbit: optional chaining kept from the old status bar, and docstrings, both addressed, then no actionable comments | headless e2e, see "Open a folder", "Open a second folder" and "Settings: Appearance" below | none |
| 1C loading-folder progress | ACCEPTED | #646 | 08910f5 | 2026-11-08, macOS, on the slice's changes before the 1A review fixes: lint, unit (Vitest 56, Electron-Mocha 121 and 70), live-reload, `build:prod`, and `PLM_VISUAL=1` e2e with 28 cases in 2.4 min, all pass; with only `provideZonelessChangeDetection()` swapped in, the loading-folder dialog case passes; CI green; CodeRabbit: a test of a new folder while the previous one is still loading, and docstrings, both addressed, then no actionable comments | headless e2e, see "Loading dialog progress" below | none |
| 1D thumbnail generation | ACCEPTED | #647 | 80f5676 | 2026-11-08, macOS, on the slice's changes before the 1A review fixes: lint, unit (Vitest 60, Electron-Mocha 121 and 70), live-reload, `build:prod`, and `PLM_VISUAL=1` e2e with 28 cases in 2.4 min, all pass; with only `provideZonelessChangeDetection()` swapped in, the thumbnail and status bar cases pass; CI green; CodeRabbit: one remark on this ledger's own practice, answered, then no actionable comments | headless e2e, see "Thumbnail status bar" and "Thumbnail error dialog" below | none |
| 1E-1 pinned photos, tree selection, maps | ACCEPTED | #648 | 9e9ff5c | 2026-11-08, macOS, on the slice's changes before the 1A review fixes: lint, unit (Vitest 62, Electron-Mocha 121 and 70), live-reload, `build:prod`, and `PLM_VISUAL=1` e2e with 31 cases in 2.7 min, all pass; with only `provideZonelessChangeDetection()` swapped in, the nine selection, map and chart cases pass; CI green; CodeRabbit: a second Google map for the same photos when the API had loaded before, the caller's array kept as the pinned photos, and a Leaflet render left waiting after the map is destroyed, all fixed, then no actionable comments | headless e2e, see "Tree checkboxes" to "Cluster popup" and "Undo / redo" below | none |
| 1E-2 selected photos, chart | ACCEPTED | #649 | 21f0b47 | 2026-11-08, macOS: lint, unit (Vitest 68, Electron-Mocha 121 and 70), live-reload, `build:prod`, and `PLM_VISUAL=1` e2e with 32 cases in 2.8 min, all pass; with only `provideZonelessChangeDetection()` swapped in, the whole e2e suite passes; the chart's case then also checked the message for a span its unit cannot show; CI green; CodeRabbit: docstrings, added, then no actionable comments | headless e2e, see "Chart zoom" to "Date-unknown photos" and "`--open`" below | none |
| 1F settings dialog, OS settings, map switch | ACCEPTED | #650 | 0180df5 | 2026-11-08, macOS, on this branch's head: lint, unit (Vitest 81, Electron-Mocha 121 and 70), `build:prod`, and e2e with 34 cases in 3.0 min, all pass; before the rebase onto main, live-reload and `PLM_VISUAL=1` e2e passed too, and with only `provideZonelessChangeDetection()` swapped in, the whole e2e suite passed; CI green; CodeRabbit: no actionable comments | headless e2e, see "Settings: Date & Time" and "Map switch" below; the OS tab on Windows and Google Maps with an API key are the owner's | none |
| 2 OnPush everywhere | ACCEPTED | #651 | 9393451 | 2026-11-08, macOS, on this branch's head: lint, unit (Vitest 81, Electron-Mocha 121 and 70), `build:prod` and e2e with 37 cases in 3.1 min, all pass; `build:dev` and e2e, 37 cases in 3.3 min, no NG0100; before the rebase onto main, live-reload and `PLM_VISUAL=1` e2e passed too; with only `provideZonelessChangeDetection()` swapped in, the whole suite passed on both builds before the cases for the manual list were added, 34 cases each; CI green; CodeRabbit: NG0100 now listened for from the launch on, one more check before the application closes, and docstrings, all fixed, and the title, which it took Eager's removal not to mean OnPush, explained, then no actionable comments | headless e2e of every row below against a development build after each group of 2.3, without NG0100; the rows' remaining gaps are named in them | none |
| 3 remove Zone.js | ACCEPTED | #652 | b2de8f6 | 2026-11-08, macOS, on this branch's head: lint, unit (Vitest 81, Electron-Mocha 121 and 70), `build:prod` and e2e with 38 cases in 3.3 min, all pass; `build:dev` and e2e, 38 cases in 4.1 min, no NG0100; before the rebases onto main, live-reload and `PLM_VISUAL=1` e2e passed too, and the signed universal bundle of the package build (`PLM_PACKAGE_TEST`, so not notarized), with `PLM_VISUAL=1`: 37 passed and the website case skipped, as designed, and `codesign --verify --deep --strict` passed before and after; `dist/` has no `polyfills.js` and no zone.js code, the only "zone.js" left being the text of an Angular error message; `npm ls zone.js` is empty; `test:package`: see "Findings while executing"; on 18b6a07, CI on the three OSes passed, `test:package` included, and so did the on-demand Intel macOS job, `test (macos-x64)` in 17 min; CI green; CodeRabbit: the check list's row for a window resize, completed with a new e2e case, then no actionable comments | every row below, by its e2e cases: see the note above the list | none |
| 4 `NgZone.run` wrappers | ACCEPTED | #653 | e8f63d9 | 2026-11-08, macOS, on this branch's head: lint, unit (Vitest 81, Electron-Mocha 121 and 70), `build:prod` and e2e with 39 cases in 3.4 min, all pass; `build:dev` and e2e, 39 cases in 4.2 min, no NG0100; CI green; CodeRabbit: question 6's assumption, which said the small items were done, corrected, then no actionable comments | headless e2e of what goes through `window.plmInternalRenderer` and the menus | none |
| 4 `RouterTestingModule` | ACCEPTED | #654 | 1b8907e | 2026-11-08, macOS, on this branch's head: lint, unit (Vitest 81, Electron-Mocha 121 and 70) and `build:prod` pass; before the rebase onto main, `PLM_VISUAL=1` e2e with 38 cases passed too; CI green; CodeRabbit: no actionable comments | none needed: a spec only | none |
| 4 `strictTemplates` | ACCEPTED | #655 | 3b9064c | 2026-11-08, macOS, on this branch's head: `build:dev`, `build:prod`, unit (Vitest 81, Electron-Mocha 121 and 70) and lint pass; binding 123 to the string input `photoPath` failed `build:prod`, as it should; `build:dev`, which compiles just in time, checks no templates; CI green; CodeRabbit: that `ng test` and `build:dev`, which compile just in time, check no templates, now said next to the setting and in this row, then no actionable comments | none needed: compile-time checks only | none |
| question 4, the tree's context menu | ACCEPTED | #657 | b8163d7 | 2026-11-08, macOS, on this branch's head: lint, unit (Vitest 81, Electron-Mocha 121 and 70), `build:prod` and e2e with 39 cases in 3.4 min, all pass; `build:dev` and e2e, 39 cases in 4.3 min, no NG0100; the context menu's case, with a backdrop before the menu's, failed with the helper of main, as it should; CI green after a rerun of the Windows job of the push, which had failed in a case that the fix does not touch: Playwright's worker could not close the application in time, and then could not remove the test profile's temporary folder (EBUSY); the pull_request trigger had passed on the same commit; CodeRabbit: no actionable comments; live-reload and `PLM_VISUAL=1` e2e, which the checkpoint asks for, were not run before the merge (CI runs live-reload, but the e2e suite without its screenshots): both passed on the head of #660, which contains this | headless e2e "a right-click outside the tree's context menu closes it" | none |
| 4 Material tree accessors | ACCEPTED | #658 | 9e6a526 | 2026-11-08, macOS, on this branch's head: lint, unit (Vitest 82, Electron-Mocha 121 and 70), `build:prod` and e2e with 40 cases in 3.5 min, all pass; `build:dev` and e2e, 40 cases in 4.4 min, no NG0100; the new e2e case passed with main's tree too, and the new unit test failed with the previous folder left expanded, as it should; on synthetic folders of 20,000 and 100,000 files, opening, expanding and collapsing took as long as with main's tree (see "Findings while executing"); CI green; CodeRabbit: a unit test that opening another folder leaves nothing of the previous one expanded, selecting without spreading every node into one call (a RangeError past about 150,000 arguments), and exact names in the e2e case, all addressed, then no actionable comments; live-reload and `PLM_VISUAL=1` e2e, which the checkpoint asks for, were not run before the merge (CI runs live-reload, but the e2e suite without its screenshots): both passed on the head of #660, which contains this | headless e2e "a folder of the tree expands and collapses, and keeps the selection of its photos", and the other cases of the tree | none |
| 4 `inject()` | ACCEPTED | #659 | 6c9dc67 | 2026-11-08, macOS, before the rebase onto main that brought #658: lint, unit (Vitest 81, Electron-Mocha 121 and 70), `build:prod` and e2e with 40 cases in 3.4 min, all pass; `build:dev` and e2e, 40 cases in 4.3 min, no NG0100; so did the same with `@Service` and `ngclass-to-class` on top; 30 of the 38 constructors that took parameters are gone or empty, and the 8 left belong to plain classes that Angular does not create; on this branch's head after the rebase, the same passed, with Vitest 82; CI green; CodeRabbit: no actionable comments; live-reload and `PLM_VISUAL=1` e2e, which the checkpoint asks for, were not run before the merge (CI runs live-reload, but the e2e suite without its screenshots): both passed on the head of #660, which contains this | headless e2e: the whole suite, as the change touches the components and services throughout | none |
| 4 `@Service` | ACCEPTED | #660 | bf13966 | 2026-11-08, macOS, on this branch's head: lint, unit (Vitest 82, Electron-Mocha 121 and 70), live-reload, `build:prod` and `PLM_VISUAL=1` e2e with 40 cases in 3.5 min, all pass, the committed references unchanged; `build:dev` and e2e, 40 cases in 4.4 min, no NG0100; 19 services are `@Service()`, the error handler and a spec's stand-in `@Service({ autoProvided: false })`, and no `@Injectable` is left; CI green; CodeRabbit: the checkpoint's live-reload and `PLM_VISUAL=1` e2e, which it asked for, run on this branch's head and recorded, for #657 to #659 too, then no actionable comments | headless e2e: the whole suite | none |
| 4 `ngclass-to-class` | ACCEPTED | #661 | 646e4ed | 2026-11-08, macOS, on this branch's head: lint, unit (Vitest 82, Electron-Mocha 121 and 70), live-reload, `build:prod` and `PLM_VISUAL=1` e2e with 40 cases in 3.5 min, all pass, the committed references unchanged; `build:dev` and e2e, 40 cases in 4.4 min, no NG0100; no `ngClass` is left; CI green; CodeRabbit: no actionable comments | headless e2e of what the 7 bindings show: the two status bars, the thumbnail status bar's details and close button, the settings dialog's tabs, the menu button and the sort's information | none |
| 4 standalone | ACCEPTED | #662 | 7bf8755 | 2026-11-08, macOS, on this branch's head: lint, unit (Vitest 82, Electron-Mocha 121 and 70), live-reload, `build:prod` and `PLM_VISUAL=1` e2e with 40 cases in 3.5 min, all pass, the committed references unchanged; `build:dev` and e2e, 40 cases in 4.3 min, no NG0100; no NgModule is left, and `build:prod`, which checks every template strictly, fails for a component that misses an import; with a binding of the loaded-files status bar changed without notification, a development build failed an e2e case with NG0100, as it should; CI green; CodeRabbit: no actionable comments | headless e2e: the whole suite | none |
| 4 pinned photos as a `computed` | NOT STARTED | | | NOT RUN | | the owner decides: question 6 below |

## Progress counters

Run from the repository root and record the numbers with every slice. Spec
files are excluded. The patterns are fixed strings (`-F`), which GNU grep, BSD
grep and ugrep read alike, and the commands stay out of the table, where `|`
would have to be escaped.

```sh
grep -rnF "new BehaviorSubject" src --include='*.ts' | grep -vF '.spec.ts' | wc -l
grep -rnF "new Subject" src --include='*.ts' | grep -vF '.spec.ts' | wc -l
grep -rnF ".subscribe(" src --include='*.ts' | grep -vF '.spec.ts' | wc -l
grep -rnF "| async" src --include='*.html' | wc -l
grep -rnF "ChangeDetectionStrategy.Eager" src --include='*.ts' | grep -vF '.spec.ts' | wc -l
grep -rnF "detectChanges()" src --include='*.ts' | grep -vF '.spec.ts' | wc -l
grep -rnF -e "@ViewChild" -e "@Input" src --include='*.ts' | grep -vF '.spec.ts' | wc -l
grep -rnF "ngZone.run(" src --include='*.ts' | grep -vF '.spec.ts' | wc -l
grep -cF "zone.js" package.json angular.json
```

Targets: stage 1 exit brings counters 1 and 4 to 0, while the event
`Subject`s that the plan keeps (`folderOpened`, `dataReplaced`,
`selectionRequested`, `forceRenderWithoutPhotoHappened`, settings changed and
the like) and their subscriptions remain in counters 2 and 3. Stage 2 exit
brings counters 5, 6 and 7 to 0. Stage 3 brings counter 9 to 0. Counter 8,
the `NgZone.run` calls, stays until stage 4.

| # | Counter | 2026-11-07 (baseline) |
| ---: | --- | ---: |
| 1 | `BehaviorSubject` declarations | 11 |
| 2 | `Subject` declarations | 10 |
| 3 | `.subscribe(` calls | 26 |
| 4 | `async` pipe reads | 9 |
| 5 | `ChangeDetectionStrategy.Eager` | 26 |
| 6 | `detectChanges()` calls | 10 |
| 7 | `@ViewChild` and `@Input` | 11 |
| 8 | `ngZone.run(` calls | 8 |
| 9 | `zone.js` in `package.json` and `angular.json` | 1 + 1 |

Counted again on 2026-11-08 on main (ba7b832) with #638, #639, #640 and #642
merged locally, and on main at cd5bdf8 after they were merged: every number is
the same.

| After | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| baseline, stage 0 | 11 | 10 | 26 | 9 | 26 | 10 | 11 | 8 | 1 + 1 |
| 1A | 8 | 10 | 22 | 5 | 26 | 10 | 11 | 8 | 1 + 1 |
| 1B | 7 | 9 | 20 | 4 | 26 | 8 | 11 | 8 | 1 + 1 |
| 1C | 7 | 8 | 19 | 4 | 26 | 8 | 11 | 8 | 1 + 1 |
| 1D | 6 | 3 | 11 | 2 | 26 | 6 | 11 | 8 | 1 + 1 |
| 1E-1 | 3 | 5 | 9 | 2 | 26 | 1 | 11 | 8 | 1 + 1 |
| 1E-2 | 0 | 5 | 6 | 0 | 26 | 1 | 11 | 8 | 1 + 1 |
| 1F | 0 | 5 | 6 | 0 | 26 | 0 | 11 | 8 | 1 + 1 |
| 2 | 0 | 5 | 6 | 0 | 0 | 0 | 0 | 8 | 1 + 1 |
| 3 | 0 | 5 | 6 | 0 | 0 | 0 | 0 | 8 | 0 + 0 |
| 4, `NgZone` | 0 | 5 | 6 | 0 | 0 | 0 | 0 | 0 | 0 + 0 |

Stage 1 exit, met at 1F on 2026-11-08: counters 1 and 4 are 0; the five
`Subject`s left are events that the plan keeps (`appearanceSettingsChanged`
and `dateTimeSettingsChanged`, `forceRenderWithoutPhotoHappened`,
`selectionRequested`, `dataReplaced`); `no-uncalled-signals` is on, with
typed linting through `projectService`, and `ng lint` reports nothing.

## Baseline (stage 0.4)

2026-11-08 (Asia/Tokyo), main at cd5bdf8 with the four prerequisite pull
requests merged, the application code unchanged; macOS on Apple silicon, with
the windows of the e2e suite off the screen. Resolved versions: Node.js
26.13.0, `@angular/core` 22.2.4, `@angular/cli` 22.2.5, `@angular/material`
22.2.5, TypeScript 6.0.3, Vitest 5.1.0, Electron 45.2.1, zone.js 0.16.3,
angular-eslint 22.6.0, Playwright 1.64.1.

| Command | Result | Duration |
| --- | --- | ---: |
| `mise exec -- npm run lint:all` | pass | 2 s |
| `mise exec -- npm run test:unit:all` | pass: Vitest 27 files and 46 tests, Electron-Mocha main 121, renderer 70 | 11 s |
| `mise exec -- npm run test:live-reload` | pass | 3 s |
| `mise exec -- npm run build:prod` | pass | 7 s |
| `PLM_VISUAL=1 mise exec -- npm run test:e2e` | 20 passed | 1.5 min |

Stage 0.2 adds five e2e cases, which pass on this baseline: the loading-folder
dialog, undo and redo, `--open` with a photo, the thumbnail status bar, and the
thumbnail error dialog. With them, `PLM_VISUAL=1 mise exec -- npm run test:e2e`
runs 25 cases, all passing, in 2.1 minutes. As a negative control, a local build in which only
`provideZonelessChangeDetection()` replaced `provideZoneChangeDetection()`
(not committed) failed the loading-folder dialog case, whose text stayed at
"Collecting files to load from the opened folder...", as INVENTORY.md
predicts. The other new cases, and the folder, chart and region cases, still
passed, as the flows that INVENTORY.md calls incidental still render then.

## Manual check list

Do every row for the slice that names it, all rows for stages 2 and 3, except
the two the owner checks after the merges (the OS tab on Windows, and Google
Maps with an API key in "Map switch"), which stay open until the owner reports
the result. Record date, commit, platform and how in the last column; do not
mark a row from memory.

Stage 3, 2026-11-08, macOS on Apple silicon: every row below was checked
again by the e2e cases it names, without Zone.js, against a production build,
a development build (no NG0100) and the signed universal bundle. The gaps that
the rows name remain: restarts, the OS's shortcuts, steps of a thumbnail
generation between its start and its end, and the two rows left to the owner.

| Flow | How | Expected | Checked |
| --- | --- | --- | --- |
| Open a folder (JPEG + HEIC) | Open Folder button | loading dialog phases; tree; markers; chart; status bar counts | 2026-11-08, 1B, macOS: the status bar counts, headless e2e "folder picker loads real photo data, markers, tree selection and chart" |
| Open a second folder | with the thumbnail status bar shown, open another folder | the thumbnail status bar hides | 2026-11-08, 1B, macOS: headless e2e "opening another folder hides the thumbnail status bar of the previous one" |
| Loading dialog progress | large folder | text changes after "Collecting files..." and ends with "Completed loading all files" | 2026-11-08, 1C, macOS: headless e2e "the loading-folder dialog follows the loading of the files to the end", on the e2e photo folder rather than a large one: the dialog starts at "Collecting files..." and shows "Completed loading all files" before it closes |
| Thumbnail status bar | HEIC folder, empty cache | appears, progresses, completes; details toggle; close button; Open Folder disabled while generating | 2026-11-08, 1D, macOS: headless e2e "the thumbnail status bar follows the generation of HEIF thumbnails from start to end": it appears, completes, disables Open Folder while generating, and closes; with one file, no step between the start and the end shows; the details toggle in the error dialog case |
| Thumbnail error dialog | corrupt HEIC | "Click here..." link; dialog table sorts, filters, opens file/folder | 2026-11-08, 2, macOS: headless e2e "the thumbnail error dialog lists, sorts and filters the HEIF files without a thumbnail", which also opens a file and its folder, with the command replaced |
| Tree checkboxes | click file and folder nodes | checked/indeterminate states; map and chart follow | 2026-11-08, 1E-1, macOS: headless e2e "the tree shows partly selected folders, and Select Only This from its menu selects one folder" and "folder picker loads real photo data, markers, tree selection and chart"; 2026-11-08, Material tree, macOS: the same cases, and "a folder of the tree expands and collapses, and keeps the selection of its photos" |
| Context menu | right-click a node | items act; menu closes on right-click outside | 2026-11-08, 1E-1, macOS: headless e2e "the tree shows partly selected folders, and Select Only This from its menu selects one folder"; 2026-11-08, 2, macOS: headless e2e "a right-click outside the tree's context menu closes it" (see "Findings while executing" for the loading dialog); 2026-11-08, question 4, macOS: the same case, with a stand-in for the dialog's backdrop before the menu's |
| Popup "Select only this" | marker popup menu | tree, map and chart follow | 2026-11-08, 1E-1, macOS: headless e2e "Select Only This from a marker popup selects that photo in the tree and on the map" |
| Region selection | draw a rectangle/polygon, "Select Photos" | count in the region info; tree, map and chart follow; remove region | 2026-11-08, 1E-1, macOS: headless e2e "map regions preserve drawing, removal and real photo selection" |
| Cluster popup | click a cluster at max zoom | popup with the photos | 2026-11-08, 1E-1, macOS: headless e2e "a cluster of photos taken at one place opens a popup with each of them" |
| Chart zoom | drag the slider; "Select Photos within Zoom" | map shows only photos in the window; button appears; Reset Zoom restores | 2026-11-08, 1E-2, macOS: headless e2e "chart grouping, zoom, reset and photo selection keep their real data behavior" |
| Chart x-axis unit | change the unit | chart re-bins; unsupported-duration message when applicable | 2026-11-08, 1E-2, macOS: headless e2e "chart grouping, zoom, reset and photo selection keep their real data behavior", which also shows the message for Hour and hides it again for Year; the bins themselves in the unit tests of `createDateTimeTakenChartData` |
| Date-unknown photos | checkbox in the chart menu | count shown; map adds/removes date-unknown photos | 2026-11-08, 1E-2, macOS: headless e2e "the chart menu counts the photos without a shooting time, and its checkbox shows or hides them on the map" |
| Undo / redo | Selection menu and shortcuts | selection steps back and forward; menu items enable/disable | 2026-11-08, 2, macOS: headless e2e "undo and redo step through the photo selection from the Selection menu, which enables them when they apply", through the menu's items; the shortcuts, which the OS's menu handles, are not covered |
| Sort menu | name / shooting time, ascending / descending | tree order and checkmarks; persists across restart; info dialog details toggle | 2026-11-08, 1A, macOS: headless e2e "the sort menu orders the tree by name and by shooting time, shows its choice, and keeps it across a restart" |
| Settings: Appearance | toggle Show Status Bar; Cancel; Save | live toggle; Cancel restores; Save persists | 2026-11-08, 1B, macOS: headless e2e "Show Status Bar shows and hides the loaded-files status bar while it is changed, and Cancel restores it" and "appearance setting saves, affects layout, and survives a real app restart" |
| Settings: Date & Time | change a format | restart notice; Save restarts | 2026-11-08, 1F, macOS: headless e2e "Save is enabled only while a setting differs, and a new date format asks before the restart that saving it needs": the notice, the example, and the question before the restart, declined; the restart itself is not covered |
| Settings: Cache | open location; delete cache | opens; confirm then restart | 2026-11-08, 2, macOS: headless e2e "the cache settings open the cache folder, and ask before deleting the cache", with the command replaced and the question declined; the restart is not covered |
| Settings: OS (Windows) | Add / Remove; the owner checks it after the merge | confirmation lines appear | |
| Welcome / About | Help menu | dialogs open; links open in the OS browser | 2026-11-08, 2, macOS: headless e2e "welcome, about and every available settings tab keep their appearance" and "the links of the welcome dialog, the about box and the cache settings open in the OS browser", with the browser replaced |
| Map switch | menu; the owner checks Google Maps with an API key after the merge | OpenStreetMap and Google Maps render the pinned photos | 2026-11-08, 1F, macOS: headless e2e "the Map menu switches to Google Maps, which draws the selected photos, and back to OpenStreetMap", with a stand-in for the Google Maps API, and a second switch that creates one map; Google Maps itself is the owner's to check |
| `--open` | launch with a file and with a folder | parent folder opens and the file is selected; folder opens | 2026-11-08, 1E-2, macOS: headless e2e "--open loads a directory with Unicode, spaces, # and % without restoring photos on an ordinary restart" and "--open with a photo opens its folder with only that photo selected" |
| Window resize and splitters | drag; resize window | panes keep proportions; map re-renders | 2026-11-08, 3, macOS: headless e2e "folder picker loads real photo data, markers, tree selection and chart" (a splitter drag, and the panes after a restart) and "a window resize keeps the sidebar's upper pane, and Leaflet fits the map to its pane", which failed with Home's resize handling taken out |

## Findings while executing

- 2026-11-08, 1A: `test/angular/setup.ts` reset the in-memory
  `UserDataStorage` double before each unit test through `./storage-double`,
  a second instance of that file. The application gets the double through
  "fileReplacements" in `angular.json`, built as the module of the
  application's path, so that reset never reached it; no unit test had
  depended on storage before. The setup now imports it through the
  application's path.
- 2026-11-08, 1B: a signal set to the value it already has notifies no one.
  `isFolderOpened` stays true from the second folder on, so what has to happen
  on every open, such as hiding the thumbnail status bar of the previous
  folder, cannot follow it; 1B raises a `folderOpened` event for that. The
  e2e case "opening another folder hides the thumbnail status bar of the
  previous one" guards it.
- 2026-11-08, 1E-1: the review found that Google Maps created two maps for
  the same photos when its API had loaded before, as on a second switch to
  it, which the code before this plan did too: the component's effect and
  `ngAfterViewInit` each rendered, and each map uses the API's quota. The
  effect now renders alone, once an `isApiLoaded` signal is true.
- 2026-11-08, 2: `ng generate @angular/core:signals` wrote the import and the
  migrated declarations twice in the files that both `src/tsconfig.app.json`
  and `src/tsconfig.spec.json` compile (about box, welcome dialog, cache
  settings); they were written once by hand.
- 2026-11-08, 2: the development-build check (2.2) found one binding that
  changed without notification. Opening a second folder replaced the photos
  about 100 ms before the tree, whose nodes show a photo's information while
  `PhotoDataService.getPhoto()` finds the photo; Home was already OnPush, so
  the tree did not render in between. The map of photos by path is a signal
  now, which `getPhoto()` reads.
- 2026-11-08, 2: the tree's context menu closes on a right-click outside it
  by listening to the first overlay backdrop
  (`DirTreeViewContextMenuHelper.configureClosingWithRightClick`). Right
  after a folder has loaded, while the loading dialog is still closing, that
  is the dialog's backdrop, so a right-click outside the menu then does not
  close it. This was so before this plan. Fixed on 2026-11-08, as the owner
  decided (question 4): the menu listens to the last backdrop, its own; the
  e2e case puts a stand-in for the dialog's backdrop first in the overlay
  container, and failed with the old helper.
- 2026-11-08, 3: with Zone.js, an unhandled promise rejection made outside
  Angular's zone, such as one from `page.evaluate`, reached no
  `unhandledrejection` listener: zone.js only logged it, and it was not
  recorded. One made inside the zone reached Angular's `ErrorHandler`,
  wrapped as "Uncaught (in promise)", and was recorded once with the label
  `Error: <message>` (checked with a temporary e2e case on the stage 2
  build). Without Zone.js, every one reaches the window's listener, unwrapped,
  and is recorded once with that same label, which the new e2e case "an
  unhandled promise rejection in the renderer is recorded once, with its
  message" checks.
- 2026-11-08, 3: in a git worktree on macOS, `npm run test:package` does not
  get through. electron-builder writes `release/latest-mac.yml` only for a
  publisher, which it detects from `GH_TOKEN` (CI sets it) and the repository
  in `.git/config`, a file rather than a folder in a worktree. Without
  `GH_TOKEN`, the package was built and signed, but the test's check of the
  mac bundle failed on the missing file, so the checks of the bundle's
  architectures and the smoke test of the packaged app did not run; with
  `GH_TOKEN`, the build fails with "Cannot detect repository by .git/config".
  The macOS CI job runs the whole test.
- 2026-11-08, Material tree: with `childrenAccessor`, the CDK tree goes
  through every node that the accessor returns, all the way down, whenever its
  data or what is expanded changes, with an rxjs chain per node. Returning
  every child, expanding or collapsing a folder took 30 to 50 ms on a
  synthetic folder of 20,000 files, against 2 to 20 ms with the deprecated
  data source, and opening a folder went through the previous one too. The
  accessor returns the children of expanded nodes only, the ones that the tree
  shows: on 20,000 and 100,000 files, opening, expanding and collapsing then
  took as long as with the data source, 3 to 40 ms.
- 2026-11-08, the follow-ups: #657, #658 and #659 were opened without two
  commands of the checkpoint (PLAN.md, "Checkpoint discipline"):
  `test:live-reload`, which CI runs, and the e2e suite with `PLM_VISUAL=1`,
  whose screenshot comparisons CI does not run. CodeRabbit asked for them on
  #660. On its head, which contains the three, both passed, with the
  committed references unchanged.
- 2026-11-08, `ngclass-to-class`: `ng generate @angular/core:ngclass-to-class`
  migrates only components that import `NgClass` or `CommonModule`
  themselves, as standalone ones do. It found nothing in the components here,
  which `AppModule` declared, so the 7 bindings were converted by hand as it
  converts them: each key of the object becomes a `[class.name]` binding.
- 2026-11-08, standalone: the `standalone-bootstrap` step of
  `ng generate @angular/core:standalone` builds `bootstrapApplication()` from
  `AppModule` alone, so it dropped what `bootstrapModule()` was given here:
  `provideZonelessChangeDetection()` and, in development builds,
  `provideCheckNoChangesConfig()`. Both are in `src/app/app.config.ts` now.
  The migration also moved the specs' stand-ins for child components into the
  testing modules' imports, where they replace nothing, as a standalone
  component imports its real children itself; the three specs with stand-ins
  use `TestBed.overrideComponent()`.

## Questions for the owner

Collected while executing, to be asked together at the end (owner's
instruction, 2026-11-08). Record each with what was assumed meanwhile and what
changes if the answer differs; keep answered rows, with the answer.

| # | Question | Answer, or what is assumed meanwhile | Slice |
| ---: | --- | --- | --- |
| 1 | Does this plan go before the `@electron/remote` removal? | Owner, 2026-11-08: yes; that removal comes after this plan. | all |
| 2 | Checks that need a person or another platform: the OS tab on Windows, Google Maps with an API key. | Owner, 2026-11-08: the owner checks both after the merges. | 1F, 3 |
| 3 | In a git worktree, mise does not trust the worktree's `mise.toml`, as trust is kept per path, so `mise exec` fails there. Should AGENTS.md say what agents do then? | Owner, 2026-11-08: write it in AGENTS.md. Written there under "In a git worktree", as this work did it: `MISE_TRUSTED_CONFIG_PATHS=<worktree>/mise.toml` with each command rather than `mise trust`. | all |
| 4 | The tree's context menu does not close on a right-click outside it while the loading dialog is still closing (see "Findings while executing"). Fix it, by listening to the menu's own backdrop, the last one? | Owner, 2026-11-08: fix it. Fixed on the branch `claude/tree-context-menu-backdrop` (stage ledger). | 2 |
| 5 | In a git worktree on macOS, `npm run test:package` fails its check of `latest-mac.yml` (see "Findings while executing"). Should AGENTS.md say so, with question 3? | Owner, 2026-11-08: write it in AGENTS.md, with question 3. Written there under "In a git worktree": the macOS CI job, which works in a clone, runs the whole test. | 3 |
| 6 | Which of the other stage 4 items should follow: `inject()` with `prefer-inject`, `@Service`, the Material tree's `childrenAccessor`/`levelAccessor`, the standalone migration with `prefer-standalone`, `ngclass-to-class` (2.4), and pinned photos as a `computed`? They change the code's style throughout rather than its behavior. | Owner, 2026-11-08: all of them but pinned photos as a `computed`, which the owner has had explained and has not chosen: the Material tree's accessors, then `inject()`, `@Service` (after `inject()`, as the service migration leaves a class that takes its dependencies in its constructor as it is), `ngclass-to-class` and the standalone migration, one pull request each: #658 to #662. The three small items, `NgZone.run`, `RouterTestingModule` and `strictTemplates`, are done, one pull request each. | 4 |
| 7 | Report upstream what the migrations here showed? The Angular CLI's MCP tool `onpush_zoneless_migration` fails with ENOTDIR on a spec file (MCP.md); `ng generate @angular/core:signals` writes twice in files that two tsconfigs compile; and the bootstrap step of `ng generate @angular/core:standalone` drops what `bootstrapModule()` was given (both under "Findings while executing"). | Assumed: not reported, as a report is outward-facing and the owner's to decide. | 2, 4 |
| 8 | Run the e2e suite against a development build in CI too, on one OS? CI runs it against the production build only, so the check for bindings changed without notification (NG0100) runs only when someone runs it locally. | Assumed: not done; it would add about 4.5 minutes to one job. | 2, 3 |

## Required update fields while executing

For the active slice, record:

```text
Date/time and slice:
Branch/HEAD and working-tree files:
Last accepted commit (slice and PR):
Commands and outcomes (pass/fail/incomplete, log paths):
CI runs and failure classification:
Progress counters:
Manual checks done (rows, platform):
Half-converted files, if stopping mid-slice:
Unresolved issue and concrete owner decision, if needed:
Next executable action, including the command when it exists:
```

Keep failed attempts and their disposition. Do not overwrite an accepted row
with unverified work in progress.
