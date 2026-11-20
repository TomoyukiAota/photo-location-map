# The loading text while the application starts: report

2026-11-21 (Asia/Tokyo). The task was for the main window to show its
"Loading..." text when the application takes time to start, as when two
instances are started with "Open with Photo Location Map" in Explorer. The
spinner showed then, but the text did not. The owner chose the change that this
records: the page is served in the application's language, and its loading text
is in a font of the computer, so that the window's first frame shows the text in
that language and keeps showing it while the page waits.

## Why the text did not show

- **There is no single-instance lock.** Every launch, Explorer's included
  (`"<exe>" --open "%1"`, once for each item that it opens), is a process of
  its own with its own main window, on the same profile: the settings,
  Chromium's storage and the logs.
- **The page's main thread waited before the app's code ran.** With two
  instances started at once on one profile, it waited about 4 s in both
  instances in 7 of 13 tries on macOS, and about 0.5 s in one of them in the
  other 6. On separate profiles, it did not wait. A CPU profile of the page
  puts the wait in mixpanel-browser's check that Web Storage works
  (`_testStorageSupported`, called from its `init` during
  [`src/analytics-setup.ts`](../../../src/analytics-setup.ts)), a synchronous
  call to the browser process. Meanwhile the other instance logged
  `Failed to open LevelDB database ... IndexedDB/... LOCK: Access denied` once
  a second: Mixpanel and Amplitude open IndexedDB when they start, and Chromium
  tries again to open what the other instance holds. A bare Electron page on
  one profile shared by two processes reproduced it: its first `localStorage`
  call took 13–34 ms alone, and about 3 s right after `indexedDB.open()` while
  the other process held the database.
- **The text was invisible while the thread waited.** The text was in Roboto,
  a web font without `font-display`, which Chromium draws as invisible until
  the font has loaded, and draws again on the page's main thread. The spinner
  kept turning, as the compositor turns it. Frames taken every 100 ms showed
  the spinner alone until the wait ended, then the text.
- **The text would have been in English.** `src/start-app.ts` set the
  application's language and text only after the app's modules had been
  evaluated, which is when the wait ended.

## Where the time goes

From the start of the process, in ms, on a Mac (Apple M5) with the production
build, hidden windows and test profiles, online; medians:

| Case | Window created | Page received | App's modules evaluated | Home view |
| --- | --- | --- | --- | --- |
| One launch | 260 | 287 | 357 | 466 |
| Two at once, separate profiles | 296 | 331 | 409 | 508 |
| Two at once, one profile, long wait (7 of 13) | ~290 | ~326 | ~4,300 | ~4,490 |
| Two at once, one profile, short wait (6 of 13) | ~290 | ~320 | ~880 | ~995 |
| The list of the map's base layers does not answer | 278 | 314 | 382 | 10,945 |

- With one launch, the home view renders before the loading screen fades in,
  0.5 s after the page is drawn: the screen is not seen.
- When raw.githubusercontent.com does not answer, the page waits 10 s for the
  list of the map's base layers, then 0.5 s for jsDelivr
  ([`raster-tile-base-layer-configs-version-1.ts`](../../../src/app/map/leaflet-map/raster-tile-base-layer-configs-version-1.ts)).
  The text showed in the application's language all that time, as the app's
  code had already run.

## What changed

- The main process writes the application's language, its direction and the
  loading text in that language into `index.html` as it serves the page
  ([`app-page-language.ts`](../../../src-main/file-server/app-page-language.ts),
  [`app-page.ts`](../../../src-main/file-server/app-page.ts)). The page has no
  script for it, and its Content Security Policy is unchanged.
- The loading text is in `system-ui`
  ([`_app-loading-indicator.scss`](../../../src/styles/_app-loading-indicator.scss)),
  which the production build puts in the page itself with the rest of the
  loading screen's CSS. The spinner stops turning when the system asks for
  reduced motion. The screen is a `status`, and the spinner is hidden from
  screen readers.
- With that page, in the same two launches at once, the text showed in Japanese
  with the spinner for the whole wait. One launch took as long as before: from
  the window's creation to the home view, 189 ms against 205 (medians).
- In every language, the page's first frame, drawn by a headless Chromium with
  only the CSS in the page, has the text on one line, inside a window of
  1200x800 and of 320x240, and not cut.

Not chosen: a splash window of the main process until the home view renders
(far more to change, for what the main window's own page already shows), and
starting Angular without waiting for the list of base layers (it shortens only
the case of a list that does not answer, where the text already showed).

## Not changed

- The wait itself. It comes from the shared profile and from the storage that
  the analytics SDKs open when they start.
- Two instances started in the same millisecond wrote to one log file, whose
  name is the time to the millisecond.

## Checking it on Windows

1. Select two folders in Explorer, right-click, "Show more options", "Open
   with Photo Location Map": Explorer starts one instance for each.
2. Each window shows the spinner with the text in the language of Windows,
   until its home view renders.
3. In `%APPDATA%\Photo Location Map\logs\`, the newest log files show whether
   the page waited: in a launch without the wait, "[Leaflet Map] Fetching
   https://raw.githubusercontent.com/..." comes about 0.1 s after "Launching
   the main window."; with it, seconds after.
