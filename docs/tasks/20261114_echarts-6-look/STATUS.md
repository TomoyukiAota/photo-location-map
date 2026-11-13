# Draw the chart with ECharts 6's own look: status

Started on 2026-11-14. See the [plan](./PLAN.md), which has the goal, the
owner's decisions, what was found, the change and the stages.

## Current state

The investigation is done, and the owner has decided what the chart keeps and
what it takes from ECharts 6. Nothing in the application is changed yet.

| Stage | State |
| --- | --- |
| 0. The baseline, before any change | Done: everything passes |
| 1. The change in the code | Not started |
| 2. The references of the owner's Mac | Not started |
| 3. The references of CI | Not started |
| 4. The pull request | Not started |
| 5. After the merge | Not started |

## Next

Stage 1: the change in the code.

## Log

Add what each stage found, with its date: the numbers of the checks, what
failed and why, and anything that the plan did not foresee.

- 2026-11-14: The plan is written. The branch
  `claude/echarts-v6-migration-6e240f` is at `main`'s `e42320d0`, with this
  folder as its only change.
- 2026-11-14, stage 0: on the owner's Mac (macOS 27.0.1), with the branch as
  it is, after a clean `npm ci`: `npm run lint:ng` passes; `npm run
  test:unit:ng` passes its 437 tests in 58 files; `npm run build:prod` prints
  no warning; `PLM_VISUAL=1 npm run test:e2e` passes 49 cases in 5.0 minutes
  and skips 1, the case of the OS tab, which runs on Windows only. Every
  screenshot matches its reference in `test/e2e/snapshots/`, so what stage 2
  writes anew is the chart's.
