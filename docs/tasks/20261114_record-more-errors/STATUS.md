# Record more errors: status

Started on 2026-11-14. See the [plan](./PLAN.md).

## Current state

All six stages are implemented (see below). The owner asked on 2026-11-14
for as many errors as the application can record, decided what the plan lists
under "The owner's decisions", and then said to carry the plan through without
stopping, keeping questions for the end.

## The stages

| Stage | What | State | Pull request |
| --- | --- | --- | --- |
| 1 | More of each error: 20 frames, causes, thrown objects, the limits as one class, `Errors Dropped` | Merged | #694 |
| 2 | What the code logs: `Logged Error`, `Logged Warning`, the `logged` tag and its lint rule | Merged | #696 |
| 3 | Failures with their reasons: `Opened Folder: Failed`, `Opened Folder: EXIF Read Failed` | Merged | #697 |
| 4 | Starts that fail, launches that do not end, and saving at once | Merged | #698 |
| 5 | What only the console shows: `Console Error (Renderer)` | Its pull request waits for CI | #699 |
| 6 | Crash reports, and the Welcome dialog's sentence | Implemented; its pull request is merged after stage 5's | #700 |

When a stage is done, write here what was changed, what was checked with the
result of each check, and what was found on the way, and tick its steps in the
plan.

## To resume

1. Read this file, then the plan's rules for every stage.
2. Take the first stage that is not done, and the first unchecked step of it.
3. Work on a branch of `main` for that stage, or of the previous stage's branch
   while that one waits for CI. Stages 1 to 5 need nothing from outside this
   repository.

## Waiting on the owner

Nothing. Questions that come up are kept for the end of the work.

## Stage 1: More of each error

What was changed:

- `src-shared/analytics/error-for-analytics.ts`: 20 frames instead of 5; the
  value goes on with `Caused by: Name: message` and the frames of each cause,
  three deep (a cause that points back to its error stops there), and with the
  first three errors of an `AggregateError` as `Error 1 of N: …`; it is cut at
  16,000 characters. A thrown object with a message, such as an error sent from
  a worker, is described as an error, an `ErrorEvent` by its name; another
  object is its JSON with its numbers and booleans, and the texts of its
  diagnostic fields (`code`, `syscall`, `type`, `reason`, `status`, `kind`)
  that are codes (`ENOENT`, `killed`); every other text is `<value>`. At first
  any short text of letters and digits was kept, which CodeRabbit found would
  keep a token such as an access token's.
- Found while writing the test of paths: an unquoted path with spaces in the
  home folder (`/Users/x/Pictures/Trip to Kyoto`) kept the words after its
  first space, as the earlier scrubbing ended a path at a space. Such a path
  now goes to the end of its line, as where it ends cannot be told. A file's
  name with the extension of a photo or a movie the application opens becomes
  `<file>`, quoted with spaces or by itself. An error whose message held
  either is now recorded under another label than before.
- `src-shared/analytics/event-limiter.ts`: the limits as a class, one for each
  kind of event, which counts what it drops. `recordUnhandledError` keeps its
  limits (20 per launch and process, 3 with the same label), and counts an error
  past the first without describing it.
- `src-shared/analytics/record-dropped-events.ts`: `Errors Dropped (Main)` on
  `before-quit`, before the events that are not sent yet are saved on
  `will-quit`; `Errors Dropped (Renderer)` on `pagehide`. Each only when
  something was dropped, once per process.

## Stage 2: What the code logs

What was changed:

- `src-shared/log/logged-line.ts`: the tag `logged` and `shown()`. A tagged
  line gives the console and the log file its whole text, and is recorded with
  each value as `<value>`, but numbers, booleans, errors (their name and
  message, scrubbed) and shown values.
- `src-shared/log/logger.ts`: `Logger.error` and `Logger.warn` take a text or a
  tagged line, log it as before, and hand it to the line recorder that the
  process sets (`useLineRecorder`), which keeps up to 100 lines logged before.
  `errorNotRecorded` and `warnNotRecorded` only log. `createPrependedLogger`
  passes both on, and makes a logger that records nothing with
  `{ recorded: false }`: the analytics code's three loggers are such.
- `src-shared/analytics/record-logged-line.ts`: `Logged Error (Main)`,
  `Logged Error (Renderer)`, `Logged Warning (Main)`, `Logged Warning (Renderer)`.
  The label is the tagged line as recorded, or a plain text with every quoted
  text as `<value>`, both scrubbed of paths; the value is the first error among
  the other arguments, with its stack. Each kind has its own limits (20 per
  launch and process, 3 with the same label). It is set in
  `src-main/analytics/analytics-setup.ts` and `src/analytics-setup.ts`.
- The lint rule (`no-restricted-syntax` in `eslint.config.mjs`) refuses a
  logger's `error()` or `warn()` whose first argument is a template literal with
  values or a concatenation. It does not apply to the thumbnail worker's own
  logger, nor to the analytics code, whose loggers record nothing.
- The 53 calls that it refused: 31 use the tag, with `shown()` for an OS's
  name, a platform, an IPC channel, a program's name, a navigation's kind, the
  code's own names of a URL and of a setting. The other 22 only log, as an event
  next to them records the same failure: an unhandled error, a process gone, a
  window unresponsive, a preload that failed, the registry's failures, a
  thumbnail's reasons, the launch's record, the base layers of the map, a
  marker. electron-updater's own lines only log too: its failures are recorded
  as `Auto-update: Error`.
- The two warnings about a path too long for Windows, which the photo's
  thumbnail writes, are tagged lines.

## Stage 3: Failures with their reasons

What was changed:

- `src-shared/analytics/failure-reasons.ts`: `FailureReasons`, the counter of
  reasons that `ThumbnailFailures` was, for any batch of files: what was thrown
  without paths, counted per status and reason, recorded as one event per
  reason with `Files: N`, the five most frequent. `ThumbnailFailures` is now
  that class with its event's names. A reason that is neither a text nor an
  error is described as an unhandled error's is, an `Event` by its type.
- `Opened Folder: Failed` (`src/app/sidebar/upper-pane/open-folder-recorder.ts`):
  why a folder failed to open, as an unhandled error's label and value, before
  `Opened Folder: Performance`, which stays. Its log line only logs.
- `Opened Folder: EXIF Read Failed` (`src/app/shared/exif-fetcher/exif-read-failures.ts`):
  the photos of a folder whose EXIF data could not be read, counted while the
  folder's photos are read and recorded when all are (`ExifFetcher`), with the
  statuses `read-failed` (exifr could not parse the file), `thumbnail-failed`
  (it could not extract the embedded thumbnail, so the photo has no EXIF data),
  `exif-failed` (the app could not make its model of what was read) and
  `rotate-failed` (the embedded thumbnail could not be turned). A photo without
  EXIF data is not a failure.

## Stage 4: Starts that fail, launches that do not end, and saving at once

What was changed:

- `src-main/electron-main.ts`: the handler of unhandled errors
  (`configure-electron-unhandled.ts`) is set right after the scrubbing of
  errors, before the setups that can throw: the log, the startup metadata, the
  settings, the language. An error of theirs is recorded once analytics are set,
  or, when it stops the launch before they are, by the next launch (below); it
  is logged to the console before the log file is. The `catch` at the end
  records what it caught as an unhandled error of the main process.
- `src/main.ts`: a page whose modules cannot be loaded records
  `Unhandled Error (Renderer)` through the bridge, to the analytics backend
  only, with the home folder and the user name of the startup metadata taken
  out; `error-for-analytics.ts` imports nothing, so the entry stays free of the
  app's modules.
- `src-main/launch/`: each launch writes `<userData>/launches/<pid>-<session ID>.json`
  (its version, when it started and when it was last alive) first thing, again
  every minute, through a file beside it that is renamed over it, and removes it
  on `will-quit`, or on a window's `session-end` on Windows. With the launch's
  other events, a later launch records each file of a process that no longer
  runs, or that was not written for seven days, or of its own process ID but
  another session, as `Launch Info: Previous Launch Ended Abnormally`, at most
  five at once, the oldest first, and removes it. A crash of the main process, a forced quit, a
  `SIGTERM` and a power cut all leave the file: the event tells that a launch
  did not end, not why. A launch that quits before its analytics are set, as
  one whose setup failed, keeps its file, with the last 20 events that it
  tracked until then, its error among them, which the later launch sends after
  that event (its value then ends with `; Kept events: <count>`). A launch that
  starts writes its file without them once its analytics take them.
- `src-shared/analytics/launch-session.ts`: the launch's session ID, made when
  first asked for, which the launch's file and the events share.
- Saving at once (`analytics-backend-wrapper.ts`, `unsent-events-file.ts`): a
  launch saves what it has not sent when an error is tracked (unhandled and
  logged errors, processes gone, windows unresponsive, console errors, dropped
  errors, a launch that ended abnormally) and on `will-quit`, into a file of its
  own, named by its process ID, which it updates as batches are sent. A launch
  takes over the files of launches whose process no longer runs, or that were
  not written for seven days, and the one file of the earlier versions, writing
  their events into its own file before removing them; and its own file, which
  before it writes is an earlier launch's that was given the same process ID.
  A file that cannot be removed is kept, for a later launch to take over again.
  An event sent twice is counted once by the backend, which tells events by
  their ID.

What CodeRabbit found on the pull request, and was changed on 2026-11-14:

- A setup that throws stops the main process's entry before analytics are set,
  so its error stayed in memory, and the launch's file was removed when the
  user quit: such a start was not recorded at all. The launch now keeps the
  events in its file, and the file.
- A later launch given the process ID of one that crashed wrote over that
  launch's file and left out its file of unsent events. The launch files are
  named with the session too, and a launch takes over its own file of unsent
  events.
- A launch's file is written beside it and renamed over it, so that a launch
  that ends while writing it does not leave a file that cannot be read.
- A file of unsent events that could not be removed made the launch drop the
  events that it had taken over.
- On its second look: of more than five launches that ended, the files of those
  beyond the five recorded were removed, with the events that they kept. A
  launch now takes the five oldest and leaves the others for later launches.
  And a file of unsent events is written beside it and renamed over it too, as
  it can hold the only copy of another launch's events.

Checked by hand on macOS, 2026-11-14, after the review: the main process,
started as the e2e suite's entry starts it with a test profile, its language
setup made to throw by the script that started it, and its dialogs and Dock
icon kept off the screen. The launch kept the setup's
`Unhandled Error (Main)`, its stack scrubbed, in its launch file, and kept the
file when it quit. The next launch, on the same profile, with its windows
hidden and the analytics backend's requests caught by the script rather than
sent, sent `Launch Info: Previous Launch Ended Abnormally` with
`; Kept events: 1` and then that error, and removed its own file when it quit.

## Stage 5: What only the console shows

What was changed:

- `src-main/record-console-errors.ts`: the main process listens to the main
  window's `console-message` (in Electron 45, one argument with `level`,
  `message`, `lineNumber` and `sourceId`), and records the lines of the level
  `error` as `Console Error (Renderer)`, within limits of their own (20 per
  launch, 3 with the same label). It leaves out what is recorded otherwise: the
  logger's own lines, which begin with the time and the process, Chromium's
  `Uncaught …` and Angular's `ERROR …`, which the renderer records with their
  stacks, and the line of a page that could not start.
- `src-shared/analytics/error-for-analytics.ts`: `scrubConsoleMessage` scrubs a
  line as an error's message, but that a web address keeps its origin
  (`https://tile.example.org/<path>`); `scrubConsoleSource` gives the source as
  a file of the app's by its name, a web address by its origin, or `<path>`.
  The part of the scrubbing of stacks that tells an app's file is
  `scrubFile`, which both use. The origin that either keeps has the user name
  taken out, as a computer on the network can be named after its user
  (`http://<user>-macbook.local:8080/<path>`); added before the pull request
  was reviewed.

What CodeRabbit found on the pull request, and was changed on 2026-11-14:

- A URL gives its host in lower case, so a user name in another case stayed in
  an origin. The user name is taken out of an origin in any case.
- A web source on the local machine, such as a tile server at
  `http://localhost:8080/tiles/…?key=…`, was taken for the dev server's file
  and kept its path and query, and a web address that names `app.asar/` was
  taken for the app's file. The source of a console line that is a web address
  is now given by its origin only, whatever it serves; a file's, without its
  query.
- Photo Data Viewer's window is left out: that application records its own
  errors.

Found on the way: the unit tests load a module's compiled `.js` when one is
next to its `.ts`, which `npm run build:src-main` writes. After a build for the
e2e suite, a change to a module of the main process is not what its tests run
until the compiled files are removed (`git clean -fX src-main src-shared`).

## Stage 6: Crash reports, and the Welcome dialog's sentence

What was changed:

- `src-main/crash-reporter-setup.ts`: Electron's crash reporter, started right
  after the settings (which hold the analytics user ID) and before the app is
  ready, uploads to `src-shared/analytics/config/crash-report-endpoint.ts`'s
  address by the events' rule (dev for a development build and a prerelease
  version), gzipped, without Crashpad's limit of one an hour, with the user
  ID and the launch's session ID as `globalExtra`. A test profile, a package
  test and unit tests upload nothing, unless a test with a test profile gives
  its own address in `PLM_TEST_CRASH_REPORT_URL`.
- The Welcome dialog's sentence, `welcome.usageInfoCollection`, without the
  word for "anonymous" in all 42 languages, as the owner decided; the
  Japanese as the owner approved it. The sentence only got shorter, so the
  dialog's layout was not checked in every language. The e2e references
  `welcome.png` and `welcome-ja.png` were written anew on the Mac
  (`--update-snapshots=changed`); CI's, in `snapshots-ci/macos-26-arm64/`,
  by the macOS workflow run with `update_screenshots` on this branch, whose
  artifact had only these two differing from the references. Both show the
  new sentence, on as many lines as before.

Checked by hand on macOS, 2026-11-14: the app, built from this branch and
launched with a test profile and its windows off the screen (Playwright, as
the e2e suite), with `PLM_TEST_CRASH_REPORT_URL` set to the analytics
backend's dev address. A renderer crashed on purpose (`chrome://crash`) was
uploaded at once, and the main process (`process.crash()`) at the next
launch; dev's endpoint accepted both, and both have their stacks there
(`blink::internal::CrashIntentionally()`, `electron::ElectronBindings::Crash()`),
with a user ID and a session ID. Launched through the e2e suite's entry, the
dumps name the product as `Electron` and the version as Electron's, as that
entry runs Electron's own bundle; a build of the app names its own.

## Checks

| Check | Stage | Result |
| --- | --- | --- |
| `npm run lint:all` | 1 | passed |
| `npm run test:unit:em:main` | 1 | 218 passed, 2 pending |
| `npm run test:unit:em:renderer` | 1 | 76 passed |
| `npm run test:unit:ng` | 1 | 437 passed |
| `npm run test:e2e` | 1 | Left to CI, which runs it on the three operating systems: stage 1 changes nothing that a window shows |
| `npm run lint:all`, with the new rule | 2 | passed |
| `npx tsc -p tsconfig.src-main.json --noEmit` | 2 | passed |
| `npm run test:unit:em:main` | 2 | 232 passed, 2 pending |
| `npm run test:unit:em:renderer` | 2 | 90 passed |
| `npm run test:unit:ng` | 2 | 58 files passed |
| `npm run test:e2e` | 2 | Left to CI: nothing that a window shows changes |
| `npm run lint:all`, `tsc` of the main process | 3 | passed |
| `npm run test:unit:em:main` | 3 | 233 passed, 2 pending |
| `npm run test:unit:em:renderer` | 3 | 91 passed, among them a file that is not a photo, counted as `read-failed` without its name |
| `npm run test:unit:ng` | 3 | 58 files passed |
| `npm run test:e2e` | 3 | Left to CI: nothing that a window shows changes |
| `npm run lint:all`, `tsc` of the main process | 4 | passed |
| `npm run test:unit:em:main` | 4 | 242 passed, 2 pending |
| `npm run test:unit:em:renderer` | 4 | 91 passed |
| `npm run test:unit:ng` | 4 | 58 files passed |
| `npm run lint:all`, `tsc` of the main process | 4, after the review | passed |
| `npm run test:unit:em:main` | 4, after the review | 251 passed, 2 pending, among them a launch given the process ID of one that ended, a file left half written, the events that a launch kept, more launches than are taken at once, and files of unsent events that cannot be written or removed |
| `npm run test:unit:em:renderer` | 4, after the review | 91 passed |
| `npm run test:unit:ng` | 4, after the review | 58 files passed |
| `npm run test:e2e`, on a production build of stage 4 | 1 to 4 | 49 passed, 1 skipped (5.0 min) |
| `npm run lint:all`, `tsc` of the main process | 5 | passed |
| `npm run test:unit:em:main` | 5 | 247 passed, 2 pending |
| `npm run test:unit:em:renderer` | 5 | 91 passed |
| `npm run test:unit:ng` | 5 | 58 files passed |
| `npm run lint:all`, `tsc` of the main process | 5, merged with the reviewed stage 4 | passed |
| `npm run test:unit:em:main` | 5, merged with the reviewed stage 4 | 257 passed, 2 pending, among them an origin named after its user |
| `npm run test:unit:em:renderer` | 5, merged with the reviewed stage 4 | 92 passed |
| `npm run test:unit:ng` | 5, merged with the reviewed stage 4 | 58 files passed |
| `npm run lint:all`, `tsc` of the main process | 5, after the review | passed |
| `npm run test:unit:em:main` | 5, after the review | 260 passed, 2 pending, among them a user name in another case, a local tile server's source, a web address that names `app.asar`, and a file with a query |
| `npm run test:unit:em:renderer` | 5, after the review | 95 passed |
| `npm run lint:all`, `tsc` of the main process | 6 | passed |
| `npm run test:unit:em:main` | 6 | 249 passed, 2 pending |
| `npm run test:unit:em:renderer` | 6 | 91 passed |
| `npm run test:unit:ng` | 6 | 58 files passed, the translations' among them |
| `PLM_VISUAL=1 npm run test:e2e`, the Welcome dialog's cases | 6 | 2 passed, with the references written anew |
