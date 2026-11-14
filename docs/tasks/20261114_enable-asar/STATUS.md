# Package the application in an asar archive: status

Started on 2026-11-14. See the [plan](./PLAN.md), which has the goal, why asar
was turned off, the owner's decisions, what was found, the change and the
stages.

## Current state

The owner said on 2026-11-14 to carry the plan out and to see the pull
request merged, which settles the two questions under the plan's "The
owner's decisions". The change is made, and a package of it on macOS passes
the e2e suite.

| Stage | State |
| --- | --- |
| 1. The change, and the package on macOS | Done |
| 2. CI on three operating systems, and on Intel | Not started |
| 3. The pull request | Not started |
| 4. After the merge | Not started |

## Next

Stage 2.

## Waiting on the owner

Nothing.

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
