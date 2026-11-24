# Full screen for the map: status

Investigated and proposed on 2026-11-25. Nothing is implemented: the owner chooses an option first.

## What was asked

A full-screen mode for the map (Leaflet), with nothing more said. This page records what "full screen" can mean in
this application, what each meaning gives and takes, and what has to keep working.

## What the application has today

- **View > Toggle Full Screen** puts the whole window in full screen (Electron's `togglefullscreen` role,
  `src-main/menu/common-menu-template.ts`): Ctrl+Cmd+F on macOS, where the window's green button does it too, and F11
  on Windows and Linux. electron-window-state restores it at the next launch, except in a headless test
  (`src-main/window-config.ts`).
  - macOS: the system's full screen. The window moves to a space of its own, with the system's animation, and the menu
    bar shows only when the pointer reaches the top. A window that opens meanwhile, such as Photo Data Viewer's, which
    has no parent, opens in the desktop's space, and macOS goes there.
  - Windows: the window covers the screen and the taskbar. Electron hides the menu bar in full screen since Electron
    34, and the app shows it again (the `enter-full-screen` listener in `src-main/electron-main.ts`, checked by the
    e2e case "window bounds survive restart and the Windows fullscreen menu stays visible").
  - Linux: the window covers the screen, as the window manager does it, and Electron hides the menu bar.
- **The home view** is laid out by Split.js (`src/app/home/home.component.ts`): the sidebar, 25% and at least 200
  pixels, beside the map over the chart, 70% and 30%, the chart down to nothing. Dragging the gutters makes the map
  larger, but the sidebar keeps its 200 pixels. The sizes are not saved.
- **The map follows its pane's size by itself**: a ResizeObserver calls Leaflet's `invalidateSize()` at each change
  (`LeafletMapComponent.watchSize()`), so any change of the pane needs nothing more.
- **The map's corners**: the layers button and the date box of the dated layers at the top right (the box in a corner
  of its own beside the button), the scale, the zoom buttons and Leaflet-Geoman's toolbar at the bottom right, the
  info of the regions at the bottom left. The top left is free.
- **What is shown outside the map's element**: the sidebar, the chart, the status bars of the thumbnails and of the
  loaded files, the drop hint (`app-drop-hint` in the root, fixed, z-index 100000), and the overlays of the Angular
  CDK: a photo's More Options menu (one mat-menu for every viewer), the sidebar's menus, the tree's context menu and
  every dialog.
- **The CDK shows each overlay as a popover**: CDK 22 gives the overlay's host `popover="manual"` and shows it in the
  browser's top layer, inside `.cdk-overlay-container` in `body` (`createOverlayRef()`, `usePopover` true by
  default, which the app keeps).
- **Esc** today: Leaflet closes the open popup while the map has the focus (its Keyboard handler, which prevents the
  default); a mat-menu and a dialog close themselves (and prevent the default). Leaflet-Geoman leaves it alone: its
  `exitModeOnEscape` is false by default, and the app does not set it.

## What the browser's Fullscreen API does in Electron 45

Probed on 2026-11-25 with Electron 45.3.2 (Chromium 156) on macOS. The window was hidden, and its
`webPreferences.disableHtmlFullscreenWindowResize` was true, so that it never became full screen on the screen: the
element filled the window instead. The page had an element that took fullscreen (`requestFullscreen()` through
`executeJavaScript(code, true)`, which counts as a user's gesture), a manual popover in `body` outside it, as the CDK
puts its overlays, one inside it, and a fixed element of z-index 100000 outside it, as the drop hint. Esc was sent by
`webContents.sendInputEvent()` and by the DevTools protocol, as Playwright sends keys.

- **Esc leaves fullscreen, and the page never gets that keydown**, sent either way. The next Esc reaches the page.
  While the map is in fullscreen, Esc cannot close a popup, a menu or a dialog: it leaves fullscreen first.
- **A popover outside the fullscreen element is painted above it, but takes no click**: a click on it goes to the
  element under it, and `elementsFromPoint()` does not list it. A popover inside the element, and a modal `<dialog>`,
  take clicks. The CDK's menus and dialogs would be seen, but could not be used.
- The CDK's `FullscreenOverlayContainer` moves `.cdk-overlay-container` into the fullscreen element at each
  `fullscreenchange`, which makes them usable. **The move hides a popover that is open**: one shown before fullscreen
  begins or ends gets `display: none`, as removing an element from the document hides its popover (HTML's removing
  steps), while the CDK still has it open.
- The element outside, at z-index 100000, is covered by the fullscreen element.
- The window emits `enter-html-full-screen` and `leave-html-full-screen`. Without
  `disableHtmlFullscreenWindowResize`, Electron also puts the window in full screen, as View > Toggle Full Screen does,
  and leaves the window in full screen afterwards when it was before (`WebContents::SetHtmlApiFullscreen()`). That was
  not run, as it would have taken the owner's screen. Whether Windows then shows the menu bar (the app's
  `enter-full-screen` listener) was not checked either.
- Also: Chromium keeps a scrolled pane's position across `display: none`, and across `content-visibility: hidden`.

## Leaflet.fullscreen

The plugin that Leaflet's list gives for this: `leaflet.fullscreen` 5.3.3 (June 2026), MIT, about 290 lines, for
Leaflet 1.7 and later and 2.0's prereleases, released every few months in 2025 and 2026.

- A button, an `<a href="#">` that it makes with DOM calls, with its own SVG icon from its CSS, at the top left, or in
  the bar of the zoom control when the map has `zoomControl` (this map has not: its zoom control is added at the
  bottom right). Its texts are options (`title`, `titleCancel`), which `t()` can give.
- `requestFullscreen()` on the map's container (or on `fullscreenElement`), or, with `forcePseudoFullscreen`, a class
  that makes the container `position: fixed`, 100% and z-index 99999. It calls `invalidateSize()` and fires
  `enterFullscreen` and `exitFullscreen`.
- Its main file is an ES module that imports `leaflet`: bundled, it would bring a second Leaflet and patch that one,
  not the global `L` of `angular.json`'s scripts, which the app uses. Its UMD file (`dist/Control.FullScreen.umd.js`)
  would go in `angular.json`'s scripts, as leaflet.markercluster's and Leaflet-Geoman's do.
- It does the least of the work: the button and the call. The overlays, Esc, Reveal in Sidebar and the tests are the
  app's work either way, and its button is not an Angular component, which AGENTS.md asks of what the application
  shows (as Leaflet's own buttons are not).

## Options given to the owner

### A. The map's element in full screen, with the Fullscreen API, as Leaflet.fullscreen does

- **What**: a button at the map's top left puts the map's element in fullscreen; Electron puts the window in full
  screen with it. Esc, the button or the window's own controls leave.
- **Gives**: what maps on the web do.
- **Costs**, from the probe above:
  - The More Options menu of a popup, and every dialog (a menu of the menu bar can open one), are shown but take no
    click, unless the app uses `FullscreenOverlayContainer` and closes the overlays that are open at each switch.
  - Esc leaves fullscreen and nothing else: a popup, a menu or a dialog that is open stays.
  - The status bars and the drop hint are hidden; Reveal in Sidebar has to leave fullscreen first.
  - A headless e2e run on macOS cannot let the window go full screen, so the run would set
    `disableHtmlFullscreenWindowResize`, which the app does not; the Windows menu bar would be checked on Windows only.
  - With the plugin, a dependency more.
- **Work**: small to medium, with the most left unknown.

### B. The map fills the window

- **What**: the button hides the sidebar, the chart and their gutters, so that the map takes the window's room under
  the menu bar, above the status bars. The button again, the View menu or Esc bring them back at the sizes they had.
  The window stays as it is; View > Toggle Full Screen still makes it full screen.
- **Gives**: at once, without a transition. The menus, the dialogs, the drop hint, the status bars and Esc work as
  they do now, and every part can be tested headless on every system.
- **Costs**: one click does not fill the screen.
- **Work**: medium (below).

### C. The map in full screen: B, with the window in full screen (recommended)

- **What**: B, and the window goes to full screen with it, unless it is already; leaving puts the window back as it
  was. While the window is full screen anyway, C is B. The window leaving full screen by its own controls (View >
  Toggle Full Screen, Ctrl+Cmd+F, F11, the green button) ends it too.
- **Gives**: what was asked, the map filling the screen at one click, without A's costs or a dependency. The window's
  part is the full screen that the app has and tests.
- **Costs**: on macOS, the window moves to a space of its own, as with View > Toggle Full Screen today, and Photo Data
  Viewer opens in the desktop's space. The window's part can be tested headless on Windows only, as now: a headless
  run elsewhere has to skip it, as `createMainWindowState()` skips a saved full screen. A quit during it starts the
  next launch in full screen, as after View > Toggle Full Screen.
- **Work**: B, and a little more: the bridge's narrow operation that sets the window's full screen, the events of the
  window back to the page, and the headless guard.

## The work of B and C

- A service with the state, and the button: an Angular component through `LeafletContentService`, in a Leaflet
  control at the top left, with the icons `fullscreen` and `fullscreen_exit` of Material Icons (Apache License 2.0)
  drawn in its template, as the drop hint draws `folder_open`, since the icon font is downloaded and the button has to
  show offline. A `<button>` with `aria-pressed`, its title from `t()`.
- The home view: a class that hides the sidebar, the chart and the gutters (`display: none`) and lets the map's panes
  take the room (with `!important` over Split.js's inline sizes, which then come back unchanged). The map's
  ResizeObserver does the rest.
- Esc: leaves when nothing took it before (`defaultPrevented`) and no dialog is open, so that an open popup, menu or
  dialog closes first, and a dialog that Esc does not close (`disableClose`) keeps the map as it is.
- Reveal in Sidebar, from a popup: leaves first, then reveals. Select Previous and Select Next go on, on the map; the
  tree shows the photo's row when it comes back (its scroll is kept, but a hidden tree does not scroll to a row).
- A folder opened meanwhile (by a drop) leaves, as the tree is needed to choose its photos.
- The View menu: an item with a check, beside Toggle Full Screen, through IPC both ways, as the Selection menu's items
  are kept enabled.
- Texts: two or three in `en.json` and in the other 41 files. The map stays left to right in Arabic and Hebrew (its
  container is `direction: ltr`), so the button stays at its top left.
- Tests: unit tests of the service, the button and the layout; an e2e case in English (the panes, the map's size,
  a popup with its More Options menu, Esc, the sizes coming back, Reveal in Sidebar), and the Japanese and Arabic
  cases (the texts, and the sidebar coming back on the right in Arabic).

## Questions for the owner

1. A, B or C.
2. A shortcut: none (the button, the View menu and Esc), or CmdOrCtrl+Shift+F, which the Microsoft Pinyin IME also
   takes, while it is on, to switch between simplified and traditional Chinese. Ctrl+Cmd+F and F11 stay the window's.
