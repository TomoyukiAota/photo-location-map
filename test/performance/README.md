# Performance comparisons

This harness measures the application at each stage of the removal of `@electron/remote`
([plan](../../docs/tasks/20261106_remove-electron-remote/PLAN.md),
[protocol](../../docs/tasks/20261106_remove-electron-remote/PERFORMANCE.md)). It launches builds of the
application with Playwright, on fresh test profiles, and reads the times that the application records as User
Timing marks (`src-shared/perf/perf-mark.ts`). It reads the page only through the DOM and those marks, so a
measurement means the same whether or not the renderer has Node.js.

Performance is measured on macOS and Windows only: Photo Location Map does not support Linux officially. The memory
of the whole process tree is sampled with `ps`, which only macOS and Linux have; on Windows, only the memory that
Electron reports for its own processes is recorded.

## What is controlled

- **Profile**: every launch gets a new `PLM_TEST_ROOT` profile (`electron-util/isolated-test-profile.js`), except
  the second launch of a startup trial, which measures a launch on a used profile.
- **Windows**: `PLM_TEST_HEADLESS=1` keeps them off the screen. On macOS they are hidden and paint as shown ones
  do; on Windows they are shown fully transparent (`electron-util/e2e-test-hooks.js`). Neither is what users see.
- **Network**: `PLM_TEST_OFFLINE=1` cancels every request that leaves the computer. The map's base-layer list then
  comes from its built-in copy, and tiles stay blank. Without it, each startup would wait for a download.
- **Photo Data Viewer**: `PLM_TEST_PHOTO_DATA_VIEWER_SERVER` serves it from a local build at a known commit
  instead of its production server, which is deployed apart from this app. `run.mjs` records a hash of what the
  server serves at the start and end of a series.
- **Workloads**: `workload.mjs` makes the opened folders from the public fixtures only, with a SHA-256 manifest.
  The files are copies, made just before a series, so the operating system has them in its cache: reads of photos
  are warm, and not controlled further.
- **Order**: with several builds, each round runs them in the opposite order of the previous round.

## Running a series

```sh
# 1. The viewer: a build of Photo Data Viewer for this app, served on a loopback port (its repository's README).
PDV_IN_PLM=True npx next build --webpack && PDV_IN_PLM=True npx next start -p 3130 -H 127.0.0.1

# 2. The workloads, once per series.
mise exec -- node test/performance/workload.mjs "$PWD/.upgrade-artifacts/remove-electron-remote/workloads"

# 3. The builds: each a packaged app kept outside release/, which the next build overwrites.

# 4. The series, then its summary.
mise exec -- node test/performance/run.mjs --protocol rer-2 \
  --out "$PWD/.upgrade-artifacts/remove-electron-remote/series/<series>" \
  --workloads "$PWD/.upgrade-artifacts/remove-electron-remote/workloads" \
  --viewer-server http://127.0.0.1:3130 \
  --app 0=<executable of build 0> --app A=<executable of build A> --trials 10 --warmup 1
mise exec -- node test/performance/summarize.mjs .upgrade-artifacts/remove-electron-remote/series/<series> \
  --baseline 0 --protocol test/performance/protocol-rer-2.json
```

On Windows, in PowerShell, the steps are the same, with `$env:PDV_IN_PLM = 'True'` before the viewer's two
commands. Make each build a directory with `npm run build:prod`, then
`npx electron-builder build --win dir --x64 --publish never`, and copy `release\win-unpacked\` out before the next
build; `--app` takes the copy's `Photo Location Map.exe`, in quotes.

`--app <label>=checkout` measures the checkout's build (`dist/` and `src-main/`) instead of a packaged app. `--app-env <label>:<NAME>=<value>` sets an environment variable for one build's launches, such as `PLM_TEST_PHOTO_TRANSPORT=ipc` for the transport experiment of stage C2; `series.json` records it with the build. Do not
run a series while builds, tests or other measurements run on the computer.

## Scenarios

| Scenario | What it does | Main metrics |
| --- | --- | --- |
| `startup` | Launches on a new profile, which shows the welcome dialog, then again on the same profile. | `cold.` / `warm.` `home-rendered-ms` (spawn to the home view's first render), `renderer-modules-ms` (navigation to the app's bootstrap, in `src/start-app.ts` since stage C1), `did-finish-load-ms`, settled memory. |
| `open-folder` | Opens the large workload (`click` on Open Folder with the picker stubbed in the main process), with its HEIC thumbnails made, then opens it again with them cached. | `start-to-complete-ms`, its parts (`directory-tree-ms`, `photo-data-ms`, `finish-ms`), `start-to-markers-ms`, `start-to-thumbnails-done-ms`, the sums of the EXIF steps, long tasks and frame gaps in the renderer, the main process's event-loop delay, peak and settled memory. |
| `view-data` | Opens Photo Data Viewer for a JPEG from its marker's popup twice (the first with the viewer not yet in the profile's HTTP cache), then for a HEIC, then the HEIC three more times. | `request-to-page-loaded-ms`, `request-to-image-ms` (the photo decoded), `request-to-metadata-ms`, peak and settled memory, memory left after the cycles. |
| `settings` | Saves Show Status Bar, which applies at once, then a new date format, which restarts the app. | `save.click-to-persisted-ms`, `restart.click-to-home-rendered-ms` (Save to the relaunched app's home view), `restart.click-to-exit-ms`. |

Times are from the epoch clock, which the harness and the application's processes share. Each metric ending in
`-ms` is in milliseconds, `-kb` in kilobytes; the others are counts. The EXIF sums add up times of up to ten files
read at once, so they show where the time goes, not how long the folder took. Resident memory counts pages that
processes share once per process, so a sum overstates the memory in use; each process's value is kept in the
trial's details.

## Results

`run.mjs` writes `series.json` (the host, the builds with a hash of their code, the workloads, the viewer) and one
JSON file per trial under `trials/<label>/<scenario>/`, failed and interrupted ones too, with their error.
`summarize.mjs` writes `summary.json` and `summary.md`: for each metric and build, the number of trials, median,
90th percentile (with ten trials or more), minimum, maximum and median absolute deviation, and for each build its
difference from the baseline build.

With a protocol file, each difference also gets a verdict. A rule's noise band is `noiseMads` times the baseline's
scaled median absolute deviation, or `floor`, whichever is larger; its budget is `budgetPercent` of the baseline's
median, or the noise band, whichever is larger. A difference above the budget is a regression, below its negative an
improvement. `invariant` rules require the same values, such as the number of files read.
