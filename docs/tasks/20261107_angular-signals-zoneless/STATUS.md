# Execution status and handoff

Updated 2026-11-08 (Asia/Tokyo). This file is the execution ledger: update it
after every meaningful result and before stopping. Do not infer completion from
the existence of the plan or from an agent's earlier messages.

## Current checkpoint

- State: SLICE 1C IN REVIEW, on the branch
  `claude/signals-zoneless-1c-loading-progress` (stage ledger below).
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
- Last accepted slice: 1B, #645, merged on 2026-11-08 as 171a830.
  Baseline (stage 0.4): recorded under "Baseline" below.
- Runtime, dependency, test or build changes made by this plan: stage 0 added
  e2e cases, the MCP configuration and lint policy comments. 1A keeps the
  tree's sort settings in signals and fixes the storage reset of the unit
  tests (see "Findings while executing"). 1B keeps the opened folder, its
  photos and the loaded-files status bar in signals, and 1C the loading
  progress.
- Processes or CI runs owned by this work: the CI of the 1C pull request.
- Order relative to the `@electron/remote` removal (PLAN.md, "Boundaries"),
  decided by the owner on 2026-11-08: this plan goes first, and that removal
  comes after it.
- Checks left to the owner, decided on 2026-11-08: the OS tab on Windows and
  Google Maps with an API key, after the merges.

## Resume first action

Read AGENTS.md, PLAN.md and this file. Before stage 0, check the prerequisite:
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
`git switch -c <branch> origin/main`. Run `mise exec -- npm ci` and begin with
PLAN.md step 0.1. If a slice is in progress, open its pull request and
continue from "Next action" in the ledger below.

## Stage ledger

| Stage / slice | State | Branch / PR | Accepted commit | Tests | Manual checks | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| 0 preparation | ACCEPTED | #643 | c448beb | 2026-11-08, macOS: lint, unit (Vitest 46, Electron-Mocha 121 and 70), live-reload, `build:prod`, and `PLM_VISUAL=1` e2e with 25 cases in 2.1 min, all pass; CI green; CodeRabbit: no actionable comments | none needed: no application change | none |
| 1A sort settings | ACCEPTED | #644 | 62f01d0 | 2026-11-08, macOS: lint, unit (Vitest 49, Electron-Mocha 121 and 70), live-reload, `build:prod`, and `PLM_VISUAL=1` e2e with 26 cases in 2.2 min, all pass; CI green; CodeRabbit: a docstring and the photo order in the sort case, both addressed, then no actionable comments | headless e2e "the sort menu orders the tree by name and by shooting time, shows its choice, and keeps it across a restart" | none |
| 1B folder-open state, loaded-files status bar, home | ACCEPTED | #645 | 171a830 | 2026-11-08, macOS, on the slice's changes before the 1A review fixes: lint, unit (Vitest 54, Electron-Mocha 121 and 70), live-reload, `build:prod`, and `PLM_VISUAL=1` e2e with 28 cases in 2.4 min, all pass; CI green; CodeRabbit: optional chaining kept from the old status bar, and docstrings, both addressed, then no actionable comments | headless e2e, see "Open a folder", "Open a second folder" and "Settings: Appearance" below | none |
| 1C loading-folder progress | IN REVIEW | `claude/signals-zoneless-1c-loading-progress` | | 2026-11-08, macOS, on the slice's changes before the 1A review fixes: lint, unit (Vitest 56, Electron-Mocha 121 and 70), live-reload, `build:prod`, and `PLM_VISUAL=1` e2e with 28 cases in 2.4 min, all pass; with only `provideZonelessChangeDetection()` swapped in, the loading-folder dialog case passes | headless e2e, see "Loading dialog progress" below | merge the pull request after its review, then 1D from main |
| 1D thumbnail generation | NOT STARTED | | | NOT RUN | | wait for accepted 1C |
| 1E selection, pinned photos, chart, maps | NOT STARTED | | | NOT RUN | | wait for accepted 1D; decide on the 1E-1/1E-2 split |
| 1F settings dialog, OS settings, map switch | NOT STARTED | | | NOT RUN | | wait for accepted 1E |
| 2 OnPush everywhere | NOT STARTED | | | NOT RUN | | wait for stage 1 exit |
| 3 remove Zone.js | NOT STARTED | | | NOT RUN | | wait for stage 2 exit |
| 4 cleanup | NOT STARTED | one PR per item | | NOT RUN | | optional, after 3 |

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

| Flow | How | Expected | Checked |
| --- | --- | --- | --- |
| Open a folder (JPEG + HEIC) | Open Folder button | loading dialog phases; tree; markers; chart; status bar counts | 2026-11-08, 1B, macOS: the status bar counts, headless e2e "folder picker loads real photo data, markers, tree selection and chart" |
| Open a second folder | with the thumbnail status bar shown, open another folder | the thumbnail status bar hides | 2026-11-08, 1B, macOS: headless e2e "opening another folder hides the thumbnail status bar of the previous one" |
| Loading dialog progress | large folder | text changes after "Collecting files..." and ends with "Completed loading all files" | 2026-11-08, 1C, macOS: headless e2e "the loading-folder dialog follows the loading of the files to the end", on the e2e photo folder rather than a large one: the dialog starts at "Collecting files..." and shows "Completed loading all files" before it closes |
| Thumbnail status bar | HEIC folder, empty cache | appears, progresses, completes; details toggle; close button; Open Folder disabled while generating | |
| Thumbnail error dialog | corrupt HEIC | "Click here..." link; dialog table sorts, filters, opens file/folder | |
| Tree checkboxes | click file and folder nodes | checked/indeterminate states; map and chart follow | |
| Context menu | right-click a node | items act; menu closes on right-click outside | |
| Popup "Select only this" | marker popup menu | tree, map and chart follow | |
| Region selection | draw a rectangle/polygon, "Select Photos" | count in the region info; tree, map and chart follow; remove region | |
| Cluster popup | click a cluster at max zoom | popup with the photos | |
| Chart zoom | drag the slider; "Select Photos within Zoom" | map shows only photos in the window; button appears; Reset Zoom restores | |
| Chart x-axis unit | change the unit | chart re-bins; unsupported-duration message when applicable | |
| Date-unknown photos | checkbox in the chart menu | count shown; map adds/removes date-unknown photos | |
| Undo / redo | Selection menu and shortcuts | selection steps back and forward; menu items enable/disable | |
| Sort menu | name / shooting time, ascending / descending | tree order and checkmarks; persists across restart; info dialog details toggle | 2026-11-08, 1A, macOS: headless e2e "the sort menu orders the tree by name and by shooting time, shows its choice, and keeps it across a restart" |
| Settings: Appearance | toggle Show Status Bar; Cancel; Save | live toggle; Cancel restores; Save persists | 2026-11-08, 1B, macOS: headless e2e "Show Status Bar shows and hides the loaded-files status bar while it is changed, and Cancel restores it" and "appearance setting saves, affects layout, and survives a real app restart" |
| Settings: Date & Time | change a format | restart notice; Save restarts | |
| Settings: Cache | open location; delete cache | opens; confirm then restart | |
| Settings: OS (Windows) | Add / Remove; the owner checks it after the merge | confirmation lines appear | |
| Welcome / About | Help menu | dialogs open; links open in the OS browser | |
| Map switch | menu; the owner checks Google Maps with an API key after the merge | OpenStreetMap and Google Maps render the pinned photos | |
| `--open` | launch with a file and with a folder | parent folder opens and the file is selected; folder opens | |
| Window resize and splitters | drag; resize window | panes keep proportions; map re-renders | |

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

## Questions for the owner

Collected while executing, to be asked together at the end (owner's
instruction, 2026-11-08). Record each with what was assumed meanwhile and what
changes if the answer differs; keep answered rows, with the answer.

| # | Question | Answer, or what is assumed meanwhile | Slice |
| ---: | --- | --- | --- |
| 1 | Does this plan go before the `@electron/remote` removal? | Owner, 2026-11-08: yes; that removal comes after this plan. | all |
| 2 | Checks that need a person or another platform: the OS tab on Windows, Google Maps with an API key. | Owner, 2026-11-08: the owner checks both after the merges. | 1F, 3 |
| 3 | In a git worktree, mise does not trust the worktree's `mise.toml`, as trust is kept per path, so `mise exec` fails there. Should AGENTS.md say what agents do then? | This work passed `MISE_TRUSTED_CONFIG_PATHS=<worktree>/mise.toml` to each command rather than running `mise trust`; nothing in the repository depends on it. | all |

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
