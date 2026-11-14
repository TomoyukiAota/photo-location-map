# Set Electron's fuses: status

Started on 2026-11-14. See the [plan](./PLAN.md), which has the goal, the
owner's decisions, what was found, the change and the stages.

## Current state

Done on 2026-11-14. A package has the fuses of `electron-builder.json`, and
passes CI on the three operating systems and on Intel. The pull request from
the branch `claude/electron-fuses` has the label `automerge`, with which
Mergify merges it once its checks pass.

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

Nothing: the owner asked for the change to be made and merged, if it is worth
making, without waiting for them. What is left for the owner, below, does not
hold up the merge.

## Left for the owner

Whether to close what is still open, each a change of its own, which
`docs/contributing/electron-fuses.md` describes under "What is still open":
`runAsNode` and `enableNodeCliInspectArguments`, which still let other
software run code as the application, and `grantFileProtocolExtraPrivileges`.

## Log

Add what each stage found, with its date: the numbers of the checks, what
failed and why, and anything that the plan did not foresee.

- 2026-11-14: The investigation, whose results are the plan's "What was
  found", and the plan. The branch `claude/electron-fuses` is at `main`'s
  `52c28530`, the merge of the previous task, with this folder as its only
  change.
- 2026-11-14, stage 1: the change of the plan. `npm run test:package-runner`
  passes its 28 tests, the 9 new ones of the fuses among them; `npm run
  lint:script`, `npm run lint:main` and `npm run build:prod` pass. Read with
  the new check, the package of the previous task, which has Electron's
  defaults, differs from `electron-builder.json` in the three fuses that the
  change sets, in both halves of its binary. The new package (`electron-builder
  build --mac dir --universal`, signed and not notarized, in 239 s):
  electron-builder printed "executing @electron/fuses"; `codesign --verify
  --deep --strict` passes; `npx @electron/fuses read` lists the fuses as
  `electronFuses` sets them, and `wasmTrapHandlers` on; the new check passes
  for both halves. The e2e suite against it, with `PLM_VISUAL=1`: 48 cases
  passed and 2 were skipped, in 4.9 minutes. Started as Node.js with
  `NODE_OPTIONS="--require <a script that writes a file>"`, the package of the
  previous task wrote the file, and the new one did not. Started as
  themselves, neither did: Electron ignores `NODE_OPTIONS` in the main process
  of a package, which the plan did not say at first; its finding 5 and
  `docs/contributing/electron-fuses.md` now do.
- 2026-11-14, stage 2: the push of `88e147bd` ran the three workflows, and
  "CI on macOS", run by hand, added `macos-26-intel`. `main` was still at
  `52c28530`. Every job passed. In each, electron-builder printed "executing
  @electron/fuses", and the package test's new check read the fuses of the
  package that it built as `electron-builder.json` sets them: in both halves
  of the Electron Framework on macOS, in `win-unpacked\Photo Location Map.exe`
  on Windows, and in `linux-unpacked/photo-location-map` on Linux. The e2e
  suite against each package passed, with the archive checked on macOS and
  Windows.

  | Job | Run | Time | The e2e suite |
  | --- | --- | --- | --- |
  | `test (macos-arm64)` | 43569163750 | 16 min | 48 passed and 2 skipped against the dmg's application, with the screenshots of `snapshots-ci/macos-26-arm64` |
  | `test (windows-latest)` | 43569163883 | 15 min | 49 passed and 1 skipped (the website's) against the application that the NSIS installer installed |
  | `test (ubuntu)` | 43569163775 | 17 min | 47 passed and 3 skipped against the AppImage; then 48 passed and 2 skipped against a development build of the checkout |
  | `test (macos-x64)` | 43569163812 | 21 min | 48 passed and 2 skipped |
  | `test (macos-arm64)`, of the same run | 43569163812 | 13 min | 48 passed and 2 skipped |

- 2026-11-14, stage 3: this file is written as it should read on `main`. The
  pull request is opened without the label `automerge`, which is added once
  the test jobs that it starts are running (the plan's stage 3).
