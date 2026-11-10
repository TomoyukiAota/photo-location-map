# Errors on users' machines: status

Investigated on 2026-11-11.

## The question

How does the application learn of the errors that occur on users' computers,
and what is missing?

## What is recorded

The application sends these as analytics events, to the backend that its usage
events go to. Nothing is sent that names the user's files.

| What happens | Event | Where |
| --- | --- | --- |
| An error that nothing handles in the main process, an unhandled rejection among them | `Unhandled Error (Main)`, with the error's message and the first five frames of its stack | `src-main/configure-electron-unhandled.ts` |
| An error that nothing handles in the renderer: what Angular catches, an error of a callback that Angular does not call, an unhandled rejection | `Unhandled Error (Renderer)`, with the same | `src/app/shared/error/analytics-error-handler.ts` |
| The renderer process, or a child process such as the GPU process, ends by itself | `Process Gone: Renderer`, `Process Gone: Child`, with the reason and the exit code | `src-main/record-process-gone.ts` |
| A HEIF thumbnail cannot be made | `Thumbnail Generation Failed`, with the reason and the number of files | `src-main/thumbnail-generation/thumbnail-failures.ts` |
| An update cannot be checked for or downloaded | `Auto-update: Error` | `src-main/auto-update/configure-auto-update.ts` |
| The item of Explorer's context menu cannot be added or removed | `[Registry] … Error` | `src-main/explorer-context-menu/explorer-context-menu.ts` |
| The list of the map's base layers cannot be fetched | `[Leaflet Map] Failed to fetch configs` | `src/app/map/leaflet-map/raster-tile-base-layer-configs-version-1.ts` |
| An error that nothing handles in Photo Data Viewer's window | `[PDV] Unhandled Error`, which that application sends | its own repository |

How an error is made safe to send is in
`src-shared/analytics/error-for-analytics.ts`: anything that looks like a path
becomes `<path>`, the user's name `<user>`, and a stack frame keeps the name of
its file only when the file is the application's own. A process sends at most
20 errors per launch, and at most 3 with the same message
(`src-shared/analytics/record-error.ts`).

## What was missing, and is recorded now

Three failures left the user with a window that does not work, and were in the
log file on the user's computer only, or nowhere.

- **The page's start fails** (`src/start-app.ts`), as when the map's base
  layers throw before Angular starts. The user sees the loading text and
  nothing else. The listeners that record the renderer's errors are set during
  that start, so this failure was only logged. It is recorded as
  `Unhandled Error (Renderer)`.
- **A window's preload script fails.** The page then has no bridge to the main
  process, so it can neither write to the log nor send an event. It was only
  logged, by the main process. It is recorded as `Unhandled Error (Renderer)`.
- **A window stops answering**, in a long task or an endless loop, which
  throws nothing. Electron tells the main process when a page stops answering
  and when it answers again. Both are recorded, `Window Unresponsive: Main
  Window` and `Window Responsive Again: Main Window` with how long it took, and
  the same for Photo Data Viewer's window; a window records at most three such
  pairs per launch (`src-main/record-window-failures.ts`).

## What is still not recorded

- **A crash of the main process itself.** Nothing of the application runs any
  more to send an event. Electron's `crashReporter` would send a crash dump at
  the next launch, to a server that takes such dumps, which the analytics
  backend is not.
- **An error that the code handles and logs.** About a hundred places call
  `Logger.error` or `Logger.warn` and go on: a file that the operating system
  cannot open, an entry of the thumbnail cache that cannot be read. They are
  in the log file on the user's computer only. Recording them is a decision
  about how many events that would be, and about what their messages hold.
- **What the user did before an error.** The usage events of the same session
  tell it, by their times; the error itself does not.

## Found on the way

**View Data without a connection shows an error dialog.** Photo Data Viewer's
page is loaded from its server. Without a connection, loading it fails, which
is an unhandled rejection of the main process: the user gets the dialog for
unexpected errors, with `ERR_INTERNET_DISCONNECTED` in it, and the window that
was made for the page stays, hidden, until the application quits. It is
recorded, as `Unhandled Error (Main)`, so the analytics backend tells how
often it happens. It is not changed here: a message of its own for this case
is a text in every language, and a question below.

## Checks

On macOS (Apple Silicon), 2026-11-11.

| Check | Result |
| --- | --- |
| `npm run lint:all` | passed |
| `npm run test:unit:ng` | 166 tests passed |
| `npm run test:unit:em:both` | 203 passed and 2 pending in the main process, 62 passed in the renderer |
| `npm run test:e2e` on the production build, with `PLM_VISUAL=1` | 47 passed, 1 skipped; no screenshot changed |

The three new recordings are checked by tests of their parts, with stand-ins
for the window and for what records: no test makes a real preload script fail
or a real page stop answering.

## Questions for the owner

- **Seeing the new events.** `Window Unresponsive` is a new category. Showing
  it with the other errors is work in the analytics backend's dashboard.
- **View Data without a connection**: should it say "Photo Data Viewer needs an
  internet connection" in a dialog of the application, instead of the dialog
  for unexpected errors?
- **Handled errors**: should what `Logger.error` logs be sent as events too,
  with the same limits as the unhandled ones?
- **Crashes of the main process**: are crash dumps wanted? They need a server
  that takes them.
