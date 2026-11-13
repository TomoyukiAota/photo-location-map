# Record more errors: status

Started on 2026-11-14. See the [plan](./PLAN.md).

## Current state

Stages 1 to 4 are implemented (see below). The owner asked on 2026-11-14
for as many errors as the application can record, decided what the plan lists
under "The owner's decisions", and then said to carry the plan through without
stopping, keeping questions for the end.

## The stages

| Stage | What | State | Pull request |
| --- | --- | --- | --- |
| 1 | More of each error: 20 frames, causes, thrown objects, the limits as one class, `Errors Dropped` | Implemented; its pull request waits for CI | — |
| 2 | What the code logs: `Logged Error`, `Logged Warning`, the `logged` tag and its lint rule | Implemented; its pull request waits for stage 1's | — |
| 3 | Failures with their reasons: `Opened Folder: Failed`, `Opened Folder: EXIF Read Failed` | Implemented; its pull request waits for stage 2's | — |
| 4 | Starts that fail, launches that do not end, and saving at once | Implemented; its pull request waits for stage 3's | — |
| 5 | What only the console shows: `Console Error (Renderer)` | Not started | — |
| 6 | Crash reports, and the Welcome dialog's sentence | Waits for the backend to take crash dumps | — |

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
  settings, the language. An error of theirs is then recorded once analytics are
  set, and logged to the console before the log file is. The `catch` at the end
  records what it caught as an unhandled error of the main process.
- `src/main.ts`: a page whose modules cannot be loaded records
  `Unhandled Error (Renderer)` through the bridge, to the analytics backend
  only, with the home folder and the user name of the startup metadata taken
  out; `error-for-analytics.ts` imports nothing, so the entry stays free of the
  app's modules.
- `src-main/launch/`: each launch writes `<userData>/launches/<pid>.json` (its
  session ID, version, when it started and when it was last alive) first thing,
  again every minute, and removes it on `will-quit`, or on a window's
  `session-end` on Windows. With the launch's other events, a later launch
  records each file of a process that no longer runs, or that was not written
  for seven days, as `Launch Info: Previous Launch Ended Abnormally`, at most
  five at once, and removes it. A crash of the main process, a forced quit, a
  `SIGTERM` and a power cut all leave the file: the event tells that a launch
  did not end, not why.
- `src-shared/analytics/launch-session.ts`: the launch's session ID, made when
  first asked for, which the launch's file and the events share.
- Saving at once (`analytics-backend-wrapper.ts`, `unsent-events-file.ts`): a
  launch saves what it has not sent when an error is tracked (unhandled and
  logged errors, processes gone, windows unresponsive, console errors, dropped
  errors, a launch that ended abnormally) and on `will-quit`, into a file of its
  own, named by its process ID, which it updates as batches are sent. A launch
  takes over the files of launches whose process no longer runs, or that were
  not written for seven days, and the one file of the earlier versions, writing
  their events into its own file before removing them. An event sent twice is
  counted once by the backend, which tells events by their ID.

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
