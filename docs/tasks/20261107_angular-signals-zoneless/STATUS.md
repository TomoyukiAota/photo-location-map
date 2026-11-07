# Execution status and handoff

Updated 2026-11-07 (Asia/Tokyo). This file is the execution ledger: update it
after every meaningful result and before stopping. Do not infer completion from
the existence of the plan or from an agent's earlier messages.

## Current checkpoint

- State: PLANNING COMPLETE; IMPLEMENTATION NOT STARTED.
- Authorized action now: documents only. Wait for the owner's explicit
  instruction before starting stage 0.
- Branch of these documents: `claude/angular-signals-zoneless`, rebased on
  main at ba7b832d552920a1dfcd73c428e88d47343e1368. The investigation used
  45e0415720984d3f72e28f3c140c33a457b8a3f1; the commits in between (headless
  e2e suite, Leaflet bundled from `node_modules`) do not change the plan.
- Investigation: complete on 2026-11-07 (REPORT.md, INVENTORY.md, MCP.md).
  The Angular unit tests passed under the zoneless TestBed default that day:
  25 files, 37 tests.
- Last accepted slice: none. Baseline (stage 0.4): NOT RUN.
- Runtime, dependency, test or build changes made by this plan: none.
- Processes or CI runs owned by this work: none.
- Blocking owner decisions: the order relative to the `@electron/remote`
  removal work (PLAN.md, "Boundaries"), before stage 0 starts.

## Resume first action

When the owner starts implementation: read AGENTS.md, PLAN.md and this file;
`git fetch`; branch from main for stage 0; `mise exec -- npm ci`; begin with
PLAN.md step 0.1. If a slice is in progress, open its pull request and
continue from "Next action" in the ledger below.

## Stage ledger

| Stage / slice | State | Branch / PR | Accepted commit | Tests | Manual checks | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| 0 preparation | NOT STARTED | | | NOT RUN | | 0.1 MCP configuration |
| 1A sort settings | NOT STARTED | | | NOT RUN | | wait for accepted 0 |
| 1B folder-open state, loaded-files status bar, home | NOT STARTED | | | NOT RUN | | wait for accepted 1A |
| 1C loading-folder progress | NOT STARTED | | | NOT RUN | | wait for accepted 1B |
| 1D thumbnail generation | NOT STARTED | | | NOT RUN | | wait for accepted 1C |
| 1E selection, pinned photos, chart, maps | NOT STARTED | | | NOT RUN | | wait for accepted 1D; decide on the 1E-1/1E-2 split |
| 1F settings dialog, OS settings, map switch | NOT STARTED | | | NOT RUN | | wait for accepted 1E |
| 2 OnPush everywhere | NOT STARTED | | | NOT RUN | | wait for stage 1 exit |
| 3 remove Zone.js | NOT STARTED | | | NOT RUN | | wait for stage 2 exit |
| 4 cleanup | NOT STARTED | one PR per item | | NOT RUN | | optional, after 3 |

## Progress counters

Run from the repository root and record the numbers with every slice. Spec
files are excluded. Targets: stage 1 exit brings the first four to 0; stage 2
exit brings the next four to 0; stage 3 brings the last to 0.

| Counter | Command | 2026-11-07 (baseline) |
| --- | --- | ---: |
| `BehaviorSubject` declarations | `grep -rn "new BehaviorSubject" src --include='*.ts' \| grep -v '\.spec\.ts' \| wc -l` | 11 |
| `Subject` declarations | `grep -rn "new Subject" src --include='*.ts' \| grep -v '\.spec\.ts' \| wc -l` | 10 |
| `.subscribe(` calls | `grep -rn "\.subscribe(" src --include='*.ts' \| grep -v '\.spec\.ts' \| wc -l` | 26 |
| `\| async` reads | `grep -rn "\| async" src --include='*.html' \| wc -l` | 9 |
| `ChangeDetectionStrategy.Eager` | `grep -rn "ChangeDetectionStrategy.Eager" src --include='*.ts' \| grep -v '\.spec\.ts' \| wc -l` | 26 |
| `detectChanges()` calls | `grep -rn "detectChanges()" src --include='*.ts' \| grep -v '\.spec\.ts' \| wc -l` | 10 |
| `@ViewChild` + `@Input` | `grep -rn "@ViewChild\|@Input" src --include='*.ts' \| grep -v '\.spec\.ts' \| wc -l` | 11 |
| `NgZone.run(` calls | `grep -rn "ngZone.run(" src --include='*.ts' \| grep -v '\.spec\.ts' \| wc -l` | 8 |
| `zone.js` in `package.json` and `angular.json` | `grep -c "zone.js" package.json angular.json` | 1 + 1 |

## Manual check list

Do every row for the slice that names it, all rows for stages 2 and 3. Record
date, commit and platform in the last column; do not mark a row from memory.

| Flow | How | Expected | Checked |
| --- | --- | --- | --- |
| Open a folder (JPEG + HEIC) | Open Folder button | loading dialog phases; tree; markers; chart; status bar counts | |
| Loading dialog progress | large folder | text changes after "Collecting files..." and ends with "Completed loading all files" | |
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
| Sort menu | name / shooting time, ascending / descending | tree order and checkmarks; persists across restart; info dialog details toggle | |
| Settings: Appearance | toggle Show Status Bar; Cancel; Save | live toggle; Cancel restores; Save persists | |
| Settings: Date & Time | change a format | restart notice; Save restarts | |
| Settings: Cache | open location; delete cache | opens; confirm then restart | |
| Settings: OS (Windows) | Add / Remove | confirmation lines appear | |
| Welcome / About | Help menu | dialogs open; links open in the OS browser | |
| Map switch | menu | OpenStreetMap and Google Maps (API key) render the pinned photos | |
| `--open` | launch with a file and with a folder | parent folder opens and the file is selected; folder opens | |
| Window resize and splitters | drag; resize window | panes keep proportions; map re-renders | |

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
