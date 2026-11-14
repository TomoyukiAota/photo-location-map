# Package the application in an asar archive: status

Started on 2026-11-14. See the [plan](./PLAN.md), which has the goal, why asar
was turned off, the owner's decisions, what was found, the change and the
stages.

## Current state

Done on 2026-11-14. A package has the application's code in `app.asar`, and
passes CI on the three operating systems and on Intel. The pull request from
the branch `claude/electron-asar-config-b93337` has the label `automerge`,
with which Mergify merges it once its checks pass.

| Stage | State |
| --- | --- |
| 1. The change, and the package on macOS | Done |
| 2. CI on three operating systems, and on Intel | Done: every job passed |
| 3. The pull request | Opened, with the label `automerge` |
| 4. After the merge | Nothing in the repository is left to change |

## Next

Nothing, once the pull request is merged. Until then, a failed check or a
review comment is handled as the plan's stage 3 says.

## Waiting on the owner

Nothing. What is left for the owner, below, does not hold up the merge.

## Left for the owner

1. **An update of an installed release on Windows**, which no test covers. On
   a PC with the latest release installed, run the installer of this change:
   the one of the draft release that the Windows job publishes, or the one of
   the next release. The application starts, and
   `%LOCALAPPDATA%\Programs\Photo Location Map\resources` has `app.asar` and
   no `app` folder. The plan's finding 9 says why a folder left there would do
   no harm.
2. **Performance on Windows**, if the figures of the plan's finding 7 are
   wanted there: two directory builds, one of the commit before this change,
   and the harness (`test/performance/README.md`).

## Log

Add what each stage found, with its date: the numbers of the checks, what
failed and why, and anything that the plan did not foresee.

- 2026-11-14: The investigation, whose results are the plan's "What was
  found", and the plan. The branch `claude/electron-asar-config-b93337` is at
  `main`'s `73e76718`, with this folder as its only change.
- 2026-11-14: The owner said to carry the plan out and to see the pull request
  merged without waiting for them.
- 2026-11-14, stage 1: the change of the plan. `npm run lint:main` and
  `npm run build:prod` pass. The package (`electron-builder build --mac dir
  --universal`, signed and not notarized, in 246 s) has `app.asar` in
  `Resources`, and neither `app` nor `app.asar.unpacked`; electron-builder no
  longer prints "asar usage is disabled". `codesign --verify --deep --strict`
  passes, and the executable has x86_64 and arm64. The e2e suite against it,
  with `PLM_VISUAL=1`: 48 cases passed and 2 were skipped, as in finding 5, in
  5.0 minutes. The harness (`run.mjs --scenarios startup --trials 1`) ran one
  startup of the package and one of the checkout. It read the hash of the
  package's code, `b16469b4…` over 204 files, from the header of `app.asar`,
  and gave the same hash for the files of that archive extracted into the
  layout of a package without one. The checkout's hash, `48a51b2a…`, differs
  from it, as the package's `package.json` has no `scripts` and no
  `devDependencies`.
- 2026-11-14, stage 2: the push of `a5889a3c` ran the three workflows, and
  "CI on macOS", run by hand, added `macos-26-intel`. `main` was still at
  `73e76718`. Every job passed, and none printed "asar usage is disabled".
  The package test of each built the package, installed it where it is
  installed, and found the logs of both processes in the smoke test; each run
  of the e2e suite against a package passed its check that the application
  runs from `resources/app.asar`.

  | Job | Run | Time | The e2e suite |
  | --- | --- | --- | --- |
  | `test (macos-arm64)` | 43564737405 | 15 min | 48 passed and 2 skipped against the dmg's application, with the screenshots of `snapshots-ci/macos-26-arm64` |
  | `test (windows-latest)` | 43564737439 | 15 min | 49 passed and 1 skipped (the website's) against the application that the NSIS installer installed |
  | `test (ubuntu)` | 43564737419 | 17 min | 47 passed and 3 skipped against the AppImage; then 48 passed and 2 skipped against a development build of the checkout |
  | `test (macos-x64)` | 43564737052 | 15 min | 48 passed and 2 skipped |
  | `test (macos-arm64)`, of the same run | 43564737052 | 12 min | 48 passed and 2 skipped |

- 2026-11-14, stage 3: this file is written as it should read on `main`. The
  pull request is opened without the label `automerge`, which is added once
  the test jobs that it starts are running (the plan's stage 3).
