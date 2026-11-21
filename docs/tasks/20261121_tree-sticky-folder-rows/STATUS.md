# Rows of the folders above, kept at the top of the folder tree

The request was to navigate to the parent folder in the folder tree. Of the ways proposed (opening the folder above
the opened one, a breadcrumb, a button or a menu item), the owner chose to move within the tree: the rows of the
folders above the rows shown stay at the top of the tree while it is scrolled, and the right-click menu of each of
them has Scroll to Here, which scrolls the tree to the folder's own row. The keyboard already went to a folder's row
with the Left arrow key.

What the owner decided:

- The rows are lower than the tree's rows, 32 pixels against 48, so that more of them leave room for the photos.
- At most 7 rows by default. With more folders, the folders in the middle are left out: the opened folder, the two
  folders below it, a row that stands for the folders left out (its tooltip names them), and the three folders above
  the rows shown.
- The most rows (3 to 10) and which folders are left out (in the middle, near the opened folder, near the photos) are
  settings of the Appearance tab. Whatever they are, the opened folder and the folder of the rows shown are kept.
- Scroll to Here is in the menu only: a click on a row does what it does on the folder's own row.

## Measured on a prototype

Apple M5, macOS 27, a development build, windows hidden.

- Room. The tree's pane is the window's content height less 99 pixels (the upper pane 66, the status bar 29, the
  gutter 4). A folder's row is 48 pixels high and a photo's row 237. With five levels of folders, rows of 48 pixels
  left the photos 261 pixels in a window 600 pixels high, 161 in one of 500 (less than one photo's row) and 61 in one
  of 400. So the rows are also limited by the pane: at most a third of it, with a photo's row left below them, and
  never fewer than 3, the opened folder, the row of the folders left out and the folder of the rows shown
  (`allowedStickyRows()`). Rows of 32 pixels within that limit left 341 pixels at 600, 273 at 500 and 237 at 400.
- Cost while scrolling, with 10,000 photos in one folder (10,005 rows, scrolling 100 pixels a frame, after one pass):
  choosing the rows took 0.07 ms a frame, and the frames took 16.7 ms with the rows and 18.9 to 21.7 without them,
  at a load average of 2.5 to 3.6. Three things were needed for that:
  - `document.elementsFromPoint()`, to find the row under the rows kept at the top, took about 10 ms a call, as it
    goes through every row, and frames took 60 to 90 ms. A binary search over the rows by their tops takes almost
    nothing.
  - Giving the template the rows at every frame, though they had not changed, made the frames take 30 to 46 ms. The
    component sets its signals only when what it shows changes.
  - The rows are a component of their own, outside the tree's template: a signal read there would have Angular check
    every row of the tree when it changed (`docs/tasks/20261119_lazy-tree-rows/`).
- Keyboard. Without more, the Up arrow key moved the focus to a row 144 pixels under the rows kept at the top. The
  pane's `scroll-padding-top` follows their height, so that a focused row comes out right below them.
- Choosing the rows level by level, as VS Code's trees do, is needed: a first attempt took the folders of the row below
  all of the rows kept at the top, and went back and forth between two answers where a folder's contents end.

## Found while implementing

- Reveal in Sidebar scrolls a row to the middle of the sidebar, as before the rows, and right below the rows kept at
  the top where it stops when they would cover the row there: `DirTreeViewStickyRowsService.coveredHeightAt()` works
  them out for a scroll position, which `EasedScroll` is given. A first version went to the middle of what the rows
  leave, which moves with them, and did not hold:
  - Going by the rows of each frame, the middle moved up as rows appeared on the way, and the scroll went back by 6
    pixels in its middle (the e2e case that checks its steps failed).
  - Going by the rows kept where it would stop, found in rounds, each below the rows of the stop before, it stopped in
    a window 600 pixels high (`PLM_E2E_COMPACT=1`) with the row 48 pixels below that middle: three rows fewer were
    kept there than it had gone by. Which rows are kept depends on where the box stops, and where it stops on them,
    so that such a middle may not exist.

  With the photo of the first e2e case of Reveal in the middle, the rows of the three folders above it are kept in a
  sidebar of little height: 128 pixels with the opened folder's. In a window 580 pixels high, they would cover the
  photo's row in the middle, which went right below them, 3.75 pixels lower than the middle; in one 600 pixels high, it
  stayed in the middle, 6 pixels below them. The e2e cases of Reveal accept either, as the sidebar of a CI runner may
  be as low.
- jsdom has no `ResizeObserver`: the component's spec stubs it.

## Measured with the implementation

`test/performance/tree-rows.mjs --photos 10000`, production builds of main (9f942f50) and of this branch, on the same
Mac at a load average of 1.9 to 2.8, medians of 3 trials:

| | main | this branch |
| --- | --- | --- |
| The folder opened, to its rows (`openMs`) | 18,958 ms | 18,943 ms |
| The rows made again (`rowsAgainMs`) | 706 ms | 697 ms |
| A click on a checkbox (`checkboxMs`) | 52 ms | 45 ms |
| Undo or Redo (`undoMs`) | 46 ms | 46 ms |
| Scrolling: the mean time between frames | 32.1 ms | 20.4 ms |
| Scrolling: the longest frame | 68 ms | 66 ms |
| JavaScript heap | 160.7 MB | 162.0 MB |

Nothing is slower, and the scroll is faster, which a second series (2 trials each) confirmed: 33.1 ms for main and
19.9 for this branch. That is not the tree's host made a block, which this branch does for the rows to stick in it:
main with only that took 32.0 ms. Why the rows kept at the top make the scroll faster was not found.

## Where it is

- `src/app/directory-tree-view/dir-tree-view-sticky-rows/`: the component, the choice of the rows (`sticky-rows.ts`,
  pure functions with their tests), and the service with the settings and the height that the rows cover.
- `src/app/shared/eased-scroll/eased-scroll.ts`: what covers the top of the box, which Reveal in Sidebar keeps a row
  out of, and under which Select Previous and Select Next do not count a row as shown; `toTop()` and `placeAtTop()`
  for Scroll to Here and the chevron.
- `src-shared/user-settings/sticky-folder-rows.ts` and the Appearance tab.

## Not done

- After a click on a photo's name or checkbox, the focus is on the checkbox, where the arrow keys do nothing: the
  Left arrow key goes to the folder's row only from a row's node. Unchanged here.
- The loading dialog has no Cancel. Unchanged here.
