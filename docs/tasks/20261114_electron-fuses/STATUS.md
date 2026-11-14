# Set Electron's fuses: status

Started on 2026-11-14. See the [plan](./PLAN.md), which has the goal, the
owner's decisions, what was found, the change and the stages.

## Current state

The change is made, and a package of it on macOS has the fuses of
`electron-builder.json` and passes the e2e suite.

| Stage | State |
| --- | --- |
| 1. The change, and the package on macOS | Done |
| 2. CI on three operating systems, and on Intel | Not started |
| 3. The pull request | Not started |
| 4. After the merge | Not started |

## Next

Stage 2.

## Waiting on the owner

Nothing: the owner asked for the change to be made and merged, if it is worth
making, without waiting for them.

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
