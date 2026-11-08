# Execution status and handoff

Updated 2026-11-09 (Asia/Tokyo). This file is the execution ledger; keep it current
after every meaningful result and before stopping. Do not infer completion from
the existence of a plan or from an agent's previous messages.

## Current checkpoint

- State: EXECUTING. Stages 0, A, B and C1 accepted. Stage C2 (Photo Data Viewer's isolation) next, on a branch
  of its own from this one, from the work in progress in `git stash` ("stage C2 work in progress").
- Authorization: on 2026-11-09 the owner started the implementation, to run until
  the plan is complete, with questions for the owner collected for the end
  (section "Questions for the owner" below). Merging and publishing the separate
  viewer still need their own approval (PLAN.md).
- Final target: C, via measured 0 -> A -> B -> C1 -> C2. C1 alone is incomplete C.
- Implementation branch: `claude/remove-electron-remote`, from main 449f30f3
  (the merge of PR 674, which includes b7c9bfe6 and PR 673). Not pushed yet.
- Last accepted IMPLEMENTATION stage: C1 (0aefe3fc).
- Task-owned processes: the pinned Photo Data Viewer server, `next start -p 3130
  -H 127.0.0.1` in `.upgrade-artifacts/remove-electron-remote/viewer/1ff7a50/`
  (log `logs/viewer-1ff7a50-server.log`). Stop it when no series or test needs it;
  restart it with the command in that directory's section of "Artifacts" below.
- External viewer changes/deployments: none.

## Resume first action

Read AGENTS.md, PLAN.md, PERFORMANCE.md and this file, then `git status`,
`git log --oneline main..claude/remove-electron-remote`, and the stage ledger
below. Check whether the viewer server answers (`curl -I http://127.0.0.1:3130/`)
and restart it if a series or C2 test needs it. Continue from the first stage row
that is not ACCEPTED, at its "Exact next action".

Keep cross-env and Moment/timezone out of this work; the zoneless Angular migration
is already on main and this removal follows it (owner, 2026-11-08). Preserve
features/UI and original visual references. No instruction here authorizes
merging a future PR or publishing the separate viewer without applicable approval.

## Artifacts

All under `.upgrade-artifacts/remove-electron-remote/` (ignored by git):

- `viewer/1ff7a50/`: a clone of Photo Data Viewer at its main commit 1ff7a50,
  built for this app (`PDV_IN_PLM=True NEXT_PUBLIC_GOOGLE_ANALYTICS_ID= npx next
  build --webpack`, with its own mise.toml). Serve it with
  `PDV_IN_PLM=True NEXT_PUBLIC_GOOGLE_ANALYTICS_ID= npx next start -p 3130 -H 127.0.0.1`
  from that directory (`MISE_TRUSTED_CONFIG_PATHS="$PWD/mise.toml" mise exec --`).
  The production server's page had build ID VqTPTJF1JHNCsQCU8-7qg on 2026-11-09.
- `workloads/`: made by `test/performance/workload.mjs`; `manifest.json` has the
  SHA-256 of each file. IDs: large 3b8be5ead9724e0e (324 files, 986.7 MB as APFS
  clones), view-jpeg e54629e8bbf5aa31, view-heic 2b4ad7584c246aad.
- `artifacts/<stage>/Photo Location Map.app`: each stage's packaged app, an arm64
  directory build signed with the keychain certificate and not notarized
  (`npm run build:prod`, then `PLM_PACKAGE_TEST=true npx electron-builder build
  --mac dir --arm64 --publish never`, then `ditto` out of `release/mac-arm64/`).
- `series/<series>/`: raw trials and summaries of each measurement series.
- `logs/`: build, test and server logs.

## Inventory at the implementation base (449f30f3)

`@electron/remote` users (stage A replaces all of them):

| Where | What it reads or does through remote |
| --- | --- |
| `src-shared/require/require-from-main-process.ts` | `fs-extra`, `electron`, `os`, `path` of the main process, for the four users below |
| `src-shared/user-data-storage/user-data-storage.ts` | `app.getPath('userData')` and the file reads and writes of every setting, at class initialization |
| `src-shared/version/is-prerelease-version.ts` | `app.getVersion()` at module evaluation (analytics keys and endpoint) |
| `src-shared/process/restart-app.ts` | `app.relaunch()`, `app.quit()` |
| `src-shared/log/file-writer/log-file-writer-main.ts` | (main only) `fs-extra`, `os` through the indirection |
| `src/app/sidebar/upper-pane/sidebar-upper-pane.component.ts` | `dialog.showOpenDialog(getCurrentWindow())`, `fsExtra.stat` of the last folder |
| `src/app/about-box`, `src/app/welcome-dialog` components | `app.getVersion()` |
| `src/app/shared/exif-fetcher/using-exifr/fetch-exif-using-exifr.ts` | `remote.require('exifr')`, the main process's managed reader (`electron-util/managed-exifr.cjs`) |
| `electron-util/configure-electron-remote-in-main-process.js` | initialization, the `remote-require` allowlist and the per-window enable hook |

Other Node.js and Electron use in the renderer (C1 replaces it): `ProxyRequire`
(`electron`, `os`, `path`) for the raw IPC listeners in `src/ipc-renderer-setup/`,
the renderer's analytics IPC and `LogFileConfig`'s `sendSync`; `ipcRenderer`
imports in the View Data, OS tab, thumbnail, photo-selection and open-after-launch
code; `fs-extra` in the cache settings, open-after-launch and the thumbnail cache
checks (`src-shared/thumbnail/cache/thumbnail-cache-util.ts`, polled every 5 s while
HEIC thumbnails are made); `child_process` and `os` in `src-shared/command/`
(opening files and folders with the OS); `shell.openExternal` in
`src-shared/url/open-url.ts`; `os` in the settings dialog and
`max-file-path-length-on-windows.ts`; `path` in the folder history, the opened
directory and open-after-launch; `process.env` in `app.config.ts`,
`thumbnail-cache-util.ts`, `dev-or-prod.ts`, `environment-detector.ts`; the
Node-enabled directory Worker (`directory-tree`, through comlink); the unused
exif-parser path (`window.require('fs-extra')`); the renderer half of analytics
(`AnalyticsConfig.userId` reads and writes the user ID through UserDataStorage).
Nine renderer module bridges in `electron-util/renderer-modules/`.

Settings keys and their writers: the renderer writes FolderDialog,
LeafletMap.SelectedBaseLayer, DirectoryTreeView.Sort*, History.ClickedOkOnWelcomeDialog
and UserSettings; the main process writes History.FirstLaunchDateTime,
LastLaunchDateTime, LaunchCount and PhotoDataViewer.Window*; both read and may
create Analytics.UserId.

Photo Data Viewer (separate repository, Next.js, main 1ff7a50): detects Photo
Location Map by `process.type === 'renderer'`, reads the photo with
`get-file-object-from-local-path` (Node.js `fs`) from the `photoPath` query
parameter, takes the date settings from the query, sends analytics with
`window.require('electron').ipcRenderer.send('analytics-backend-track-event', ...)`,
and reads `os.homedir()` to scrub paths from errors. It shows the photo beside its
data only in windows wider than 1200 pixels.

## Stage ledger

| Stage | State | Accepted source/build | Tests/CI | Performance series/result | Exact next action |
| --- | --- | --- | --- | --- | --- |
| 0 | ACCEPTED | Instrumentation fb581a26, harness 50670795, protocol c67935b4; packaged app `artifacts/0/` (code e6a1d1e7c0b2) | Lint, unit (Vitest 89; Electron-Mocha 136 main, 70 renderer) and headless e2e (40 passed, 1 Windows-only skipped) pass on fb581a26's build | Pilot (12/12 ok) set rer-1; baseline rer-1-0 40/40 ok, viewer unchanged (RESULTS.md); rer-2 retimes two metrics in the page, and its series rerun 0 beside each stage | Done |
| A / 1 | ACCEPTED | 235d6172; packaged app `artifacts/A/` | Build, lint, unit (Vitest 89; Electron-Mocha 144 main, 66 renderer), dependency-compat (4), package-runner (19), headless e2e (40 passed, 1 Windows-only skipped) and live reload pass; packaged tree has no @electron/remote | rer-2-A: 88/88 ok; folder opening 12 % faster, 101 within budget, one frame-quantized driver latency (RESULTS.md) | Done |
| B / 2 | ACCEPTED | f5b5f7b1; packaged app `artifacts/B/` | Build, lint, unit (Vitest 89; Electron-Mocha 147 main and 2 pending, 69 renderer), dependency-compat (4), package-runner (19), headless e2e (43 passed, 1 Windows-only skipped) and live reload pass | rer-2-B: 132/132 ok; against 0, A's folder-opening gains (6 improvements) and 102 within budget; against A, all 108 within budget (RESULTS.md) | Done |
| C1 / 3 main window | ACCEPTED | 0aefe3fc; packaged app `artifacts/C1/` (earlier ones in `artifacts/C1-ac6a51ad/`, `artifacts/C1-f3cabca8/`) | Build, lint, unit (Vitest 96; Electron-Mocha 181 main and 2 pending, 62 renderer, now with the real preload), dependency-compat (4), package-runner (19) and live reload pass; headless e2e passes at 0aefe3fc on the checkout (44, 1 Windows-only skipped), on `ng serve` (44) and on the package (43, 2 skipped); 100 harness launches of f3cabca8 all started; see "Stage C1 notes" | rer-2-C1 (ac6a51ad) found 3 regressions, fixed; rer-2-C1b (f3cabca8) 132/132 ok and rer-2-C1c (0aefe3fc, open-folder) 33/33 ok: home view 6 to 8 % earlier than B, folder opening as B, two explained moves of work (RESULTS.md) | Done |
| C2 / 3 viewer | NOT STARTED | None | NOT RUN | NOT RUN | Compatible viewer preview may be prepared during C1; no host release before rollout gate |

## Stage C1 notes

What changed, in short (commit ac6a51ad): the main window's page runs with `contextIsolation: true`,
`nodeIntegration: false`, `nodeIntegrationInWorker: false` and `sandbox: true`, through
`withHeadlessTestOptions`; its preload `electron-util/preload/main-window.cjs` gives it `window.plm`
(`src-shared/bridge/plm-bridge.ts`). Every main-process handler checks the sender (`src-main/ipc/ipc-sender.ts`:
the main window's top frame on the app's own page) and its input; paths must be in a folder that the user chose
(`src-main/ipc/user-chosen-folders.ts`). The directory tree runs in a worker thread of the main process; the
thumbnail cache checks are asynchronous in the main process; the OS open commands run without a shell (a file name
with `$(...)` would have run as a command before); the renderer's nine Node.js module bridges, `ProxyRequire`, the
unused exif-parser path and the `comlink` and `exif-parser` devDependencies are gone. Verified at run time, not only
by the build: the e2e case "the main window's page runs isolated" reads the applied web preferences, finds no
`require`, `process`, `module`, `Buffer` or `global` in the page or a worker, and checks the refusals of the main
process, also for a request from another window.

Found by series rer-2-C1 (of ac6a51ad), and fixed before rer-2-C1b:

- The first attempt stopped in its warm-up round: a View Data trial failed before the harness awaited the viewer's
  window, and that wait's rejection, unhandled, ended run.mjs. The harness now handles it (b1f5733d); the second
  attempt ran whole.
- `startup.*.renderer-modules-ms` +14 to +17 % against 0 (REGRESSION): the page loads the app once it has its
  bridge, so the app's chunk was fetched after the entry ran. A post-build step now preloads it
  (`script/build/preload-app-chunk.js`); six startups of the checkout took 120 ms to the bootstrap instead of 140.
- `open-folder.cold.finish-ms` +31 % against 0 (REGRESSION): first taken for the asynchronous cache checks, which
  were made synchronous again (b1f5733d) without changing it in rer-2-C1b. The trials' marks then showed the cause:
  the page asked for the cache's state after showing the tree, and rendered the tree while it waited. The check now
  starts with the tree's reading (0aefe3fc), and the span is B's again in rer-2-C1c.
- One open-folder trial of C1 never rendered its home view. The e2e suite's new diagnostic then showed why, in one
  launch: the startup metadata was refused. The sender check also took the frame's URL, which, at the preload's
  synchronous request, could still be the previous one. The check now takes the main window's top frame without its
  URL, and the window never leaves the app's page (`src-main/ipc/main-window-pages.ts`, f3cabca8); 100 launches of
  the harness then all started. b3689bc8 had compared the URLs' paths decoded, which the page check keeps.

Found while testing, and fixed:

- Under Playwright's debugger, Electron 45.2.1 ran the sandboxed preload after the page's module in 6 of 16
  launches (70 to 77 ms against DOMContentLoaded at 64 to 69 ms); plain launches, 35, never did. The page
  (`src/main.ts`) now waits for the bridge before it loads the app (`src/start-app.ts`), and the preload keeps
  what the main process sends before the page listens (the end of the launch's records, which opens `--open`,
  and the launch's analytics events). The evidence is in the comments next to both.
- One full e2e run, between those fixes and the last runs, had one relaunch that did not render, without
  diagnostics; 36 repeats of the launch-heavy cases and three later full runs (checkout, `ng serve`, package)
  passed. The launch helper now says, when the home view does not render, whether the page had its bridge and
  what it threw.

Exceptions that remain after C1 (PLAN.md, C1 step 7):

- Photo Data Viewer's window keeps `nodeIntegration: true` and `contextIsolation: false`, named explicitly as
  `legacyPhotoDataViewerWebPreferences`; its page reads the photo by path with Node.js. Stage C2 isolates it.
- The photo path that the main window asks Photo Data Viewer to open is checked for its shape only; binding it
  to a folder that the user chose comes with C2's capability.
- The main window keeps `webSecurity: false` (and with it insecure content) and has no Content Security Policy,
  out of this plan's scope (tracked separately). Its navigation is restricted to the app's page since f3cabca8.

## Required update fields while executing

For the active stage, record:

```text
Date/time and stage:
Source branch/HEAD and working-tree files:
Last accepted source/artifact (hash + location):
Harness/protocol/input/viewer IDs:
Commands and outcomes (pass/fail/incomplete, log paths):
Current tests/CI runs and failure classification:
Performance summary and comparison decision:
Pending writes/owned profile or temporary-data cleanup:
Owned PID/session + command/start time + log/status:
External viewer/deployment/compatibility state:
Unresolved issue and concrete owner decision, if needed:
Next executable action, including command when it exists:
```

Keep failed attempts and their disposition. For a new protocol series, identify
which original 0/predecessor/candidate measurements must be repeated. Do not
overwrite an accepted row with unverified WIP. Raw artifacts may be ignored,
but accepted public-safe summaries and decisions must be committed here.

## Planning verification

This delivery must have checked Markdown links, whitespace and cross-document
stage/scope consistency, plus a git diff proving only task documents changed.
It must not claim functional tests, performance measurements or independent
viewer deployment. Record any subsequent planning edits in git history; actual
execution replaces this paragraph with dated checkpoint results as it proceeds.

2026-11-08: the plan was revised for the changes on main (PLAN.md, "Changes on
main since the plan was written"). Links, whitespace and cross-document
consistency were checked again, and the diff against main 4ade1268 is task
documents only. Still no functional test, measurement or viewer change.

2026-11-09: main b7c9bfe6 (PR 673) merged into the branch and recorded in
PLAN.md; the same checks were repeated, and the diff against main is task
documents only. Review of the pull request then had the baseline require
b7c9bfe6, the window mode per platform (hidden windows are throttled on
Windows and Linux), a viewer milestone that exists headless, and the Linux e2e
caveat written in. The owner then limited performance measurement to macOS and
Windows: PLM does not support Linux officially, and Linux CI stays functional.
Still no functional test, measurement or viewer change.

## Questions for the owner

Collected during execution for the end, as the owner asked on 2026-11-09. Each
records what is assumed meanwhile.

| # | Question | Assumed meanwhile |
| ---: | --- | --- |
| 1 | The performance series run on this Mac only; a Windows series needs the owner's Windows PC. Run it there, or accept macOS-only evidence? | macOS evidence only; the harness's commands are written so that the owner can run a Windows series. |
