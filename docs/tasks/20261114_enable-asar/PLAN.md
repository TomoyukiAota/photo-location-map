# Package the application in an asar archive: plan

Where the work stands, and what to do next, is in [STATUS.md](./STATUS.md).
This plan is written so that the work can stop at any time and go on later, in
another session or on another machine: every stage ends in a commit, STATUS.md
says which stage is next, and [To go on after a stop](#to-go-on-after-a-stop)
says how to find out what is done.

## Goal

`electron-builder.json` says `"asar": false`, so a package holds the
application's code as a folder of 4,646 files. Electron's documentation has an
application's code in one archive, `app.asar`, and electron-builder, whose
default that is, prints at every build "asar usage is disabled — this is
strongly not recommended". Package the code in `app.asar`.

## Why asar was turned off

Commit `e60caf58` of 2020-10-22 turned it off, "to avoid specifying files for
worker thread (used by threads.js) for better maintainability". A worker
thread of Electron could not read an archive then, so the worker's script and
every module that it loads would have had to be listed in `asarUnpack`, to
stay outside the archive.

Neither reason holds today:

- Electron reads archives in worker threads since
  [electron/electron#33216](https://github.com/electron/electron/pull/33216),
  of March 2022, which is in Electron 17 and 18.
- threads.js is gone. Since `15e16050` (2022-12-05), worker processes of
  workerpool make the HEIF thumbnails. A worker thread came back with
  `ac6a51ad` (2026-11-09): it reads the trees of folders.

## The owner's decisions

On 2026-11-14 the owner asked for asar to be turned on, for an investigation
of what that takes before any change is made, and then for this plan and for
the measurements of [finding 7](#what-was-found). After reading the plan, the
owner said on the same day to carry it out and to see the pull request merged,
without waiting for them. That settles two questions of the investigation as
the plan proposed:

| Question | Decided | Not taken |
| --- | --- | --- |
| In recorded errors, the names of the application's files get the prefix `app.asar/` (finding 8). | They keep it, and nothing changes in the code. | `scrubFile` removes the prefix, so that the names stay as they are today, and its tests change with it. |
| Electron has fuses that an archive makes possible: to load the application from `app.asar` only, and to check the archive's integrity. | They are not part of this change. | Turning them on here. A later task that does must keep the fuse `runAsNode` on: workerpool starts the thumbnail workers with `child_process.fork`, which needs it. |

## What was found

Measured on 2026-11-14 on an Apple Silicon Mac with macOS 27.0.1, at `main`'s
`73e76718`, with Electron 45.2.1 and electron-builder 26.18.1. The scripts and
the packages were temporary and are not in the repository.

1. **The main process names files of the application in four places.**

   | What | Where | How |
   | --- | --- | --- |
   | The worker thread that reads the trees of folders | `src-main/directory-tree/directory-tree-requests.ts` | `new Worker(path.join(__dirname, 'directory-tree-worker.js'))` |
   | The worker processes that make the HEIF thumbnails | `src-main/thumbnail-generation/thumbnail-generation.ts` | workerpool with `workerType: 'process'`, which calls `child_process.fork` with `generate-thumbnail-file-worker.js` |
   | The main window's page | `src-main/file-server/file-server.ts` | The `file:` URL of `dist/index.html` |
   | The preloads of the two windows | `electron-util/electron-web-preferences.js` | `app.getAppPath()` and the preload's path |

   `src-main/analytics/error-scrubbing-setup.ts` also takes
   `app.getAppPath()`, to tell the application's files in a stack (finding 8).
   `configureLiveReload(__filename)` runs in development only.
2. **Electron 45 loads each of them from an archive.** A small application was
   packed with `@electron/asar` and run by the Electron of `node_modules`. A
   worker thread and a forked process each required a module beside it and one
   of `node_modules`, and read a file, all inside the archive. A sandboxed
   window with context isolation took its preload from the archive, and its
   page from there with a `file:` URL: a module script, a chunk that it
   imports, and an image. The handler that `src-main/electron-main.ts`
   registers for the `file` scheme is not called for a page that is itself a
   file, in an archive or not.
3. **Nothing needs `asarUnpack`.** The production dependencies have no native
   module and no executable. `libheif-js` has a file `libheif.wasm`, but
   `heic-decode` loads `libheif-js/wasm-bundle`, which holds it in its
   JavaScript. electron-builder leaves the modules with executables out of the
   archive by itself, and it left none out.
4. **The package is as expected.** It was built with the configuration as it
   is and `-c.asar=true` on electron-builder's command line
   (`build --mac dir --universal`), signed and not notarized.
   - `Contents/Resources/app.asar`, of 69.7 MB, holds the same 4,646 files.
     There is no `app.asar.unpacked`.
   - `@electron/universal` merged the archives of x64 and arm64 into that one.
     There is no `app-x64.asar` or `app-arm64.asar`.
   - electron-builder wrote `ElectronAsarIntegrity` into `Info.plist`.
     Electron checks it only with a fuse that is off.
   - `codesign --verify --deep --strict` passes. The bundle has 269 files
     instead of 4,914.
5. **The e2e suite passes against the package as it does today.** Against the
   package without asar: 48 cases passed and 2 were skipped. Against the one
   with asar: the same. The skipped ones are the case of the OS tab, which
   runs on Windows only, and the website's, which is not for a package. Among
   the 48 are the cases that load a folder (the worker thread), make a
   thumbnail with a worker process started from the package ("HEIC worker
   generates…"), follow the application's own generation of thumbnails, and
   restart the application. The run against the archive used a copy of the
   suite outside the repository, in which the expectation of finding 6 named
   `app.asar`; nothing else differed.
6. **Two places assume the folder.**
   - `test/e2e/regression.spec.mjs`, in `launch()`:
     `expect(await realpath(runtime.appRoot)).toBe(await realpath(path.join(runtime.resources, 'app')))`.
     Every case of a run against a package goes through it, so all of them
     fail until it names `app.asar`. CI runs the suite against the package on
     all three operating systems.
   - `test/performance/run.mjs`, in `codeHash`, with `packagedAppRoot` of
     `test/performance/lib/app.mjs`: it hashes the files of the package's
     `app` folder, which it reads with Node.js. Node.js outside Electron does
     not read an archive as a folder, so the harness stops with "No code of
     the app at …". The archive's header has the SHA-256 of each file. The
     hash made from them is the same as the one made from the files of the
     same package in a folder: both were `8b8194b2…` for the package of
     finding 4, over 204 files. Nothing in CI runs the harness.
7. **Nothing is slower.** Both packages were universal and signed, built from
   the same `dist/` and `src-main/`, and measured in alternating order with
   the scenarios of the performance harness
   (`test/performance/lib/scenarios.mjs`): windows hidden, offline, a new
   profile for each trial. Medians, with the lowest and the highest value.

   | What | Without asar | With asar |
   | --- | --- | --- |
   | Startup, the first launch on a new profile, to the home view (10 trials) | 428 ms (423 to 448) | 428 ms (418 to 431) |
   | Startup, the second launch on that profile | 388 ms (385 to 397) | 376 ms (373 to 385) |
   | A thumbnail worker process, from its start to its first answer (120 processes, one after the other) | 100.5 ms | 97.1 ms |
   | One HEIF thumbnail, from the start of its worker process to the file (30) | 527.5 ms | 528.1 ms |
   | The thumbnails of a folder of 90 HEIC photos, `thumbnails-main-ms` (5 trials) | 12,124 ms (11,812 to 12,498) | 12,271 ms (11,835 to 12,422) |
   | The thumbnails of the large workload's 12 HEIC photos (5 trials) | 1,922 ms (1,857 to 2,018) | 1,868 ms (1,835 to 1,926) |
   | The large workload, 300 JPEG, 12 HEIC and 2 broken files, `start-to-complete-ms` (5 trials) | 645.6 ms (643.0 to 647.4) | 646.9 ms (645.7 to 648.9) |
   | Of that, the folder's tree, which the worker thread makes | 8.9 ms | 9.0 ms |
   | Of that, the EXIF data and the embedded thumbnails of the 314 files, `photo-data-ms` | 523.9 ms (522.1 to 525.4) | 523.9 ms (523.7 to 524.1) |

   The thumbnail workers are where an archive could have cost time: the
   application starts a new process for each thumbnail, and each one loads
   the worker's script and its modules again (heic-decode with libheif-js,
   jimp, moment-timezone, fs-extra, workerpool). From the archive, a process
   is ready 3 ms sooner. A thumbnail takes the same time, as most of it is
   the decoding of the photo. The thumbnails of whole folders differ by 1%
   and by 3%, in opposite directions, which is within what differs from run
   to run. EXIF is read from the user's photos, which are not in the archive.

   Not measured on Windows, where opening many small files costs more than on
   macOS. The harness can measure it there after stage 1.
8. **The application's files get a prefix in recorded errors.** `scrubFile`
   of `src-shared/analytics/error-for-analytics.ts` gives a file of an
   archive from `app.asar/` on: `app.asar/src-main/…` and
   `app.asar/dist/main.js`, where it gives `src-main/…` and `dist/main.js`
   for the folder today. Its tests expect that already.
9. **A folder that an update leaves behind does no harm.** Electron looks for
   `app.asar` before `app`: its documentation of the fuses says so, and
   Electron 45.2.1 loaded the archive when both were in `Resources`. The NSIS
   installer first runs the uninstaller of the installed version, which
   removes the installation's folder. If that fails and `resources\app`
   stays, the new `app.asar` is still what runs. On macOS an update replaces
   the bundle, and an AppImage is one file.
10. **Not checked:** Windows and Linux; the x64 half of the universal
    application, as the Mac has no Rosetta; and an update of an installed
    release. Stages 2 and 4 check them.

## The change

One pull request from the branch `claude/electron-asar-config-b93337`.

### `electron-builder.json`

Remove the line `"asar": false,`. electron-builder's default is an archive,
with the modules that hold executables left out of it.

### `test/e2e/regression.spec.mjs`

In `launch()`, `path.join(runtime.resources, 'app')` becomes
`path.join(runtime.resources, 'app.asar')`. This expectation is then what
fails, on every operating system, if a package is built without an archive
again.

### `test/performance/lib/app.mjs`, `test/performance/run.mjs`

- `lib/app.mjs`: beside `packagedAppRoot`, a function that gives the archive
  of a packaged application: `Contents/Resources/app.asar` on macOS, and
  `resources/app.asar` beside the executable on Windows and Linux. The
  comment of `packagedAppRoot` says that it is the folder of a package built
  before this change.
- `run.mjs`, `codeHash`: for a package with an archive, take the names and
  the SHA-256 of the same files from the archive's header, and hash them as
  today, so that a package has the same hash as it would have with a folder
  (finding 6). The archive starts with 16 bytes of sizes, of which the last
  four are the length of the JSON header that follows them; in the header,
  each file has `integrity.hash`, its SHA-256 in hexadecimal. A package
  without an archive is read as today, so that a build from before this
  change can still be compared with a later one. The error for a package
  with neither names both places.
- Rejected: the SHA-256 of `app.asar` as a whole, which is less code. It
  would cover `node_modules` too, and a package's hash would no longer be the
  one that earlier series have for the same code.

### `src-main/directory-tree/directory-tree-requests.ts`, `src-main/thumbnail-generation/thumbnail-generation.ts`

A comment at each worker's path: the script is loaded from inside `app.asar`,
by a worker thread and by a forked process, and nothing is listed in
`asarUnpack`. Without it, the next reader may add the list that asar was
turned off to avoid. The comment of the thumbnails' worker also says that
`child_process.fork` needs Electron's fuse `runAsNode`, which is on by
default.

### What does not change

- No `asarUnpack` and no `electronFuses` in `electron-builder.json`.
- The paths of finding 1, and `scrubFile` (finding 8).
- `script/package-test/`: it looks at the icon, `Info.plist`, the binaries
  and the update feed, not at the application's folder.
- The documents: none describes the layout of a package. The folders of
  earlier tasks in `docs/tasks/` are records, and stay as they are.

## Stages

Run the commands from the repository's root. In a git worktree, put
`MISE_TRUSTED_CONFIG_PATHS="$PWD/mise.toml"` before each `mise exec`
(`AGENTS.md`, "In a git worktree"). `npm run test:e2e` keeps the
application's windows off the screen on macOS and Windows: do not add
`--headed`.

After each stage, update STATUS.md and commit. Push a commit that changes
only this folder at any time, as CI skips its tests for documents. Push the
others only where a stage says so: such a push runs CI's tests on three
operating systems.

### 1. The change, and the package on macOS

The edits of [The change](#the-change). Then:

```sh
mise exec -- npm ci                 # when node_modules is missing or older than package-lock.json
mise exec -- npm run lint:main
mise exec -- npm run build:prod
PLM_PACKAGE_TEST=true mise exec -- npx electron-builder build --mac dir --universal --publish never
ls "release/mac-universal/Photo Location Map.app/Contents/Resources"
PLM_PACKAGED_EXECUTABLE="$PWD/release/mac-universal/Photo Location Map.app/Contents/MacOS/Photo Location Map" \
  mise exec -- npm run test:e2e
```

- electron-builder no longer prints "asar usage is disabled".
  `PLM_PACKAGE_TEST=true` skips the notarization, which this check does not
  need (`script/notarize/notarize.js`).
- `Resources` has `app.asar`, and neither `app` nor `app.asar.unpacked`.
- The suite passes 48 cases and skips 2, as in finding 5. On the Mac that
  `test/e2e/snapshots/` matches, add `PLM_VISUAL=1` for the screenshots.
- `npm run test:package` is left to CI: in a git worktree it stops before its
  smoke test (`AGENTS.md`).

Then the harness, with the package and with the checkout, one startup each:

```sh
mise exec -- node test/performance/workload.mjs "$PWD/.upgrade-artifacts/enable-asar/workloads"
mise exec -- node test/performance/run.mjs --scenarios startup --trials 1 --warmup 0 \
  --out "$PWD/.upgrade-artifacts/enable-asar/series" \
  --workloads "$PWD/.upgrade-artifacts/enable-asar/workloads" \
  --app package="$PWD/release/mac-universal/Photo Location Map.app/Contents/MacOS/Photo Location Map" \
  --app checkout=checkout
```

`series.json` has a hash for each of the two. They differ, as they do today:
electron-builder writes a package's `package.json` without `scripts` and
`devDependencies`.

Commit the change.

### 2. CI on three operating systems, and on Intel

```sh
git push -u origin claude/electron-asar-config-b93337
gh workflow run ci-on-mac.yml --ref claude/electron-asar-config-b93337
```

The push starts the three workflows. The manual run adds `macos-26-intel`,
which this change needs: the universal application's archive is merged from
the archives of x64 and arm64 (`AGENTS.md`, "The Intel macOS CI runs only on
demand"). It takes 15 to 28 minutes.

What the jobs show that stage 1 cannot:

| Job | What |
| --- | --- |
| `test (windows-latest)` | The installer is built and installed, and the e2e suite runs against the installed application: the worker thread and the worker processes start from `resources\app.asar`. |
| `test (ubuntu)` | The same against the AppImage. |
| `test (macos-arm64)` | The package test, which a clone runs to its end, and the e2e suite with its screenshots. |
| `test (macos-x64)` | The x64 half of the universal application. |

Read a failed job's log and classify it before a rerun (`AGENTS.md`,
"Classify a CI failure before rerunning it"). The draft release that the
Windows job publishes is expected.

### 3. The pull request

Once the runs of stage 2 have passed, write STATUS.md as it should read on
`main`: the stages with what they found, and what stage 4 leaves for the
owner. Commit it and push: CI skips its tests for a push that changes only
this folder.

Before opening the pull request, make sure that nothing private is in what
GitHub will show (`AGENTS.md`, "This repository is public"): the commit
messages, the title, the description and the diff.

```sh
gh pr create --base main --head claude/electron-asar-config-b93337 \
  --title "Package the application in an asar archive" --body-file <the description>
```

The description has the sections of the other pull requests: Problem, Change,
Tests, and Open, which names what stage 4 leaves for the owner.

The owner asked for the pull request to be merged without waiting for them.
Mergify merges a pull request of the owner with the label `automerge` once
`test (ubuntu)`, `test (windows-latest)` and `test (macos-arm64)` pass
(`.mergify.yml`). It waits neither for the Intel job, which has passed in
stage 2 by then, nor for CodeRabbit's review. Add the label once the test
jobs that the pull request starts are running, not when it is opened: with
the checks of the last push skipped, Mergify could otherwise merge at once,
before CodeRabbit has had the time that those jobs take to review. Until the
pull request is merged, read the review comments, change what they are right
about and answer the others. Take the label off while a change for a comment
is being made, so that Mergify does not merge without it.

### 4. After the merge

Check that the pull request is merged
(`gh pr view <number> --json state,mergedAt`). STATUS.md is written in
stage 3 as it should read on `main`, so nothing in the repository is left to
change. It lists what is left for the owner:

- **An update of an installed release on Windows**, which no test covers. On
  a PC with the latest release installed, run the installer of this change:
  the one of the draft release that the Windows job publishes, or the one of
  the next release. The application starts, and
  `%LOCALAPPDATA%\Programs\Photo Location Map\resources` has `app.asar` and
  no `app` folder. Finding 9 says why a folder left there would do no harm.
- **Performance on Windows**, if the owner wants the figures of finding 7
  there: two directory builds, one of the commit before this change, and the
  harness (`test/performance/README.md`).

## To go on after a stop

1. Read STATUS.md: the table of the stages, "Next" and "Waiting on the
   owner".
2. `git fetch`, then `git status` and `git log --oneline origin/main..` on
   the branch `claude/electron-asar-config-b93337`: what is committed, what is
   pushed, and what is only in the working tree. A change that is not
   committed belongs to the stage that STATUS.md names as next.
3. `gh pr list --head claude/electron-asar-config-b93337 --state all`: whether
   the pull request is open or merged.
4. Go on with the next stage. Stage 1's package and its e2e run need a Mac;
   stage 2 needs only a push.
