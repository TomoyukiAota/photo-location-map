# A click on a checkbox of the folder tree: status

Investigated and implemented on 2026-11-19.

## What was asked

Once the rows of the folder tree made their checkboxes, thumbnails and buttons lazily
(`docs/tasks/20261119_lazy-tree-rows/STATUS.md`), a click on one checkbox still took about as long to show as before:
40 ms with 2,000 photos, and 390 ms with 10,000 (`checkboxMs` of `test/performance/tree-rows.mjs`). That record
found that every row was checked again, and suggested a component of the row that reads the selection itself, so that a
click checks only the rows whose selection changes.

## Where the time went

CPU profiles and traces of a click on a photo's checkbox in the production build of `main` (fae3baa7), in a folder
whose photos are all in it, while other work shared the computer (a load average of 13 to 43), which made every time
longer than on a quiet one; their proportions are what tell. The click is two tasks of the page's thread: the click's
own, then the frame in which Angular renders what changed.

| One click | 2,000 photos | 10,000 photos |
| --- | --- | --- |
| The click's task | 32 ms | 359 ms |
| — the tree's reaction to the photo's row being expanded, with a check of every row | 25 ms | 330 ms |
| — — of which the bindings of the rows' tree nodes | 8 ms | 266 ms |
| — the checkbox, the selection and the selected photos | 3 ms | 10 ms |
| The next frame's task | 40 ms | 437 ms |
| — Angular's change detection, which checks every row again | 20 ms | 337 ms |
| — — of which the bindings of the rows' tree nodes | 8 ms | 265 ms |
| — — of which the chart's data of the selected photos | 11 ms | 34 ms |
| — the browser's style, layout and paint of the frame, after what `checkboxMs` measures | 13 ms | 93 ms |

Five things made it, the last of which a request to select, as Undo's, has too:

1. **A click on a photo's row expanded the photo.** The row had `matTreeNodeToggle`, which a folder's button has, since
   the Angular Material schematic that the tree was made from in 2019. A click on the row, the checkbox's too, toggled
   the photo's expansion in the CDK tree's state. A photo has nothing to show, but the tree went through all of its
   nodes again, as it does when a folder is expanded, with RxJS for each node, and had Angular check every row.
2. **Angular checks every row's node after an event in the tree.** A listener in a template has Angular refresh the
   views above it, up to the application's: the row's, the tree's (`MatTree`) and the folder tree's own. A row is an
   embedded view in `MatTree`'s view, which Angular checks whenever it checks that view. The components in a row are
   OnPush, which Angular 22 makes the default, and Angular goes into them only when their inputs or the signals that
   they read change: of the checkboxes and the photos' viewers, only those of the clicked row were checked.
3. **The tree node's `aria-posinset` searches its siblings.** `CdkTreeNode` and `MatTreeNode` each bind
   `aria-posinset` to `_getPositionInSet()`, which finds the node among the children of its parent with `findIndex`.
   So a check of the rows of a folder of n photos goes through n²/2 nodes, twice: 100 million comparisons with 10,000
   photos, 4 million with 2,000. That is most of each check of every row.
4. **A change of the selection from outside the tree had Angular check every row's node too.** The rows read the
   selection in the tree's template, through `isSelected()`, which read a signal that each change of the selection
   bumped. Angular follows a signal read in an embedded view for the view that it is in, `MatTree`'s, so Undo, the
   map's selection and the others checked every row's node, with the bindings above, to change one row's checkbox.
5. **A request to select recomputed each folder above every requested photo from all of the folder's
   descendants**: `updateAllParents()` for each requested photo, with a new array of the descendants each time. With
   the photos of a folder all requested, that is quadratic in them: 298 ms of the 303 ms that Undo took in the page
   with 2,000 photos, and about 8 s with 10,000.

## What changed

- **A photo's row has no `matTreeNodeToggle`.** A folder's button keeps it. A click on the row still makes the row the
  tree's active item, which `MatTreeNode`'s own listener of the click does.
- **The rows read the selection themselves.** `DirTreeViewNodeSelection`
  (`src/app/directory-tree-view/dir-tree-view-node-selection.ts`) has the selected photos, and for each folder, how
  many photos that can be selected it has, all the way down, and how many of them are selected, so that a change of a
  photo changes the state of the folders above it only. It replaces the CDK's `SelectionModel` and the signal that
  each change bumped. Each row's component reads its own node's state, a signal that is set only when that node's
  state changes: a photo's (`DirTreeViewCheckboxAndNameComponent`) and a folder's, whose checkbox is now a component
  of its own (`DirTreeViewFolderCheckboxAndNameComponent`). The tree's template reads nothing of the selection.
- **Space on a photo's checkbox selects or deselects it**, as it did on a folder's. The row's toggle took Space and
  Enter from the checkbox, and prevented their default; Enter does nothing on a checkbox. Nothing else that a key or a
  click does changed: the same script, in both builds, found the focus where it was after each key and click.
- `test/performance/tree-rows.mjs` measures `undoMs`: from Undo or Redo in the Selection menu, which change the
  selection of the row that `checkboxMs` clicks, to the frame that shows it. It scrolls before the clicks and Undo,
  which take another time in another build, so that the scrolling follows the same work in every build
  (Measurements).

## What is left: the tree node's `aria-posinset`

A click in the tree still has Angular check every row's node once, with its `aria-posinset`. A profile of a click with
10,000 photos in the build with this change, at a load average of 13 to 18: the click's own task took 7 ms, where it
took 359 ms before, and the next frame's 335 ms, of which Angular's change detection 244 ms, which is 182 ms of the
bindings of the rows' tree nodes, 30 ms of the chart's data and 16 ms of templates, then the browser's layout and
paint. Only the CDK can make the bindings linear, for example with the index of each node in its set. A subclass of
`MatTreeNode` that overrides `_getPositionInSet()` would do it here, but it would depend on a private method of the
CDK, which AGENTS.md ("Stay on the documented setup") leaves to a needed feature or a serious vulnerability. Not done.

## Measurements

`test/performance/tree-rows.mjs` of this change, the production build of `main` (fae3baa7) and the build with this
change, each in a checkout of its own, in turns, on macOS (Apple Silicon). Other work shared the computer, an
evaluation of another project, which took two to four cores and made the load average over a minute vary a lot; the
range of it is given with each series. So every time is longer than on a quiet computer, and varies with that load.
The medians are of interleaved trials, with the range of the trials in parentheses.

| 2,000 photos, medians of 5 trials, at a load average of 3.9 to 15.8 | Before | Now |
| --- | --- | --- |
| A click on a checkbox, to the frame that shows it (`checkboxMs`) | 43 ms (34–69) | 29 ms (19–48) |
| Undo or Redo in the Selection menu, to the frame that shows it (`undoMs`) | 276 ms (182–406) | 15 ms (9–26) |
| The rows made again (`rowsAgainMs`) | 235 ms (206–432) | 364 ms (205–481) |
| Scrolling: the mean time between frames | 16.7 ms (16.7–19.3) | 17.6 ms (16.7–18.9) |
| JavaScript heap | 47.6 MB | 45.9 MB |
| Event listeners | 12,597 | 8,598 |

In the two rounds at the lowest load, 3.9 to 6.9, a click took 34 and 43 ms before and 20 and 19 ms now, Undo or Redo
187 and 276 ms before and 9 and 13 ms now, the rows were made again in 209 and 235 ms before and 205 and 224 ms now, and
both builds scrolled at the display's rate. The medians of the rows made again differ by the rounds at a higher load:
each build was the faster in some of them.

| 10,000 photos, medians of 3 trials, at a load average of 12.1 to 61.6 | Before | Now |
| --- | --- | --- |
| A click on a checkbox, to the frame that shows it (`checkboxMs`) | 817 ms (732–846) | 419 ms (362–434) |
| Undo or Redo in the Selection menu, to the frame that shows it (`undoMs`) | 9,901 ms (9,670–10,626) | 76 ms (53–89) |
| The rows made again (`rowsAgainMs`) | 2.82 s (2.78–2.96) | 2.75 s (2.33–2.88) |
| Scrolling: the mean time between frames | 141.5 ms (140.3–159.9) | 155.2 ms (112.8–159.4) |
| JavaScript heap | 170.2 MB | 161.9 MB |
| Event listeners | 60,597 | 40,598 |

Earlier series, with the script before its last change (below), agree: with 2,000 photos, 7 trials of each at a load
average of 15.7 to 55.2, a click took 78 ms before and 45 ms now, and Undo or Redo 422 ms and 27 ms; with 10,000, 5
trials at 7.3 to 62.1, a click 580 ms and 338 ms, and Undo or Redo 7,501 ms and 73 ms, and 3 more at 7.3 to 28.1, a
click 519 ms and 337 ms, and Undo or Redo 7,993 ms and 69 ms.

- **A click is shown in 30 to 50% less time**: the click no longer expands the photo, so Angular checks every row once
  rather than twice, and the tree does not go through its nodes again.
- **Undo, Redo and the other requests to select are shown in a fifteenth of the time or less with 2,000 photos, and a
  hundredth with 10,000**: the counts of the folders change by the photos that change, and Angular checks the rows
  whose state changed, two for Undo of a click, the photo's and its folder's.
- **Scrolling is as fast.** In the earlier series, the script scrolled after the clicks and Undo, and the time between
  frames was 5 to 7% longer now, in most rounds, with or without waiting for the map to render the last selection.
  The work before it differed: Undo took the page's thread for about 45 s before, and less than a second now. Measured
  alone, after the same work in each build (three launches of each, each scrolling three times from the top, with
  10,000 photos, at a load average of 9.3 to 13.7), the first scroll, in which the rows make what they show, had 75.6
  ms between frames before (72.2–78.5) and 71.0 ms now (68.3–76.2), and the later ones about 20 ms in both.
  `tree-rows.mjs` now scrolls before the clicks and Undo, so that it follows the same work in every build, as in the
  tables above, where each build scrolled faster in some rounds.
- **The page holds a little less**: each photo's row has two listeners fewer, those of the toggle.

## Checks

On macOS (Apple Silicon), 2026-11-19, on `main` at fae3baa7.

| Check | Result |
| --- | --- |
| `npm run lint:all` | passed |
| `npm run test:unit:ng` | 532 tests passed |
| `npm run test:unit:em:both` | 351 passed and 2 pending in the main process, 96 passed in the renderer |
| `npm run build:prod` | built |
| `npm run test:e2e` on the production build, with `PLM_VISUAL=1` | 64 passed, 1 skipped (Windows only) |
| `npm run test:e2e` on the development build, which fails a case with a binding that changed without telling Angular | 64 passed, 1 skipped (Windows only) |

A script opened the fixtures' folder in each build, in English and in Arabic, with every folder expanded, and read
each row's height, and where its checkbox or grey box and its name are and how big: the 11 rows were the same in both
builds, in both languages. Another pressed Space and Enter on a photo's and on a folder's focused checkbox, clicked a
photo's checkbox, then pressed the Up arrow and Space, in each build: all was the same but Space on a photo's checkbox
(What changed).

New tests: `DirTreeViewNodeSelection`, its counts, the order of the selected photos and its signals, which change for
the nodes whose state changes only; the folder's checkbox; the photo's checkbox, which reads its photo's state; and the
tree, where a click on a photo's row does not expand the photo, a click on a checkbox has Angular check the components
of the changed rows only, and a selection requested outside the tree has Angular check no row's node. The tree's test
fails with `matTreeNodeToggle` on a photo's row again, and the last two with a binding of the tree's template that
reads the selection.

`TestBed.overrideComponent()` makes a component's metadata again, with the strategy `Eager` rather than OnPush,
Angular's default, which the application's build gives every component here. The last two tests set OnPush in their
override, as the application has it: without, the development mode's check after each change detection went through
every row.
