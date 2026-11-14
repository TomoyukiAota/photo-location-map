# Draw the chart with ECharts 6's own look: plan

Where the work stands, and what to do next, is in [STATUS.md](./STATUS.md).
This plan is written so that the work can stop at any time and go on later, in
another session or on another machine: every stage ends in a commit, STATUS.md
says which stage is next, and [To go on after a stop](#to-go-on-after-a-stop)
says how to find out what is done.

## Goal

The chart of the dates that the photos were taken on is drawn by ECharts. The
application has had ECharts 6.1.0 since the
[dependency upgrades](../20261101_dependency-upgrades/PLAN.md), but made to
look like ECharts 5. End that: draw the chart with ECharts 6's own look, and
keep only what the application's own layout needs.

## The owner's decisions

On 2026-11-14, after the investigation [below](#what-was-found):

- The chart's look and features should stay as they are. Where ECharts 6 makes
  that hard, a look that serves the same purpose is fine: small changes are
  better than forcing the old look.
- **Take the colors of ECharts 6**: the axes, the slider, the tooltip.
- **Keep where the toolbox and the slider are**, as the application's layout
  depends on both.
- **Keep the toolbox's two colors** (`#666`, and `#3E98C5` under the pointer),
  which the icon of the chart's menu beside it matches.
- **Keep the ticks of the x-axis**, which show what a label is for.

## What keeps the look of ECharts 5 today

| Where | What |
| --- | --- |
| `src/app/app.config.ts` | The loader of ECharts also loads the official theme `echarts/theme/v5.js`, and in an e2e run sets `window.__plmReadChartTheme`, with which the e2e suite reads the chart's palette. |
| `src/app/date-time-taken-chart/date-time-taken-chart.component.html` | `[theme]="'v5'"` |
| `src/app/date-time-taken-chart/date-time-taken-chart.component.ts` | Options added beside the theme: `grid.outerBoundsMode`, `nameMoveOverlap` of both axes, `padding`, `itemGap`, `iconStyle` and `emphasis` of the toolbox, and 12 options of the slider (`top`, `bottom` and its colors). |
| `angular.json` | `echarts/theme/v5.js` in `allowedCommonJsDependencies`: the theme is a CommonJS module. |
| `docs/contributing/dependencies.md` | The theme's row in the table of the CommonJS modules. |
| `test/e2e/regression.spec.mjs` | The chart case checks the palette's first color, `#5470c6`, and the functions of the loaded ECharts. |

## What was found

Measured on macOS 27.0.1 with ECharts 6.1.0 and ngx-echarts 22.0.0, in two
ways. First, a page that draws the component's option in several variants (with
and without the theme, with and without each added option) in headless
Chromium, for 8 sets of data (years by day, by year, days by hour, an hour by
second, counts of five digits, one photo, no photo) at 5 sizes of the chart
(766x228, which it has in the e2e suite's window, 766x420, 1500x300, 420x228
and 766x120, its smallest height), at rest and with the pointer over the plot,
the toolbox and the slider. The variants were compared by the list of what
ECharts draws (`chart.getZr().storage.getDisplayList()`: each element's kind,
rectangle, colors and text), not by eye. Then the built application, with a
temporary switch between the variants, in the e2e suite's window of 1200x800
and in one of 800x600. The scripts were temporary and are not in the
repository.

1. **The added options repeat the theme.** They were added when the theme was
   registered on another copy of ECharts and so did nothing (the dependency
   upgrades' [STATUS.md](../20261101_dependency-upgrades/STATUS.md), "ECharts
   v5 registration on the actual loader instance"). Since that was corrected,
   the theme alone draws the same chart:
   the same elements in all 40 combinations of data and size, at rest and under
   the pointer. One option is not a repetition: `brushStyle.opacity: 1` of the
   slider, without which the rectangle of a range selected in the slider is
   nearly invisible under the theme.
2. **`grid.outerBoundsMode: 'none'` and `nameMoveOverlap: false` change
   nothing** in this chart, whose grid has fixed margins (90px at the sides)
   and whose axes have no name. The grid is the same down to a chart of
   185x120 and of 766x90; it differs only at a height of 60px, which the chart
   cannot have (`min-height: 120px`).
3. **ECharts 6 by itself breaks the layout in two places**, without the theme
   and without the added options:
   - The toolbox is 10px lower and 10px further left (`padding` 15 rather than
     5), out of the row of the menu's icon and the unit's select beside the
     chart: the middle of its icons is at y = 575 of the window, where the
     row's is at 565. The e2e suite's click on the Reset Zoom icon, at
     `(box.x + box.width - 11, box.y + 14)`, misses it.
   - The slider is 8px higher (15px from the chart's bottom edge rather than
     7px). The bar above it, with which the zoom window is moved, then covers
     the second line of the x-axis's labels, the time under the date, which
     the units Hour, Minute and Second have.
4. **With the toolbox and the slider where they are, nothing moves.** In the
   application at 1200x800 the chart is 766x227, its grid is at (90, 25) and
   586x122, the slider's box at y = 183, the Zoom icon at (703, 9) and the
   Reset Zoom icon at (736, 9), with and without the theme.
5. **What differs then is colors, and the ticks:**

   | What | With the v5 theme | ECharts 6 |
   | --- | --- | --- |
   | Lines and labels of the axes | `#6E7079` | `#54555a` |
   | Split lines | `#E0E6F1` | `#dbdee4` |
   | Ticks of the x-axis | shown | not shown: `axisTick.show` is `'auto'`, which leaves them out for a category axis with a band for each bar |
   | Toolbox icons, and under the pointer | `#666`, `#3E98C5` | `#6578ba`, `#404c76` |
   | Slider: border, corners | `#d2dbee`, 3px round | `#e0e4f2`, square |
   | Slider: the data's line and area | `#d2dbee`, `#d2dbee` | `#a1aed9`, `#c0c9e6` |
   | Slider: the same within the window | `#8fb0f7`, `#8fb0f7` at 0.2 | `#8292cc`, `#c0c9e6` at 0.3 |
   | Slider: border of the handles, and under the pointer | `#ACB8D1`, `#8FB0F7` | `#c0c9e6`, `#8292cc` |
   | Slider: the bar that moves the window, and under the pointer | `#D2DBEE` at 0.7, `#8FB0F7` at 0.7 | `#8292cc` at 0.5, at 0.8 |
   | Slider: labels of the window's ends | `#6E7079` | `#6d6e73` |
   | Slider: rectangle of a range selected in it | `rgba(135,175,274,0.15)` | `#a1aed9` at 0.3 |
   | Tooltip: text, border | `#666`, `#fff` | `#6d6e73`, `#b7b9be` |
   | Line of the axis's pointer | `#B9BEC9` | `#b7b9be` |

   The palette differs too (`#5470c6` and the rest, against `#5070dd` and the
   rest), but the chart does not use it: its bars have their own color.
6. **The features are the same** in every variant: the zoom by the slider's
   handles, by a range selected in the slider and by the toolbox's rectangle,
   the reset, the tooltip, and the labels at the slider's ends while it is
   dragged or under the pointer. ECharts' development build prints no warning
   for the option, with or without the theme.
7. **The icon of the chart's menu follows the toolbox.** Its styles
   (`config/date-time-taken-chart-config.component.scss`) give it a grey close
   to the toolbox's (`#777`), the toolbox's `#3e98c5` under the pointer, and
   its name under it where ECharts draws the names of its icons. With ECharts
   6's toolbox colors, the three icons of the row would have two sets of
   colors.
8. **The screenshots of the e2e suite would not notice the ticks or the
   toolbox's colors.** A comparison allows 0.1% of the window to differ, 960
   pixels of 1200x800. Without the ticks, 28 pixels of the window differ; with
   ECharts 6's toolbox colors, about 190. The places of the toolbox and the
   slider, about 17,800 pixels, would be noticed.

## The change

One pull request from the branch `claude/echarts-v6-migration-6e240f`.

### `src/app/app.config.ts`

The loader only loads ECharts. The theme, the e2e hook and the import of
`startupMetadata`, which only the hook used, go:

```ts
    provideEchartsCore({ echarts: () => import('echarts') }),
```

### `src/app/date-time-taken-chart/date-time-taken-chart.component.html`

Remove the line `[theme]="'v5'"`.

### `src/app/date-time-taken-chart/date-time-taken-chart.component.ts`

In `createEChartsOption`:

- **Remove** `grid.outerBoundsMode`, `xAxis.nameMoveOverlap`,
  `yAxis.nameMoveOverlap`, and from the slider `borderColor`, `borderRadius`,
  `backgroundColor`, `dataBackground`, `selectedDataBackground`, `handleStyle`,
  `moveHandleStyle`, `textStyle`, `brushStyle` and `emphasis`, with the comment
  "Pin the component defaults that changed with the v6 style tokens".
- **Keep, each with a comment that says why** (finding 3 and the decisions
  above), so that nobody takes them for leftovers of ECharts 5:
  - the toolbox's `padding: 5` and `itemGap: 8`;
  - the toolbox's `iconStyle: { borderColor: '#666' }` and
    `emphasis: { iconStyle: { borderColor: '#3E98C5' } }`, without the
    `color: 'none'` that `iconStyle` had, which is ECharts' own value;
  - `show: true` in the x-axis's `axisTick`;
  - the slider's `top: 'auto'` and `bottom: 14`. With `top: 'auto'`, ECharts
    places the slider by `bottom`; it would otherwise place it by a top of its
    own, and `bottom` would do nothing.

### `src/app/date-time-taken-chart/date-time-taken-chart.component.spec.ts`

A new unit test of the option that the component gives ECharts: the four
settings that it keeps. The screenshots would not notice two of them gone
(finding 8), and the e2e suite's click on the Reset Zoom icon notices only
the toolbox's place. The test creates the component with a template of the
column beside the chart only, as ECharts needs a canvas to draw.

### `angular.json`, `docs/contributing/dependencies.md`

Remove `"echarts/theme/v5.js"` from `allowedCommonJsDependencies`, and its row
from the table of "CommonJS modules in the renderer".

### `test/e2e/regression.spec.mjs`

In the case "chart grouping, zoom, reset and photo selection keep their real
data behavior", remove `readChartTheme`, `chartTheme`, the `console.info` of it
and the two expectations of the palette and of `chartTheme.api`. The rest of
the case stays: it drags the slider's handle and clicks the Reset Zoom icon by
their places, which is what checks that the toolbox and the slider are where
they were.

### The reference screenshots

Four screenshots of the whole window show the chart: `empty-home.png`,
`loaded-home.png`, `resized-home.png` and `loaded-home-ar.png`. They are
written anew in `test/e2e/snapshots/`, which matches the owner's Mac, so that
they show the chart as it is now; in each, only the chart differs from
before. `test/e2e/snapshots-ci/macos-26-arm64/`, which CI's runner writes
(`test/e2e/README.md`), changes only if CI's comparisons fail (stage 3).

## Stages

Run the commands from the repository's root. In a git worktree, put
`MISE_TRUSTED_CONFIG_PATHS="$PWD/mise.toml"` before each `mise exec`
(`AGENTS.md`, "In a git worktree"). `npm run test:e2e` keeps the
application's windows off the screen on macOS and Windows: do not add
`--headed`.

After each stage, update STATUS.md and commit. Push a commit that changes
only this folder, as CI skips its tests for documents. Push the others only
where a stage says so: such a push runs CI's tests on three operating systems.

### 0. The baseline, before any change

```sh
mise exec -- npm ci                 # when node_modules is missing or older than package-lock.json
mise exec -- npm run lint:ng
mise exec -- npm run test:unit:ng
mise exec -- npm run build:prod
PLM_VISUAL=1 mise exec -- npm run test:e2e
```

Everything passes on `main`'s code. If a screenshot comparison fails here,
find out why and write it in STATUS.md before going on: stage 2 would
otherwise write that difference into the references as if it were the chart's.

### 1. The change in the code

The edits of [The change](#the-change), without the screenshots. Then:

```sh
mise exec -- npm run lint:ng
mise exec -- npm run test:unit:ng
mise exec -- npm run build:prod     # no warning about a CommonJS module
mise exec -- npm run test:e2e       # without the screenshots: every case passes
```

Commit the code, the test and the two documents. The push and CI's run of
stage 3 can start now, while stage 2 runs on the Mac: CI's screenshots are
taken from the application, not from the references of stage 2.

### 2. The references of the owner's Mac

Only on the Mac that `test/e2e/snapshots/` matches (the baseline of stage 0
passes there). With the production build of stage 1.

The comparisons do not fail: the chart's new colors are within what a
comparison allows, as each pixel may differ by a little in color (Playwright's
`threshold`, 0.2) and 0.1% of the pixels by more. So
`--update-snapshots=changed` writes nothing, and the four references are
written anew on purpose, so that they show the chart as it is now:

```sh
PLM_VISUAL=1 mise exec -- npm run test:e2e -- --update-snapshots=all \
  -g "welcome, about and every available settings tab|laid out from right to left|folder picker loads real photo data"
```

These three cases take the four screenshots, and three others: `welcome`,
`toolbar` and `map-toolbar`. All seven are written anew, and every one differs
from before outside the chart too, by what differs from run to run: the map's
tiles by 1 or 2 in a channel, and the edges of the texts and the buttons by up
to 33. Restore the three others with `git checkout`. Of the four, keep the
rectangle of the chart's element from the new screenshot and the rest from
the reference on `main`, so that a reference changes where the chart is and
nowhere else:

| Reference | The chart's element, from (x, y) to (x, y) |
| --- | --- |
| `empty-home.png`, `loaded-home.png` | (304, 544) to (1069, 770) |
| `resized-home.png`, where the sidebar is wider | (380, 544) to (1069, 770) |
| `loaded-home-ar.png`, where the chart is at the left | (0, 544) to (645, 770) |

The rectangles are where the gutters of the splitters end, and where the
column beside the chart, of 130px, begins. Then check that each of the four
differs from its version on `main` only in the chart, with the script
[below](#where-two-screenshots-differ):

```sh
script=<the file of the script below>
before=$(mktemp -d)
for name in empty-home loaded-home resized-home loaded-home-ar; do
  git show main:test/e2e/snapshots/$name.png > "$before/$name.png"
  mise exec -- node "$script" "$PWD" "$before/$name.png" test/e2e/snapshots/$name.png
done
```

Look at the four pictures as well. Then the whole suite, with the screenshots,
on the production build; and the suite on a development build, which also
fails a case for a binding that changed without telling Angular
(`test/e2e/README.md`):

```sh
PLM_VISUAL=1 mise exec -- npm run test:e2e
mise exec -- npm run build:dev
mise exec -- npm run test:e2e
```

Commit the four references.

### 3. The references of CI

```sh
git push -u origin claude/echarts-v6-migration-6e240f
gh workflow run ci-on-mac.yml --ref claude/echarts-v6-migration-6e240f -f update_screenshots=true
gh run list --workflow=ci-on-mac.yml --branch claude/echarts-v6-migration-6e240f --event workflow_dispatch --limit 1
gh run watch <run> --exit-status    # about 10 minutes
gh run download <run> -n screenshots-macos-26-arm64 -D <a new, empty folder outside the repository>
```

The push starts the three CI workflows. A failure in them is to be read and
classified (`AGENTS.md`, "Classify a CI failure before rerunning it").

The manual run writes anew the references that fail their comparison
(`--update-snapshots=changed`), and uploads the whole folder. As on the
owner's Mac, CI's comparisons of the chart are expected to pass, and then
nothing is written anew: CI's set stays as it is, as #691 left it for a
change that its comparisons passed. Copy the PNG files of the download over
`test/e2e/snapshots-ci/macos-26-arm64/` and look at `git status`. If a
reference was written anew, check it against its version on `main` with the
script, as in stage 2, and look at it, before committing it.

Commit STATUS.md with what the run did, and push. The CI runs of that push
are the ones that stage 4 waits for.

### 4. The pull request

Before opening it, make sure that nothing private is in what GitHub will
show (`AGENTS.md`, "This repository is public"): the commit messages, the
branch's name, the title, the description and the diff.

Open it once the CI runs of the push of stage 3 have passed:

```sh
gh pr create --base main --head claude/echarts-v6-migration-6e240f --label automerge \
  --title "Draw the chart with ECharts 6's own look" --body-file <the description>
```

The description has the sections of the other pull requests: Problem, Change,
Tests, and Open when something is left. Mergify merges a pull request of the
owner with the label `automerge` once `test (ubuntu)`, `test (windows-latest)`
and `test (macos-arm64)` pass (`.mergify.yml`): nothing else is needed to
merge. The Intel macOS job is not needed, as nothing that differs between x64
and arm64 changes.

The owner asked for the pull request to be merged without waiting for them,
so it has the label from the start; the owner usually adds it after the
review. CodeRabbit reviews in about 10 minutes, about as long as the checks
take. Until it is merged: read a failed check's log and classify it before a
rerun, and read the review comments, change what they are right about and
answer the others. Take the label off while a change for a comment is being
made, so that Mergify does not merge without it.

### 5. After the merge

Check that the pull request is merged (`gh pr view <number> --json
state,mergedAt`). STATUS.md is written in stage 3 as it should read on `main`,
so nothing is left to change.

## Where two screenshots differ

Save as a file outside the repository, and run it with the repository's root
and two PNG files of the same size. It prints how many pixels differ and the
rectangle that holds them all.

```js
import { createRequire } from 'node:module';
import path from 'node:path';
const [repository, before, after] = process.argv.slice(2);
const { Jimp } = createRequire(path.join(repository, 'package.json'))('jimp');
const [a, b] = await Promise.all([Jimp.read(before), Jimp.read(after)]);
if (a.bitmap.width !== b.bitmap.width || a.bitmap.height !== b.bitmap.height) throw new Error('The pictures differ in size.');
const { width, height, data } = a.bitmap;
let count = 0, left = width, top = height, right = -1, bottom = -1;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    if (data[i] === b.bitmap.data[i] && data[i + 1] === b.bitmap.data[i + 1] && data[i + 2] === b.bitmap.data[i + 2]) continue;
    count++;
    left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
}
console.log(count === 0 ? `${path.basename(after)}: the same`
  : `${path.basename(after)}: ${count} pixels differ, within x ${left}..${right}, y ${top}..${bottom} of ${width}x${height}`);
```

## To go on after a stop

1. Read STATUS.md: the table of the stages and "Next".
2. `git fetch`, then `git status` and `git log --oneline origin/main..` on
   the branch `claude/echarts-v6-migration-6e240f`: what is committed, what is
   pushed, and what is only in the working tree. A change that is not
   committed belongs to the stage that STATUS.md names as next.
3. `gh pr list --head claude/echarts-v6-migration-6e240f --state all`: whether
   the pull request is open or merged.
4. Go on with the next stage. On another machine than the owner's Mac, stage 2
   cannot write the references of `test/e2e/snapshots/`: do the stages that do
   not need them, and leave stage 2 to that Mac.
