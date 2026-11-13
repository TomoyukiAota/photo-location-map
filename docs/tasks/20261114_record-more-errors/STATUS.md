# Record more errors: status

Started on 2026-11-14. See the [plan](./PLAN.md).

## Current state

Stages 1 and 2 are implemented (see below). The owner asked on 2026-11-14
for as many errors as the application can record, decided what the plan lists
under "The owner's decisions", and then said to carry the plan through without
stopping, keeping questions for the end.

## The stages

| Stage | What | State | Pull request |
| --- | --- | --- | --- |
| 1 | More of each error: 20 frames, causes, thrown objects, the limits as one class, `Errors Dropped` | Merged | #694 |
| 2 | What the code logs: `Logged Error`, `Logged Warning`, the `logged` tag and its lint rule | Its pull request waits for CI | — |
| 3 | Failures with their reasons: `Opened Folder: Failed`, `Opened Folder: EXIF Read Failed` | Not started | — |
| 4 | Starts that fail, launches that do not end, and saving at once | Not started | — |
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
