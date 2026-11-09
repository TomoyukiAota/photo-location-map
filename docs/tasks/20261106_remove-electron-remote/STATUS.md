# Execution status and handoff

Updated 2026-11-10 (Asia/Tokyo). This file is the execution ledger; keep it current
after every meaningful result and before stopping. Do not infer completion from
the existence of a plan or from an agent's previous messages.

## Current checkpoint

- State: DONE, by the owner's decisions of 2026-11-10. Stages 0, A, B, C1 and C2 accepted, and final C verified
  ("Final C notes"). Stage C2 is on its branch `claude/isolate-photo-data-viewer`: a6f70a51, which is b6a4bfa3, the
  measured build's source, rebased onto the C1 branch's CI fixes (08aaed71). On 2026-11-09, the owner's Windows PC
  measured series rer-2-C2w of 0, C1 at 2fc31672 and C2 at 080a8217 (RESULTS.md, "Stages C1 and C2 on Windows"); its
  summary came as 73bd5f66, and 93dd336e records its analysis. C1 and C2 stay accepted with its three regressions
  against 0 ("Stage C2 notes"). On 2026-11-10 the owner found the performance sound, kept stage C2 as it is, with the
  URL, and handed over the rest of the work up to the implementation in both repositories, with no release of Photo
  Location Map: Photo Data Viewer's pull request 72 is merged (c6f1c01e) and deployed, pull request 676 is merged into
  main (006a6343), and this branch follows it as pull request 677. Left for the owner: a release, when wanted.
- Authorization: on 2026-11-09 the owner started the implementation, to run until
  the plan is complete, with questions for the owner collected for the end
  (section "Questions for the owner" below). Merging and publishing the separate
  viewer still need their own approval (PLAN.md).
- Final target: C, via measured 0 -> A -> B -> C1 -> C2. C1 alone is incomplete C.
- Branches: `claude/remove-electron-remote` (stages A to C1, pull request 676, merged into main on 2026-11-10) and
  `claude/isolate-photo-data-viewer` (stage C2, pull request 677, on main since). `claude/windows-performance-series`
  (73bd5f66, the Windows series' summary, in C2's branch) is deleted once 677 is merged, with the rest of the work
  that the owner handed over.
- Last accepted IMPLEMENTATION stage: C2 (a6f70a51), with C1 (0aefe3fc) and its CI fixes (08aaed71) below it.
  The fixes for the review of pull request 676 (d088a836, on its branch) are merged into this branch, and the
  viewer's window logs a failed preload as the main window's does. With both: build, lint, unit tests (Vitest 96;
  Electron-Mocha 198 main and 2 pending, 62 renderer) and headless e2e on the checkout (44, 1 Windows-only
  skipped), with the viewer's 6fe8814, pass. Since then, 676's branch has a00a2c4a (JSDoc for the review's check
  of docstrings), fb98fe1d (the memory sampler) and 2fc31672 (the harness reads a Windows build), each merged
  here, and cedc9a64 describes C2's own functions. 73bd5f66 and the commit after it record the Windows series,
  without changing the app or the harness.
- CI of pull request 676: the two e2e cases where the app relaunches itself failed with the packaged app on Linux
  and Windows, on both triggers; macOS passed. They came with stage B and had not run on those systems before.
  954132fc makes the failure tell what the relaunched app logged; 74046e4c and 08aaed71 fix them ("Stage C1
  notes"). At 08aaed71, CI passes on Ubuntu, Windows and macOS, on both triggers. d088a836 addresses the
  automated review of 676: its 23 threads are answered and resolved, 20 with a change and 3 kept with the reason,
  which the review then withdrew. At fb98fe1d and at 2fc31672, CI passes on Ubuntu, Windows and macOS, on both
  triggers.
- CI of draft pull request 677 (080a8217, as at ca87fb49 and e10f7a49): on Ubuntu, Windows and macOS, only the four
  View Data cases fail, as they must against the viewer that production serves, which does not know the bridge; the
  other cases pass (38, 40 and 39). Not to be rerun: they pass once the viewer is deployed. 73bd5f66 has `[skip ci]`
  and ran none. The viewer is deployed since 2026-11-10, and Mergify merges the pull request only once all three
  test jobs pass. 93dd336e's run straddled the deployment: macOS ran its View Data cases after it and passed them
  all, and Windows passed the three that it ran after it; Ubuntu's four and Windows' first, which ran before it,
  failed as above, and their jobs were rerun.
- This Mac: Xcode 27.2 was installed at 09:30 (Asia/Tokyo) on 2026-11-09, and its license was accepted at 09:51
  the same day (`/Library/Preferences/com.apple.dt.Xcode.plist`; `xcodebuild -license check` passes), which this
  record missed until 2026-11-10. Before that, `git`, `python3` and the notarization tools failed through their
  `/usr/bin` shims, and ran through the Command Line Tools with `DEVELOPER_DIR=/Library/Developer/CommandLineTools`;
  they need it no more.
- Task-owned processes: none. Both Photo Data Viewer servers were stopped on 2026-11-09 after the last series;
  restart one with the command in "Artifacts" below when a test needs it.
- External viewer changes/deployments: Photo Data Viewer's change for the bridge,
  https://github.com/TomoyukiAota/photo-data-viewer/pull/72 (6fe8814, its CI green), was merged on 2026-11-10
  (c6f1c01e) and deployed: production, https://pdv-in-plm.vercel.app/, serves build dzAaBBkEEgsA9XOfR8x12 instead of
  VqTPTJF1JHNCsQCU8-7qg, and its scripts have the bridge. With the viewer of before, stage C2's window showed nothing
  and logged that its page did not ask for its photo, as designed (checked with 1ff7a50 on port 3130).

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
- `viewer/c2/`: a clone of Photo Data Viewer on its branch `claude/isolated-host-bridge` (stage C2's viewer),
  built the same way and served on port 3131 instead. Series rer-2-C2 measured 568b8ab (build
  kiytqYrbcsLHxY4Dju6bp). It serves 6fe8814 since (build 2VJOG_nWG_NWbGWXRSpPe), which adds an error message and
  comments; its scripts are the same as d3a2afc's build, which the rebased branch's e2e used.
- `worktrees/c1/` was a git worktree of `claude/remove-electron-remote`, for the CI fixes of pull request 676 while
  the main checkout was on the C2 branch; removed once they were pushed.
- `release/` has the final C package of e10f7a49 (`npm run package:mac`): the DMG, the update ZIP and
  `latest-mac.yml`, not published.
- `workloads/`: made by `test/performance/workload.mjs`; `manifest.json` has the
  SHA-256 of each file. IDs: large 3b8be5ead9724e0e (324 files, 986.7 MB as APFS
  clones), view-jpeg e54629e8bbf5aa31, view-heic 2b4ad7584c246aad.
- `artifacts/<stage>/Photo Location Map.app`: each stage's packaged app, an arm64
  directory build signed with the keychain certificate and not notarized
  (`npm run build:prod`, then `PLM_PACKAGE_TEST=true npx electron-builder build
  --mac dir --arm64 --publish never`, then `ditto` out of `release/mac-arm64/`).
- `series/<series>/`: raw trials and summaries of each measurement series.
- `series/rer-2-C2w/` and `series/rer-2-C2w-smoke/`: the Windows series and the smoke run just before it, from the
  owner's Windows PC (removed after the import). `summary.delivered.md` and `summary.delivered.json` are the
  summaries as they came; summarize.mjs made the same bytes again here.
- `windows-rer-2-C2w/`: that run's logs, scripts and commit message, and its `workloads/manifest.json`, whose folders
  are that PC's.
- The Windows builds were not kept. To make one again, on Windows: a clone of its commit, which Git for Windows
  checks out with `core.autocrlf=true`, then `npm ci`, `npm run build:prod` and
  `npx electron-builder build --win dir --x64 --publish never` (electron-builder 26.18.1); its executable is
  `release\win-unpacked\Photo Location Map.exe`.
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
| C1 / 3 main window | ACCEPTED | 0aefe3fc; packaged app `artifacts/C1/` (earlier ones in `artifacts/C1-ac6a51ad/`, `artifacts/C1-f3cabca8/`) | Build, lint, unit (Vitest 96; Electron-Mocha 181 main and 2 pending, 62 renderer, now with the real preload), dependency-compat (4), package-runner (19) and live reload pass; headless e2e passes at 0aefe3fc on the checkout (44, 1 Windows-only skipped), on `ng serve` (44) and on the package (43, 2 skipped); 100 harness launches of f3cabca8 all started; see "Stage C1 notes" | rer-2-C1 (ac6a51ad) found 3 regressions, fixed; rer-2-C1b (f3cabca8) 132/132 ok and rer-2-C1c (0aefe3fc, open-folder) 33/33 ok: home view 6 to 8 % earlier than B, folder opening as B, two explained moves of work. On Windows, rer-2-C2w (2fc31672): against 0, 17 improvements, the folder opening 47 % sooner, and 3 regressions kept with their reasons, the folder's tree 5 to 6 ms longer (not understood) and the bootstrap on a used profile, time moved from the renderer's modules (RESULTS.md) | Done: merged into main by pull request 676 on 2026-11-10 (006a6343) |
| C2 / 3 viewer | ACCEPTED; its viewer deployed on 2026-11-10 | a6f70a51 (b6a4bfa3 before the rebase onto 08aaed71); packaged app `artifacts/C2/`, of b6a4bfa3; viewer 568b8ab, then 6fe8814 (its pull request 72, merged and deployed on 2026-11-10) | Build, lint, unit (Vitest 96; Electron-Mocha 194 main and 2 pending, 62 renderer); headless e2e on the checkout (44, 1 Windows-only skipped) and the package (43, 2 skipped); the new viewer in stage 0's and C1's packages (4 of 4 each) and in its own Electron tests (Electron 32.0.2 and 45.2.1); see "Stage C2 notes" | rer-2-C2: 176/176 ok; against C1, 104 within budget and 4 improvements, no regression; the URL transport kept (IPC within budget everywhere); startup disturbed by the computer's load. rer-2-C2s, startup again: against C1, all 30 within budget. rer-2-C2v: the new viewer in stage 0's window, all 31 View Data metrics within budget. On Windows, rer-2-C2w (080a8217): against C1, 86 within budget and 4 improvements, no regression, the JPEG shown 56 to 69 ms later, within budget; against 0, C1's 3 regressions; 3 View Data trials failed, likely on a race of the harness, and whether C1's changes play a part is not known (RESULTS.md) | Done, with final C ("Final C notes"): after the viewer's deployment and the merge of 676 (2026-11-10), this branch goes into main as pull request 677. No release (owner, 2026-11-10) |

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

Found by the CI of pull request 676, after C1's acceptance, and fixed in 74046e4c and 08aaed71 on that branch: the
two e2e cases where the app relaunches itself, which came with stage B and had run on macOS only, failed with the
packaged app on Linux and Windows. 954132fc made the failure tell what the relaunched app logged:

- Linux: the app quit and no launch followed. An AppImage runs the app from a mount that its launcher removes once
  the app has quit, and the helper that app.relaunch() starts to start the app again runs from that mount too, so
  nothing started even with the AppImage as its executable (74046e4c). From an AppImage, /bin/sh now waits for the
  app to end and starts the AppImage again (08aaed71, `src-main/process/relaunch-and-quit.ts`). Restarting after a
  saved setting did not relaunch the AppImage before this work either.
- Windows: Playwright starts the app through a shell (cmd.exe), so `app.process().pid` was the shell's, and the
  report's only line, the quitting app's own, was taken for the relaunched one. The cases, and the harness on
  Windows, now take the main process's own ID; on macOS and Linux it is the same ID, so earlier series stand.

## Stage C2 notes

What changed, in short (commit a6f70a51, b6a4bfa3 before its rebase onto the C1 branch's CI fixes): Photo Data
Viewer's window runs as the main window does, with `contextIsolation: true`, `nodeIntegration: false`,
`nodeIntegrationInWorker: false` and `sandbox: true`, through `withHeadlessTestOptions`. Its preload
`electron-util/preload/photo-data-viewer.cjs` gives the page `window.plmPhotoDataViewer`
(`src-shared/photo-data-viewer/photo-data-viewer-bridge.ts`): `readPhoto()` and `trackEvent()`. The main process
grants each viewer window a capability, a random token for the photo that the user chose, which only that window's top
frame may ask for and which ends when the window leaves the viewer's origin, closes or its page crashes
(`src-main/photo-data-viewer/photo-delivery.ts`). The photo's path is no longer in the viewer's address, the viewer
may open only a photo in a folder that the user opened, its links open only web pages, and its window stays on the
viewer's origin. A viewer that does not ask for its photo within 15 seconds of loading, as one without the bridge
would not, is logged and recorded; the window is never given Node.js instead.

The viewer's side is Photo Data Viewer's branch `claude/isolated-host-bridge`: 568b8ab, then d3a2afc, which adds an
error message, and 6fe8814, comments (https://github.com/TomoyukiAota/photo-data-viewer/pull/72, merged on 2026-11-10
as c6f1c01e and deployed). It uses
the bridge when the window gives it, and in the earlier window, which has Node.js, reads the photo by its path as
before.

Found while testing, and fixed:

- The viewer's build for this app used webpack's `electron-renderer` target. Its output registered the chunks on
  Node.js's `global` and had `require("fs")`, `require("path")`, `require("buffer")` and `require("process")`, so
  nothing ran in the isolated window ("global is not defined"). It is built for a browser now, as the standalone
  deployment is; in the earlier window it reads the photo with Electron's own `require`.
- Chromium gives protocol.handle no Origin header: the request had only `accept` and `user-agent`, with mode `cors`
  and the viewer's page as its referrer. The first check, of the Origin, refused every request (403), and the viewer
  then showed an empty file. The handler now takes a CORS request whose referrer is the viewer's page, and answers it
  for the viewer's origin only; the viewer sends its referrer explicitly and fails on a refused answer.
- net.fetch of the photo's file: URL went through the app's own handler of file: URLs (`protocol.registerFileProtocol`
  in `src-main/electron-main.ts`, a workaround for the development server), which decodes the URL with `decodeURI`
  and so keeps `%23`: every path with `#` failed with ERR_FILE_NOT_FOUND. net.fetch now bypasses custom handlers, as
  Electron documents for this; a unit test registers a refusing handler and fails without the bypass.

Verified on this Mac (arm64), with the viewer at 568b8ab served on port 3131:

- Build, lint, unit tests (Vitest 96; Electron-Mocha 194 main and 2 pending, 62 renderer). Headless e2e passes on
  the checkout (44, 1 Windows-only skipped) and on the C2 package (43, 2 skipped). Its View Data cases check the
  window's applied web preferences, that the page has neither `require` nor `process`, that the address has no
  photo path, that the main window's page cannot read the photo's URL, and that the URL ends with the window, for
  four photos, two of them at a path with Unicode, spaces, `#` and `%`. The bytes transport, the test profile's
  switch, showed such a photo in a View Data run of the harness, and runs in the series' C2-ipc trials.
- The viewer: lint, typecheck, unit tests (169), both builds, its browser tests (14) and development smoke test (1),
  and its Electron tests, all 8 with Electron 32.0.2 (the runtime of the installed 1.12.1) and the isolated
  window's 5 with Electron 45.2.1. Its CI passes on macOS, Ubuntu and Windows.
- After the rebase onto the C1 branch's CI fixes (a6f70a51): build, lint, unit tests (Vitest 96; Electron-Mocha 196
  main and 2 pending, 62 renderer) and headless e2e on the checkout (44, 1 Windows-only skipped), with the viewer's
  d3a2afc.
- With the viewer that production serves, 1ff7a50, stage C2's window shows nothing, its page throws "global is not
  defined", and the main process logs after 15 seconds that the page did not ask for its photo; it is never given
  Node.js instead. That pairing is unsupported, so the viewer's deployment must come before C2's release.

| Window that opens the viewer | Viewer 568b8ab |
| --- | --- |
| Stage 0's package, with Node.js (stage 0's e2e cases, without its comparison of the checkout's dependencies) | 4 of 4 |
| C1's package, with Node.js (C1's e2e cases) | 4 of 4 |
| C2, isolated (checkout and package) | 4 of 4 |
| Electron 32.0.2 with Node.js, as 1.12.1 (the viewer's own tests) | 3 of 3 |
| Electron 32.0.2 and 45.2.1, isolated (the viewer's own tests) | 5 of 5 each |
| A browser, as the standalone deployment | 14 of 14, and the development smoke test |

The transport rule, written down during series rer-2-C2 before its View Data numbers were read: compare C2-ipc with
C2-url, the default, by summarize.mjs's rer-2 verdicts on the View Data metrics (request to image for the first JPEG,
the JPEG and the HEIC, request to metadata, the process tree's peak and settled increases, the increase after
closing, and what the cycles leave). Keep the URL unless IPC has an improvement verdict on a request-to-image or a
memory metric, with no regression verdict elsewhere; then make IPC the default.

Measured in series rer-2-C2 (RESULTS.md): against C1, no regression, 104 of the 110 metrics within budget and 4
improvements, among them 105 MB less in the process tree while a HEIC is shown. Against 0, stage A's folder-opening
gains, and C1's one regression verdict, the page's wait for its bridge. IPC showed the photo 16 to 20 ms sooner than
the URL, within budget on every metric, so by the rule the URL stays, and IPC stays a switch of the test profile only
(`PLM_TEST_PHOTO_TRANSPORT`), for a later comparison.

Measured again in series rer-2-C2s (RESULTS.md), startup only, on a quiet computer: C2 starts as C1 does, all 30
metrics within budget against C1, and the home view renders 8 to 9 % earlier than in 0.

Measured in series rer-2-C2v (RESULTS.md): in stage 0's package, a window with Node.js as 1.12.1's, stage C2's viewer
is the same as the one that production serves. All 31 View Data metrics are within budget, and the photo shows
within 1 ms. Deploying it changes nothing measurable for the installed app.

Measured on Windows in series rer-2-C2w (RESULTS.md), on the owner's PC, with C1 at 2fc31672 and C2 at 080a8217:
against C1, no regression, 86 metrics within budget and 4 improvements, and the JPEG shows 56 to 69 ms later, within
budget. Against 0, C1's three regressions, with which C1 and C2 stay accepted: reading the folder's tree takes 5 to
6 ms longer, not understood and not investigated (owner, 2026-11-10), and the bootstrap on a used profile 28 to 32 ms
longer, as time that moved from the renderer's modules. Three View Data trials failed, likely on a race of the
harness ("Before the next series"); whether the changes of C1 play a part is not known.

## Final C notes

`npm run package:mac` at e10f7a49 (stage C2 on the C1 branch's CI fixes), in the background, with
`DEVELOPER_DIR=/Library/Developer/CommandLineTools`, which this record then took to be needed, though Xcode's
license had been accepted at 09:51 (Current checkpoint):

- Signed with the Developer ID Application certificate and notarized: the notarization took from 01:25:31 to 01:27:54
  (UTC), and the build gave no warning but the Angular build's 14 about CommonJS modules (23 at stage 0).
- `codesign --verify --deep --strict`: valid on disk, and satisfies its Designated Requirement. Gatekeeper (`spctl
  --assess`): accepted, "source=Notarized Developer ID". `stapler validate`: the app's ticket validates. The DMG has
  neither a signature nor a ticket, as `electron-builder.json` sets no signing for it, unchanged from main. Both
  architectures in the executable: x86_64 and arm64.
- The update feed `release/latest-mac.yml` has 1.12.1's shape: version, the ZIP and the DMG with their hashes and
  sizes, path, sha512 and releaseDate, and `vendor.minimumSystemVersion: '13.0'`, which main added since (8d3d587e).
- The packaged visual e2e (`PLM_VISUAL=1`) on the universal app: 43 passed, and the 2 skipped as designed (the
  Windows-only case and the website, which is verified apart from the package), with the viewer's 6fe8814 on port
  3131.
- The DMG smoke, the package test's smoke step on that DMG with a profile of its own: passed. The app ran 60 seconds
  from the mounted DMG, with its windows off the screen, both `[Main]` and `[Renderer]` logged, and the app quit and
  the DMG detached.
- The x64 half was not run here: Rosetta is not installed on this Mac, and installing it would change the system.
  AGENTS.md's Intel CI is not needed either: no new Electron or electron-builder version, no change to the macOS
  settings in `electron-builder.json`, and no dependency with native code (stage A removed `@electron/remote`, C1
  `comlink` and `exif-parser`, none of them native).

## Before the next series

Known weaknesses of the harness, found with series rer-2-C2w (1 to 3) and by the automated review of pull request
677 (4 and 5), and left as they are for now, as the owner decided for the first three (2026-11-10). Fix them before
the next series; once fixed, record the change and check that no span's endpoints move (PERFORMANCE.md). 1 and 2 did
not happen in rer-2-C2w, 3 is the likely cause of its three failed trials (whether C1's changes play a part is not
known), and no series met 4 or 5. Only Windows can check 1.

1. On Windows, `close()` in `test/performance/lib/app.mjs` cannot end an app that is stuck. Its two kills, after the
   timeout (lines 137 to 142) and when Playwright says that the app closed while it still runs (lines 148 to 151),
   both signal `app.process()`, which on win32 is the shell (cmd.exe) that Playwright's `_electron.launch` starts the
   app through, not the app's main process. In rer-2-C2w, no startup's close took more than 110 ms (66 closes). The
   lengths of the three failed trials (59.0, 73.8 and 74.0 s) fit a failure in the first of the cycles (C2's warm-up)
   and in the third (both of round 2), each followed by a prompt close. Two cycles take about 15 s, though, as long as
   `close()` waits, so round 2's two could also have failed in the first cycle and waited for `close()` to give up:
   their lengths cannot tell. Had they, only cmd.exe would have been killed, and the app would have stayed. The run's
   check every 5 minutes never found two main processes of the app, and the Windows session found none left after
   the series (not recorded).
2. Two promises in `test/performance/lib/scenarios.mjs` are made before a click and awaited after it: `markers`
   (lines 100 to 104, on the first open only) and `closed` (lines 327 to 331). When a trial fails between the two,
   nothing awaits them; their rejection when the app closes is then unhandled and ends run.mjs. It is the failure
   of `windowEvent` in the first attempt of rer-2-C1, which lines 202 to 206 fixed.
3. The race in View Data's cycles, the likely cause of those failures (RESULTS.md, "Stages C1 and C2 on Windows").
   A closing popup shows the photo's
   name for its 200 ms, so waiting for the name alone does not fix it. To fix it, press the marker only when no
   `.leaflet-popup` that shows the photo's name has an opacity of 1, and then wait for one that has. Leave the click
   on View Data (lines 207 and 208) as it is: it starts `menu-to-request-ms`. Inside Leaflet's container, expect too
   that Leaflet undoes the scrolling of Playwright's retried clicks.
4. `launch()` in `test/performance/lib/app.mjs` (lines 42 and 43) applies a build's `--app-env` after the harness's own
   settings, so such a variable can replace `PLM_TEST_ROOT`, the profile that a trial makes and removes, or
   `PLM_TEST_OFFLINE`, and change what is compared. No series passed either. Apply `--app-env` before them, and keep
   `PLM_TEST_PHOTO_DATA_VIEWER_SERVER` as the one setting that a build may change.
5. `test/performance/run.mjs` (lines 112 and 149 to 150) hashes only the common `--viewer-server` at a series' start
   and end, so a build's own server, given by `--app-env`, is not checked for a change. rer-2-C2v, which had such a
   server, had it hashed by hand before and after (`results/rer-2-C2v.md`). Hash each build's own server at both
   ends.

For the next series on Windows, also:

- Record whether the session is locked before the series, from Winlogon or WTS.
- Collect the event logs of the series' hours: AppX, ClipSVC, Store, Software Protection and the account services.
- Sample the CPU of each process, the services' included.
- Stop the resident apps that the measurement does not need, before it.
- Record the temperature.

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
| 1 | The performance series run on this Mac only; a Windows series needs the owner's Windows PC. Run it there, or accept macOS-only evidence? | Answered on 2026-11-09: the owner runs it on the Windows PC. Run there on 2026-11-09 as series rer-2-C2w, of 0 (fb581a26), C1 (2fc31672) and C2 (080a8217), all with the viewer 6fe8814, and recorded on 2026-11-10 (RESULTS.md, "Stages C1 and C2 on Windows"). Done. |
| 2 | Merge Photo Data Viewer's pull request 72 (https://github.com/TomoyukiAota/photo-data-viewer/pull/72), which deploys it to production? It keeps working in 1.12.1's window, and stage C2's window needs it. | Merged on 2026-11-10 (c6f1c01e), with the rest of the work that the owner handed over, and deployed: production serves build dzAaBBkEEgsA9XOfR8x12, with the bridge. Done. |
| 3 | Merge pull request 676 (stages A to C1)? | Merged into main on 2026-11-10 (006a6343), once main's #675 was merged into it (c99340fd) and its CI passed. Done. |
| 4 | Once the viewer is deployed, merge stage C2's pull request, and release? | The owner (2026-11-10): merge stage C2's pull request, now that the viewer is deployed, and release nothing for now. Pull request 677 is merged after this record, once its CI passes; nothing is released. |
| 5 | Accept the license of Xcode 27.2, installed on this Mac at 09:30 on 2026-11-09 (`sudo xcodebuild -license`)? | Already accepted, at 09:51 on 2026-11-09, as the owner pointed out on 2026-11-10: `xcodebuild -license check` passes, and the tools run without the Command Line Tools. Done. |
| 6 | The check of the folders that the user opened compares paths as written, so a symbolic link in such a folder to a photo outside it gives the page that photo's EXIF and thumbnail, and opens it with the OS (raised three times by the automated review of pull request 676, outside its diff). The folder's tree follows links, as directory-tree does by default, so the app shows and reads such photos, as before this change; checking a link's target would refuse them. Keep that, or check the targets in a follow-up, with the tree leaving such links out? | Kept, and recommended for this change: the behavior with links is unchanged, and using such a link needs a compromised page and a link that the user put in the folder. Kept as recommended when the owner handed over the rest of the work (2026-11-10). |
| 7 | Measure stage C2's other transport, the photo's bytes over IPC, on Windows too? On the owner's Windows PC, C2, which gives the viewer its photo by the URL, shows the JPEG 56 to 69 ms later than C1, within budget (RESULTS.md, "Stages C1 and C2 on Windows"), where on the Mac it was 6 to 12 ms later; the transport rule ("Stage C2 notes") was applied on the Mac only, where IPC showed the photo 16 to 20 ms sooner, within budget everywhere. | The owner (2026-11-10): the performance is sound, and stage C2 stays as it is, with the URL; IPC is not measured on Windows. Done. |
