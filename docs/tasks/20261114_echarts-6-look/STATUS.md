# Draw the chart with ECharts 6's own look: status

Started on 2026-11-14. See the [plan](./PLAN.md), which has the goal, the
owner's decisions, what was found, the change and the stages.

## Current state

Done on 2026-11-14. The chart is drawn with ECharts 6's own look, with the
four settings that the owner chose to keep, and the four references of the
owner's Mac that show the chart are written anew. The pull request from the
branch `claude/echarts-v6-migration-6e240f` has the label `automerge`, with
which Mergify merges it once its checks pass.

| Stage | State |
| --- | --- |
| 0. The baseline, before any change | Done: everything passes |
| 1. The change in the code | Done |
| 2. The references of the owner's Mac | Done: the four that show the chart |
| 3. The references of CI | Done: CI's set stays as it is |
| 4. The pull request | Opened with the label `automerge` |
| 5. After the merge | Nothing is left to change |

## Next

Nothing, once the pull request is merged. Until then, a failed check or a
review comment is handled as the plan's stage 4 says.

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
- 2026-11-14, stage 1: the change of the plan, and a unit test that it did not
  have: the screenshots would not notice the ticks or the toolbox's colors
  gone (the plan's finding 8). `npm run lint:ng` passes; `npm run
  test:unit:ng` passes 440 tests in 59 files, the 3 new ones among them; `npm
  run build:prod` prints no warning, and ECharts is in a lazy chunk, `index`,
  of 1.17 MB. The e2e suite runs in stage 2, which runs every case as well.
  The commit is pushed, and CI's run of stage 3 started at once, alongside
  stage 2.
- 2026-11-14, stage 2: `PLM_VISUAL=1 npm run test:e2e --
  --update-snapshots=changed` passed 49 cases and skipped 1, and wrote
  nothing: the comparisons of the four screenshots of the chart pass with the
  references of `main`, as the chart's new colors are within what a
  comparison allows (the plan's stage 2). The three cases that take them were
  run with `--update-snapshots=all`, which wrote anew those four and
  `welcome`, `toolbar` and `map-toolbar`. Outside the chart, all seven
  differed from `main` by what differs from run to run: in `loaded-home.png`,
  393,000 pixels of the map's tiles by 1 or 2 in a channel, the Open Folder
  button and the map's attribution by up to 33 in a few hundred pixels, and
  the sidebar by 1. The three others are restored, and each of the four is
  the reference of `main` with the rectangle of the chart's element from the
  new screenshot. Against `main`, they now differ only within the chart: in
  `loaded-home.png`, 27,352 pixels from (359, 563) to (989, 762), the axes,
  their labels and the slider; the toolbox, at (1007, 552), is not among them.
- 2026-11-14, stage 3: run 43483852691 of "CI on macOS" with
  `update_screenshots`, on the commit of stage 1, passed: its unit tests
  passed 440, and its e2e suite passed 48 cases and skipped 2 (the website
  case, which a packaged application does not have, and the case of the OS
  tab), with no comparison failing, so it wrote nothing anew. The 16 files of
  its artifact are byte for byte the ones of
  `test/e2e/snapshots-ci/macos-26-arm64/`, which therefore stays as it is.
  The push of stage 1 ran "CI on macOS" (43483852155) and "CI on Windows"
  (43483852152), which passed.
- 2026-11-14, stage 2, the end: with the four references written anew,
  `PLM_VISUAL=1 npm run test:e2e` on the production build passes 49 cases and
  skips 1; on a development build, `npm run test:e2e` passes 49 and skips 1,
  and no case reports a binding that changed without telling Angular. The
  four references are written as RGB without alpha, as Playwright writes
  them; they are larger than before by 7 to 34%, as the encoder is not
  Playwright's.
