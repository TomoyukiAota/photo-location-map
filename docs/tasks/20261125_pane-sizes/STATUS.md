# Saving the sizes of the panes: status

Investigated and proposed on 2026-11-25. The owner chose the recommendation the same day, and it was implemented
then ("What the owner chose" and "What was built", at the end).

## What was asked

The home view saves the sizes of its panes, such as the sidebar's width against the map's, and restores them at the
next launch. The request pointed to "Saving State" in Split.js's README. That section is the same in the installed
1.6.5 and upstream. Its example saves the percentages of `getSizes()` from `onDragEnd` to `localStorage`, and passes
them as `sizes` when the split is made at the next launch.

## What the application has today

The home view has three splits, made in `HomeComponent.ngAfterViewInit()` (`src/app/home/home.component.ts`):

| Split | Panes (DOM order) | At launch | Minimum | On a window resize | Saved |
| --- | --- | --- | --- | --- | --- |
| The sidebar's | `#home-left-sidebar`, `#home-right` | 25%, 75% | 200 px each | each keeps its share | no |
| The map's | `#home-map`, `#home-chart` | 70%, 30% | 0 each | each keeps its share | no |
| Inside the sidebar | `#home-sidebar-upper-pane`, `#home-sidebar-lower-pane` | 66 px (its maximum), the rest | 0 each | the upper pane keeps its pixels (`handleWindowResize`) | no |

- Gutters are 8 px, and 4 px inside the sidebar. In Arabic and Hebrew the sidebar's row is laid out from left to right
  and reversed (`home.component.scss`), so the sidebar is on the right.
- The upper pane holds the Open Folder button and the sort menu. No menu item opens a folder; the other ways are
  dropping a folder on the window and, on Windows, Explorer's context menu.
- The upper pane keeps its pixels on `window.onresize` only. When the sidebar's height changes for another reason, such
  as a status bar appearing, it moves slightly, because it is a percentage in between.
- **Window state is not in `UserDataStorage`.** electron-window-state keeps the main window's size, position,
  maximized state and full screen in its own `window-state.json` (`src-main/window-config.ts`). When the saved bounds
  are not inside any display, it falls back to 1000x800 at the top left of the primary display. A headless test restores
  neither maximized nor full screen. Photo Data Viewer's bounds are in `UserDataStorage`, written by the main process
  (`photo-data-viewer-window-state.ts`, `readSavedNumber()`).
- `UserDataStorage` keeps one JSON file per key under `<userData>/PhotoLocationMapStorage/`. A renderer reads a
  snapshot that it gets once from the main process, and writes through IPC. The main process writes only the paths
  in `rendererWritableStoragePaths` (`src-shared/user-data-storage/renderer-storage-access.ts`).
- The map is made 1 s after the home view is shown (`LeafletMapComponent.makeMapLater()`), so it is born after
  Split.js has applied the sizes. Its ResizeObserver calls `invalidateSize()` at every change of its pane
  (`watchSize()`). ngx-echarts 22 resizes the chart at every change of its element (`autoResize`, true by default).
  Neither needs anything more when sizes are restored at launch, or applied again on a resize.

## What Split.js 1.6.5 does with sizes

From `node_modules/split.js/dist/split.es.js`, and a probe in a hidden Electron 45 window:

- Sizes are percentages of the parent. Each pane gets `calc(p% - gutter/2 px)`, so a pane keeps its share, not its
  pixels, when the window is resized.
- `minSize` applies while dragging. At creation and in `setSizes()`, `trimToMin()` raises a pane that is below its
  minimum, if the parent can hold all the minimums. A window resize enforces nothing. A pane still below its minimum at
  creation (`expandToMin` is false) has its minimum lowered to its own size for the rest of the session.
- `onDragEnd(getSizes())` fires on every mouseup on a gutter, including a click that moved nothing.
- **In a reversed row, `setSizes()` gives each pane the other's size.** The sizes at creation and `getSizes()` follow
  the DOM's order, but `setSizes()` takes its pair from `pairs`, which Split.js swaps in a reversed row. In the probe,
  a 1000 px reversed row made with `sizes: [25, 75]` had a 246 px side pane. `setSizes([25, 75])` then made it 746 px,
  and `getSizes()` gave `[75, 25]`. A normal row stayed at 246 px. So any `setSizes()` on the sidebar's split has to
  reverse its array in Arabic and Hebrew. Creating the split with `sizes` is right in both directions.

## Where and when to save

- **In `UserDataStorage`, not `localStorage` as in Split.js's example.** That is where the application keeps every
  other piece of state. Also, `localStorage` is part of Chromium's storage, and an instance started while another runs
  keeps that storage in a folder of its own (`docs/tasks/20261121_two-instance-storage/REPORT.md`), so the sizes would
  come and go with it.
- New paths `UserDataStoragePath.HomeLayout.*`, one per saved pane, added to `rendererWritableStoragePaths`. The value
  is a number as text, as for Photo Data Viewer's bounds, or `''` for none (a reset). A value that is not a finite
  number counts as none.
- Written in `onDragEnd`, only when the value changed. Nothing is written during a drag or on a window resize. A
  clamp to a smaller window (below) does not change what is saved, so the size comes back when the window grows.
- Two instances: each keeps its own sizes while it runs. The next launch gets the last value written.

## Options

### What to save

- **The sidebar's width and the chart's height (recommended).** The request names the first. The second is the same
  kind of choice, and costs almost nothing more.
- **Not the upper pane.** It ranges over 66 px at most. Restored at 0, it would hide the Open Folder button, the only
  button that opens a folder, at every later launch.

### A. Percentages, as in Split.js's example

- Saves `getSizes()`, and passes it as `sizes` at the next launch.
- With the same window, the restore is exact. electron-window-state normally gives the same window. With another
  window size (another display, maximized), each pane keeps its share: a 300 px sidebar in a 1200 px window comes back
  480 px wide when the window is 1920 px.
- A window resize during a session behaves as today: every pane keeps its share.
- Work: small. The paths, reading and checking the saved sizes, saving in `onDragEnd`, and a 200 px floor for the map
  at launch (below).

### B. Pixels: the map takes every change of the window (recommended)

- Saves the sidebar's width and the chart's height in CSS pixels. At launch, and at every change of the split's parent
  (a ResizeObserver, which replaces `window.onresize`), they are converted to percentages for Split.js, as the upper
  pane's height already is. The map takes whatever the window gains or loses. This is how most desktop applications
  treat a sidebar or a panel around their main view, and the tree's rows, whose text does not scale, need a width in
  pixels.
- Clamps, so that a saved size always fits:
  - The sidebar is shown at its saved width, but at least 200 px and leaving the map's side 200 px. These are today's
    minimums for dragging. A window narrower than 408 px gets 25%/75%, as Split.js gives up its minimums there.
  - The chart is shown at its saved height, but leaving the map 200 px. At launch the floor is always 200 px, so a map
    dragged down to nothing does not start hidden. During a session the floor is the map's height at the last drag,
    if that is less, so that a window resize does not undo a drag.
- Until a pane has been dragged, it keeps today's share (25%, 30%) and follows the window as today. So the default
  layout, and with it the e2e cases' screenshots, stay as they are. Defaults in pixels would depend on the window's
  size when the home view is first laid out, which the e2e suite changes right after launch.
- The sidebar's split needs `setSizes()` here, so it reverses the array in a reversed row (see above). A comment next
  to it gives the probe's numbers, in `TL;DR:` / `Details:` form.
- Work: small to medium. A, plus the ResizeObserver for the two splits, the clamps as pure functions with unit tests,
  and the reversal for right-to-left.

### A way back to the default sizes

- None: dragging back is the only way.
- **Double-click on a gutter (recommended)** puts its split back to the default and clears the saved value. It adds
  no text, and some applications do it (VS Code with its sashes), but nothing shows that it is there. The two
  mouseups before the `dblclick` fire `onDragEnd` with nothing changed, which writes nothing. To follow AGENTS.md's
  rule on what the application shows, the gutters can be elements of the home view's template with a `(dblclick)`
  binding, handed to Split.js through its `gutter` option
  (`(index, direction, pairElement) => pairElement.previousElementSibling`), rather than listeners added to the
  elements that Split.js makes.
- A View menu item, "Reset Pane Sizes" or similar. It is discoverable, but needs an IPC channel, the preload's and the
  bridge's listener, and one text in `en.json` and the 41 other files.
- Both.

## How it fits with the rest

- **The map's full-screen mode** (another session's proposal; its options B and C) hides the sidebar, the chart and
  the gutters with a class (`display: none`), and sets the map's panes with `!important` over Split.js's inline sizes,
  without calling `setSizes()`. That fits:
  - Nothing can be dragged meanwhile, so nothing is saved, and the sizes come back unchanged.
  - The ResizeObserver here measures each split's parent and skips a parent of size 0, such as the hidden sidebar.
    Today's `calculateSidebarPanesHeightPercent()` divides by the sidebar's height, which is 0 while the sidebar is
    hidden: a window resize then (option C makes one) gives `Infinity%`. The browser drops that `calc`, but Split.js
    keeps the value. Whichever change lands second has to keep this guard.
  - A menu reset during the mode would apply under the class and show when the mode ends. Asked of that session, with
    whether the mode itself is restored at launch (assumed not).
- **e2e**: each case has a new profile (`PLM_TEST_ROOT` from `mkdtemp()` in `beforeEach`, which
  `electron-util/isolated-test-profile.js` makes `userData`). So no size leaks from one case to the next, including
  the case that drags the gutter below the map and back (`dragGutterBelowMap`). Within a case that closes and
  launches again on its profile, the sizes do come back:
  - "folder picker loads real photo data, markers, tree selection and chart" checks today that a dragged sidebar is
    back at 25% after a restart ("keep that behavior"). That check would become: it comes back at its dragged width.
  - The Arabic case drags the sidebar on the right; a restart there would check the width and the side, which covers
    the reversal.
  - For B, "a window resize keeps the sidebar's upper pane…" would also check that a dragged sidebar and chart keep
    their pixels while the map takes the resize.
  - No screenshot changes: the defaults stay.
- **Languages**: A, B and the double-click add no text. The menu item adds one, in every file of `locales/`. The
  defaults and the minimums are the same in every language. In Arabic and Hebrew, the saved width is the sidebar's,
  wherever it is.
- **Analytics and the log**: as today for the upper pane, a drag's end can be tracked ("Changed Sidebar Width",
  "Changed Chart Height"), and the restored sizes logged at launch.

## Questions for the owner

1. A (percentages) or B (pixels, recommended).
2. What to save: the sidebar's width and the chart's height (recommended), or the sidebar's width alone. The upper pane
   is left as it is.
3. A way back: double-click on a gutter (recommended), the View menu, both, or none.

## What the owner chose

The recommendation, on 2026-11-25: B (pixels), saving the sidebar's width and the chart's height, and a double-click
on a gutter to put back the default.

## What was built

- `src/app/home/pane-sizes/pane-size.ts`: the rules, as functions without the DOM: where a kept pane is shown
  (`shownKeptPaneSize()`), the percentages that Split.js takes for it (`splitPercentages()`), and a saved size
  (`parseSavedSize()`).
- `src/app/home/pane-sizes/pane-split.ts`: `PaneSplit`, which makes a split of Split.js, keeps one of its panes at a
  size in pixels once it has one, and shows it again at each change of the parent's size (a ResizeObserver). It
  ignores a click on the gutter, which moves nothing, keeps the least size of the other pane lower after a drag that
  made it smaller, waits while the parent is not shown, and gives `setSizes()` the shares reversed in a reversed row.
  `reset()` puts back the default.
- `src/app/home/home.component.ts` makes the three splits with it:
  - The sidebar: 25% until dragged; a dragged width kept, and saved in `HomeLayout/SidebarWidth`; at least 200 px, and
    200 px left to the map's side.
  - The chart: 30% until dragged; a dragged height kept, and saved in `HomeLayout/ChartHeight`; 200 px left to the
    map at a launch.
  - The sidebar's upper pane: 66 px, kept at a resize of the window only, as before. Between two resizes, it stays a
    share of the sidebar, so a status bar that appears makes it 2 or 3 px shorter. Keeping it at every change of the
    sidebar's height would move the folder tree in the e2e screenshots where a status bar came or went: a change of
    its own, which this one leaves out. It is not saved, as proposed.
  - Each gutter is now an element of the home view's template, which Split.js takes through its `gutter` option, with
    a `(dblclick)` binding that puts its split back to the default and saves `''` for it.
  - A drag's end is logged and tracked, as the upper pane's already was; so is a reset. The sizes found at launch are
    logged.
- The paths are in `rendererWritableStoragePaths`.
- `window.onresize` is gone: the upper pane listens to the window's `resize` event, which it can stop listening to.

### Tests

- `pane-size.spec.ts` (Vitest): the rules for the three splits' limits, the percentages and the saved text.
- `test/src/app/home/pane-sizes/pane-split.spec.em.renderer.ts` (Electron-Mocha, a page with a real layout): the
  default shares, a saved size through parent resizes, the clamps and the fallback to the default shares, a drag and a
  click, a reversed row, `reset()`, the other pane's least size after a drag and at the next launch, a hidden parent,
  and the upper pane's window-only mode. Without the reversal, the reversed row's case fails.
- `renderer-storage-requests.spec.em.main.ts`: the renderer can write the two paths.
- e2e:
  - "folder picker loads real photo data, markers, tree selection and chart": the dragged sidebar comes back at its
    width after a restart (it was checked to come back at 25%), and a double-click on the gutter puts back 25% and
    saves `''`.
  - "on a computer whose language is Arabic, the application is laid out from right to left": after a restart, the
    sidebar is on the right, at its dragged width.
  - "a window resize keeps the sizes of the panes around the map, …" (renamed from "a window resize keeps the
    sidebar's upper pane, …"): a dragged sidebar and a dragged chart keep their sizes through window resizes while the
    map takes them, and a double-click on the map's gutter puts back 30% and saves `''`.
