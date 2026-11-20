# The folder tree's `aria-posinset`: status

Measured, decided and implemented on 2026-11-20.

## What was asked

After a click on a checkbox of the folder tree stopped expanding the photo and checking every row twice
(`docs/tasks/20261119_checkbox-checks-changed-rows/STATUS.md`), most of what was left of a click with 10,000 photos in
one folder was the `aria-posinset` of the rows' tree nodes. The owner asked how its time grows with the photos of a
folder, up to a million, then chose to make it linear in this repository, and to record its performance.

## How `aria-posinset` grew with the photos of a folder

`aria-posinset` says where a row is among its siblings: 1 for the first. `CdkTreeNode` and `MatTreeNode`
(`@angular/cdk` and `@angular/material` 22.2.5) both bind it to `_getPositionInSet()`, which asks `CdkTree`, whose
`_getPositionInSet()` searches the set of the node's siblings with `findIndex`: the k-th photo of a folder compares k
of them, in each of the two bindings. `main` of angular/components searched in the same way on this date.

So a check of every row of a folder of n photos makes n(n + 1) comparisons, about 0.93 ns each on this computer: the
time is about 0.093 × (n / 10,000)² s, four times as long for twice the photos. Angular checks every row's node after
each click and key in the tree, as a listener marks `MatTree`'s view for refresh (the record above), and once at least
when the rows are made, as when a folder is opened or expanded. A selection from outside the tree, as Undo's, the map's
and the chart's, checks no row's node.

| Photos in one folder | Comparisons in a check of every row | Time |
| --- | --- | --- |
| 10,000 | 100 million | 95 ms |
| 20,000 | 400 million | 373 ms |
| 40,000 | 1.6 billion | 1.53 s |
| 80,000 | 6.4 billion | 5.94 s |
| 160,000 | 25.6 billion | 23.7 s |
| 320,000 | 102 billion | 94 s |
| 640,000 | 410 billion | 6 min 15 s |
| 1,000,000 | 1 trillion | 15 min 44 s |

With 64 photos or fewer, a check took less than 0.01 ms (5.5 µs with 64). Photos in several folders cost the sum of
each folder's: a million photos in 1,000 expanded folders of 1,000 would take about 0.9 s.

How this was measured: the CDK's own `CdkTreeNode._getPositionInSet()`, called twice for each row of a folder, in
Electron 45's V8 without a window (`ELECTRON_RUN_AS_NODE`), on a MacBook with an Apple M5, as the minimum of 7 checks (3
for every row of 80,000 and 160,000). Every row was checked up to 160,000 photos; from 320,000, every k-th row, times
k, which agreed with every row within 1% at 40,000, 80,000 and 160,000. The tree was a `MatTree` made by its own
constructor, with stubs of what it injects: a tree that only had `CdkTree`'s prototype measured more than twice as
fast, as its `expansionKey`, which the callback of `findIndex` reads for each sibling, was not a field of its own, and
the JIT left the read out.

The application agreed. CPU profiles of three clicks on a checkbox, clicked as `tree-rows.mjs` clicks, in the
production build of PR #752's last commit, on folders of copies of a photo: V8 inlined `_getPositionInSet()` and its
search into the host bindings of `CdkTreeNode` and `MatTreeNode`, which took 5 to 9% longer than the checks above,
about what the profiler's sampling adds. A first series with 20,000 photos, while other work took the computer, took
twice as long; the table has the series made again on a quiet computer.

| Photos in one folder | The tree nodes' host bindings in a click (median of 3) | The click, to the frame after it shows |
| --- | --- | --- |
| 10,000 | 104 ms (98–107) | 150 ms (137–156) |
| 20,000 | 391 ms (390–393) | 466 ms (436–499) |
| 40,000 | 1,615 ms (1,587–1,622) | 1,790 ms (1,768–1,825) |

## The decision

Nothing public avoids the search. The bindings are the CDK's own: a binding of `aria-posinset` of ours would not stop
them, and no change of ours keeps Angular from checking every row after an event in the tree. That left two ways:

1. Report it to angular/components, and wait for a release that finds the position without searching.
2. Override the node's `_getPositionInSet()` here, which its leading underscore keeps out of the CDK's public API: a
   departure from the documented setup (AGENTS.md, "Stay on the documented setup").

The owner chose the second, on 2026-11-20. It is listed in `docs/contributing/dependencies.md`, "Departures kept for a
needed feature", with when to remove it.

The owner had the search reported as well, the same day, where no earlier report covered it:
[angular/components#34163](https://github.com/angular/components/issues/34163). The report has a reproduction on
StackBlitz (<https://stackblitz.com/edit/ordthymq>), a `MatTree` with one parent of many children, and suggests a change
to `CdkTree` that stores each node's index in its set when the sets are built. Made to `@angular/cdk` 22.2.5, the change
kept every row's `aria-posinset` and `aria-setsize`, and a click with 40,000 children took 9 ms rather than 2.0 s in a
production build of the reproduction, on a computer busier than for the measurements above. The directive's comment and
`docs/contributing/dependencies.md` link to the report, as what to watch before removing the directive.

## What changed

- **`DirTreeViewTreeNodeDirective`** (`src/app/directory-tree-view/dir-tree-view-tree-node.directive.ts`) is the rows'
  tree node: `MatTreeNode`, with its selector, whose `_getPositionInSet()` looks the position up. The folder tree does
  not import `MatTreeNode`, so that this is the only tree node of a `mat-tree-node`: with both, `MatTreeNode`'s bindings
  would still search. Its comment has the reasons, in the TL;DR and Details form, and what to check on an upgrade of
  the CDK.
- **`DirTreeViewNodePositions`**, in the same file, has the position of every node among its siblings. The folder tree
  counts them again when its order changes: when a folder is opened, and when it is sorted, which reorders the
  children in place. A shown node's set in the CDK is the children of its expanded parent, in that order, or the
  roots, so `aria-posinset` keeps its values, and `aria-setsize` is the CDK's still.

## Measurements

`test/performance/tree-rows.mjs`, the production build of `main` (95686e7b) and the build with this change, each in a
checkout of its own, in interleaved trials, on the MacBook above, quiet this time: a load average of 3.0 to 7.0. The
medians, with the range of the trials in parentheses:

| Before → now | 2,000 photos, 5 trials | 10,000 photos, 3 trials | 40,000 photos, 1 trial |
| --- | --- | --- | --- |
| A click on a checkbox, to the frame after it shows (`checkboxMs`) | 21 (19–23) → 19 ms (19–20) | 152 (151–155) → 53 ms (49–53) | 1,766 → 201 ms |
| The rows made again (`rowsAgainMs`) | 198 (191–211) → 198 ms (194–211) | 920 (920–955) → 748 ms (724–750) | 6.41 → 3.73 s |
| The folder opened, to its rows (`openMs`) | 3.82 (3.78–3.86) → 3.78 s (3.75–3.84) | 18.85 (18.85–18.90) → 18.24 s (18.23–18.27) | 86.4 → 81.8 s |
| Undo or Redo in the Selection menu, to the frame after it shows (`undoMs`) | 15 (15–19) → 18 ms (16–18) | 49 (48–50) → 50 ms (48–53) | 163 → 184 ms |
| Scrolling: the mean time between frames | 16.7 → 16.7 ms | 41.5 (39.3–45.4) → 40.4 ms (35.5–42.8) | 201.5 → 194.2 ms |
| JavaScript heap | 45.9 → 45.9 MB | 162.0 → 160.6 MB | 591.8 → 590.0 MB |
| Event listeners | 8,601 → 8,601 | 40,601 → 40,601 | 160,601 → 160,601 |

- **A click is shown in a third of the time with 10,000 photos, and in a ninth with 40,000.** What it saves grows with
  the square of the photos of the folder, as the first table says: 2 ms with 2,000, which the frames of 16.7 ms mostly
  hide.
- **The rows are made again in 19% less time with 10,000 photos, and 42% less with 40,000**: Angular checks a new row's
  node too, and the tree checks every row twice when it renders them, once of its own and once in the application's
  change detection.
- **A folder opens a little sooner**, by the same checks of its rows.
- **Undo and Redo do not change**: they have Angular check no row's node. With 2,000 and 10,000 photos, the trials of
  the two builds overlapped; with 40,000, there was one trial of each.
- Scrolling, memory and listeners do not change: the directive replaces `MatTreeNode` on each row, with no listener of
  its own, and its positions are one entry of a map for each node.

CPU profiles of three clicks in the build with this change, made as those above, at a load average of 4.7 to 7.8: the
host bindings of the rows' tree nodes took 0.1 to 0.6 ms of a click with 10,000 photos and 1.7 to 4.1 ms with 40,000,
where they took 98 to 107 ms and 1,587 to 1,622 ms before. What is left of a click grows in proportion to the rows,
as Angular still checks every row's node after an event in the tree: 53 ms with 10,000 photos and 201 ms with 40,000,
in the trials above.

## Checks

On macOS (Apple Silicon), 2026-11-20, on `main` at 95686e7b.

| Check | Result |
| --- | --- |
| `npm run lint:all` | passed |
| `npm run test:unit:ng` | 555 tests passed |
| `npm run test:unit:em:both` | 353 passed and 2 pending in the main process, 96 passed in the renderer |
| `npm run build:prod` | built |
| `npm run test:e2e` on the production build, with `PLM_VISUAL=1` | 67 passed, 1 skipped (Windows only) |
| `npm run test:e2e` on the development build, which fails a case with a binding that changed without telling Angular | 67 passed, 1 skipped (Windows only) |

New tests: `DirTreeViewNodePositions`, which counts each node among its siblings and the roots among the roots, and
counts them again in their new order; the tree, whose rows have their `aria-posinset` and `aria-setsize` by name and
then in the other direction; and a click, after which each row's tree node gives its position twice, once to each
binding, and `CdkTree`'s `_getPositionInSet()`, which searches, is not called. The last test fails without the
override, and the one before it without counting the positions again after a sort.
