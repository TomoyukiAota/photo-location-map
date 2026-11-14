# Set Electron's fuses: plan

Where the work stands, and what to do next, is in [STATUS.md](./STATUS.md).
This plan is written so that the work can stop at any time and go on later, in
another session or on another machine: every stage ends in a commit, STATUS.md
says which stage is next, and [To go on after a stop](#to-go-on-after-a-stop)
says how to find out what is done.

## Goal

Electron's fuses are switches in Electron's binary, set when an application is
packaged, which turn some of Electron's features on or off. Several are ways to
run code in the application's processes other than its own: the environment
variables `ELECTRON_RUN_AS_NODE` and `NODE_OPTIONS`, and the option `--inspect`.
Others make Electron check the application's code: that `app.asar` is the one
that was packaged. A package of Photo Location Map has Electron's defaults for
all of them. Change those that the application can do without, and record why
the others stay as they are.

## The owner's decisions

On 2026-11-14, once the application was packaged in `app.asar`
([the previous task](../20261114_enable-asar/PLAN.md)), the owner asked for the
fuses to be investigated, and for the change to be made and its pull request
merged without waiting for them, if it is worth making. The investigation
below found three changes worth making, at a cost of about 4 ms for each worker
process, and five fuses that stay as they are for reasons of this application.

## What was found

Measured on 2026-11-14 on an Apple Silicon Mac with macOS 27.0.1, with
Electron 45.2.1, electron-builder 26.18.1 and the `@electron/fuses` 1.8.0 that
it installs, on the universal package of the previous task. Copies of it had
fuses flipped with `@electron/fuses`, as electron-builder does before signing,
and were signed ad hoc. The scripts and the copies were temporary and are not
in the repository.

1. **Electron 45.2.1 has nine fuses, and the package has Electron's defaults
   for all of them.** `npx @electron/fuses read --app <the .app>` lists them;
   the ninth, `wasmTrapHandlers`, is not known to `@electron/fuses` 1.8.0, which
   shows it as "undefined".
2. **electron-builder sets the other eight**, from `electronFuses` in
   `electron-builder.json`, just before it signs: for the universal macOS
   application, after its x64 and arm64 halves are merged, in both halves of
   the binary. It cannot set `wasmTrapHandlers`.
3. **What a copy with a fuse changed did:**

   | Fuse | Default | With it changed |
   | --- | --- | --- |
   | `runAsNode` | on | Off: the application starts, but makes no HEIF thumbnail. workerpool starts each worker with `child_process.fork`, which Electron refuses: "child_process.fork() is not supported when the runAsNode fuse is disabled; use utilityProcess.fork() instead". The two e2e cases of the thumbnails failed. |
   | `enableCookieEncryption` | off | Not tried. Turning it on cannot be undone: a package that has it off again cannot read the cookies. The application keeps nothing in cookies that needs protecting: it gives the analytics libraries their user's ID again at each launch (mixpanel-browser keeps its state in a cookie). |
   | `enableNodeOptionsEnvironmentVariable` | on | Off, with the two fuses of the archive below: the e2e suite against the copy passed 48 cases and skipped 2, as against the package. Nothing of the application reads `NODE_OPTIONS` or `NODE_EXTRA_CA_CERTS`: its requests go through Electron's `net`, which is Chromium's, and the test runners remove `NODE_OPTIONS`. Electron already ignores `NODE_OPTIONS`, but for two of its options, in the main process of a package; the fuse makes the processes that it runs as Node.js ignore it too, and `NODE_EXTRA_CA_CERTS` (finding 5). |
   | `enableNodeCliInspectArguments` | on | Off: the application starts, but Playwright's launch of it timed out after 90 s. Playwright starts it with `--inspect` to control its main process, which the e2e suite against a package (on all three operating systems in CI) and the performance harness do. |
   | `enableEmbeddedAsarIntegrityValidation` | off | On: see `enableNodeOptionsEnvironmentVariable`. |
   | `onlyLoadAppFromAsar` | off | On: the same. |
   | `loadBrowserProcessSpecificV8Snapshot` | off | Not tried: the application has no V8 snapshot of its own. |
   | `grantFileProtocolExtraPrivileges` | on | Off, alone or with the three changes above: Playwright's launch timed out after 90 s. Started by itself, the application's main process loaded the page's `file:` URL without an error, and its window never wrote to the log. The page is a file of the package, `file://…/app.asar/dist/index.html`, whose scripts are modules. |
   | `wasmTrapHandlers` | on | Not tried: electron-builder cannot set it. The thumbnails' workers decode HEIC with libheif, which is WebAssembly, and the fuse makes WebAssembly faster. |

4. **The three changes cost about 4 ms for each worker process.** The copy
   with them and a copy with the defaults, both signed ad hoc, were measured in
   alternating order with the scenarios of the performance harness
   (`test/performance/lib/scenarios.mjs`). Medians, with the lowest and the
   highest value:

   | What | Defaults | The three changes |
   | --- | --- | --- |
   | Startup, the first launch on a new profile, to the home view (10 trials) | 408 ms (405 to 422) | 414 ms (406 to 425) |
   | Startup, the second launch on that profile | 367 ms (363 to 388) | 367 ms (364 to 371) |
   | A thumbnail worker process, from its start to its first answer (80) | 87.0 ms | 91.3 ms |
   | One HEIF thumbnail, from the start of its worker process to the file (20) | 505.9 ms | 510.3 ms |

   A worker process checks the archive as it loads its script and modules
   from it. A folder of 90 HEIC photos starts 90 of them, 9 at a time on this
   Mac: about 40 ms more, in about 12 s.
5. **What the three changes protect against, and what they do not.**
   - With the two fuses of the archive, a changed `app.asar` does not run, and
     Electron loads no `app` folder in its place: code added to the package
     after it was built does not run as Photo Location Map. Electron checks
     the archive's header against a hash that electron-builder writes into
     `Info.plist` on macOS and into the executable on Windows, and each part
     of a file against the header as it reads it. On Linux, Electron does not
     check.
   - With `NODE_OPTIONS` ignored, an environment variable no longer adds code
     (`--require`) to the processes that Electron runs as Node.js, as
     `child_process.fork` does for the thumbnails' workers, which inherit the
     application's environment. Electron already ignores `NODE_OPTIONS` in the
     main process of a package
     ([its documentation](https://www.electronjs.org/docs/latest/api/environment-variables)).
   - `ELECTRON_RUN_AS_NODE` and `--inspect` still run code as the application.
     On macOS, such code has the application's permissions, such as to the
     folders that the user let it read. Turning off one without the other
     closes little. `runAsNode` can be turned off once the thumbnails' workers
     are started with Electron's `utilityProcess` instead of
     `child_process.fork`; `enableNodeCliInspectArguments` once the tests
     control the application without the inspector, or test a package other
     than the one released. `grantFileProtocolExtraPrivileges` can be turned
     off once the main window's page is served from a protocol of the
     application's own (`protocol.handle`) rather than from `file:`. Each is a
     change of its own, which is not part of this one.

## The change

One pull request from the branch `claude/electron-fuses`.

### `electron-builder.json`

`electronFuses`, with each of the eight fuses that electron-builder can set, so
that each is decided and none is left to Electron's default, which a later
Electron can change:

```json
  "electronFuses": {
    "runAsNode": true,
    "enableCookieEncryption": false,
    "enableNodeOptionsEnvironmentVariable": false,
    "enableNodeCliInspectArguments": true,
    "enableEmbeddedAsarIntegrityValidation": true,
    "onlyLoadAppFromAsar": true,
    "loadBrowserProcessSpecificV8Snapshot": false,
    "grantFileProtocolExtraPrivileges": true
  },
```

JSON has no comments, so the reasons are in a page of their own (below).

### `docs/contributing/electron-fuses.md`

A new page: each fuse, how it is set here and why, what is still open, and
what to do when the package test fails on the fuses, as after an Electron
upgrade that adds one. It is linked from the package test's failures, and from
the comment of the thumbnails' worker
(`src-main/thumbnail-generation/thumbnail-generation.ts`), which says that
`child_process.fork` needs `runAsNode`. It is needed only in that situation,
so `docs/CONTRIBUTING.md` does not link to it (`AGENTS.md`, "Keep
CONTRIBUTING.md short").

### The package test

- `script/package-test/electron-fuses.js`, new: reads the fuses of a packaged
  Electron binary, the bytes that follow Electron's sentinel, in each half of a
  universal one, and checks them against `electronFuses`. It fails when one
  differs; when `electronFuses` leaves out a fuse that electron-builder can
  set; when Electron has more fuses than the check knows, as after an upgrade
  that adds one; and when `wasmTrapHandlers` is not on. No dependency is
  added: the format is the one in Electron's documentation of fuses.
- `test/package-test/electron-fuses.cjs`, new, in `npm run
  test:package-runner`: its unit tests, with made-up binaries.
- `script/package-test/package-test-info.js`: the binary with the fuses on each
  operating system: the Electron Framework of the macOS bundle, the
  executable of `win-unpacked` and of `linux-unpacked`.
- `script/package-test/package-creation-test.js`: checks the fuses of the
  package that it built, on each operating system.

### What does not change

- The application's code: no fuse that it needs changes.
- The e2e suite: it runs against the package as before, and the fuses that it
  needs stay on.

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
mise exec -- npm run test:package-runner
mise exec -- npm run lint:script
mise exec -- npm run lint:main
mise exec -- npm run build:prod
PLM_PACKAGE_TEST=true mise exec -- npx electron-builder build --mac dir --universal --publish never
mise exec -- npx @electron/fuses read --app "release/mac-universal/Photo Location Map.app"
PLM_PACKAGED_EXECUTABLE="$PWD/release/mac-universal/Photo Location Map.app/Contents/MacOS/Photo Location Map" \
  PLM_VISUAL=1 mise exec -- npm run test:e2e
```

- electron-builder prints "executing @electron/fuses", and the fuses read as
  `electronFuses` says. Check them with the new check too, as the package test
  does: `npm run test:package` stops in a git worktree before it gets there
  (`AGENTS.md`).
- The e2e suite passes 48 cases and skips 2, as before: the application
  starts with its archive checked, under its own signature.
- The package ignores `NODE_OPTIONS`: started as Node.js
  (`ELECTRON_RUN_AS_NODE=1`, as the thumbnails' workers are) with
  `NODE_OPTIONS="--require <a script that writes a file>"`, it does not write
  the file, where a package with the defaults does.

Commit the change.

### 2. CI on three operating systems, and on Intel

```sh
git push -u origin claude/electron-fuses
gh workflow run ci-on-mac.yml --ref claude/electron-fuses
```

The push starts the three workflows; the manual run adds `macos-26-intel`,
which this change needs, as it changes both halves of the universal
application (`AGENTS.md`, "The Intel macOS CI runs only on demand"). In each
job, the package test checks the fuses of the package that it built, and the
e2e suite runs against it: on Windows with the archive checked against the
executable, on macOS against `Info.plist`.

Read a failed job's log and classify it before a rerun (`AGENTS.md`,
"Classify a CI failure before rerunning it"). The draft release that the
Windows job publishes is expected.

### 3. The pull request

As in [the previous task](../20261114_enable-asar/PLAN.md#3-the-pull-request):
once the runs of stage 2 have passed, write STATUS.md as it should read on
`main`, commit it and push. Make sure that nothing private is in what GitHub
will show (`AGENTS.md`, "This repository is public"). Open the pull request:

```sh
gh pr create --base main --head claude/electron-fuses \
  --title "Set Electron's fuses" --body-file <the description>
```

with the sections Problem, Change, Tests and Open. Add the label `automerge`
once the test jobs that the pull request starts are running, so that Mergify
merges it once they pass, and CodeRabbit has that time to review. Until it is
merged, read the review comments, change what they are right about and answer
the others; take the label off while a change for a comment is being made.

### 4. After the merge

Check that the pull request is merged
(`gh pr view <number> --json state,mergedAt`). STATUS.md is written in
stage 3 as it should read on `main`, so nothing in the repository is left to
change.

## To go on after a stop

1. Read STATUS.md: the table of the stages, "Next" and "Waiting on the
   owner".
2. `git fetch`, then `git status` and `git log --oneline origin/main..` on
   the branch `claude/electron-fuses`: what is committed, what is pushed, and
   what is only in the working tree. A change that is not committed belongs
   to the stage that STATUS.md names as next.
3. `gh pr list --head claude/electron-fuses --state all`: whether the pull
   request is open or merged.
4. Go on with the next stage. Stage 1's package and its e2e run need a Mac;
   stage 2 needs only a push.
