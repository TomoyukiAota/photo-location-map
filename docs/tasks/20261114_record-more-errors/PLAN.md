# Record more errors: plan

This plan is written so that the work can be stopped and picked up at any point.
[`STATUS.md`](./STATUS.md) says how far it has got, what was checked and what is
left for the owner; the checklists under [the stages](#the-work-in-six-stages)
say which steps are done. To resume, read `STATUS.md`, then start at the first
unchecked step of the first stage that is not done.

## Goal

Record as many of the errors that happen on users' computers as the application
can, so that they can be found in the analytics backend and fixed.

The application already records the errors that nothing handles
([`../20261111_errors-on-users-machines/STATUS.md`](../20261111_errors-on-users-machines/STATUS.md)).
This work adds the ones it does not: the errors that the code handles and only
logs, failures without their reason, failures at the very start, launches that
never ended, errors that only the console shows, and crashes of the native code.

## What is recorded today, and what is not

Found by reading the code on 2026-11-14, at `main` `e42320d0`.

**Recorded** (the table of the earlier task's `STATUS.md` has each with its
file): errors that nothing handles in the main process and in the renderer, a
renderer or child process that ends by itself, a window that stops answering, a
preload script that fails, a start of the page that fails in `bootstrap()`,
failed updates, HEIF thumbnails that cannot be made (with the reasons), the
registry changes of Explorer's context menu, the fetch of the map's base layers,
and a marker of the map that cannot be added.

**Not recorded:**

| What | What happens today | Where |
| --- | --- | --- |
| An error that the code catches and logs | It is in the log file on the user's computer only. About 105 calls of `Logger.error`, `Logger.warn` and the loggers of `createPrependedLogger` | `src-shared/log/logger.ts` and its callers |
| Why a folder failed to open | `Opened Folder: Performance` says `Performance (Fail)` and the time; the reason is only logged | `src/app/sidebar/upper-pane/open-folder-recorder.ts` |
| A photo whose EXIF data cannot be read, or whose embedded thumbnail cannot be extracted or turned | `Logger.info` only; the photo then counts as one without EXIF data | `src/app/shared/exif-fetcher/using-exifr/fetch-exif-using-exifr.ts` |
| An error while the main process sets itself up | `src-main/electron-main.ts` imports the log, the startup metadata, the settings and the language before `./configure-electron-unhandled`; an error thrown by those is caught by nothing of the application. Its `try`/`catch` at the end only logs (`TODO: Handle error with electron-unhandled`) | `src-main/electron-main.ts` |
| A page whose modules cannot be loaded | `reportStartFailure` writes to the console and the log file | `src/main.ts` |
| A crash of the main process, a forced quit, a power cut | Nothing runs any more to send an event | — |
| An error shortly before such an end, or while offline before one | The events that are not sent yet are saved on `will-quit` only (`AnalyticsBackendWrapper`), which then never comes; an event is sent a second after it is tracked | `src-shared/analytics/library-wrapper/analytics-backend-wrapper.ts` |
| An error that only the console shows | A library that calls `console.error`, a resource that fails to load, a refused request: no listener records them | — |
| A crash in native code (Electron, Chromium, a driver) | `Process Gone` tells that a renderer or a child process ended and the reason's kind, not where; `crashReporter` is not started | `src-main/record-process-gone.ts` |

**Limits of what is recorded:** a message of 1,000 characters, the first five
frames of the stack, no `cause`, `[object Object]` for a thrown value that is
not an `Error` (`src-shared/analytics/error-for-analytics.ts`); 20 errors per
launch and process and 3 with the same message, the rest dropped without a
count (`src-shared/analytics/record-error.ts`).

## The owner's decisions (2026-11-14)

- **Record as many errors as the application can.** Everything in the table
  above is added.
- **Warnings are recorded too** (`Logger.warn`), and so are the errors that only
  the console shows.
- **Crashes are reported with their crash dumps**, which Electron's
  `crashReporter` uploads to the analytics backend. The owner preferred this to
  keeping the dumps on the user's computer and recording only that one was
  written, and to reading a dump in the application and recording a summary,
  because a dump tells where the native code crashed, which tells what the
  application made it do.
- **The Welcome dialog's sentence loses one word**, in every language:
  "anonymous usage information" becomes "usage information". A dump can hold
  the paths and names of the user's files, which the events never do. The
  sentence does not name crash reports, as the owner finds the short wording
  better, and the dialog is not shown again to users who have confirmed it.
- **The events stay free of the user's paths, file names and user name**, as
  they are today.

## Rules for every stage

- **Nothing in an event names the user's files or the user.** Every new label
  and value goes through the scrubbing of `src-shared/analytics/error-for-analytics.ts`
  or is built from fixed text and numbers. Each stage has a test that puts a
  path, a file name with spaces and a user name in, and finds none in what
  would be sent.
- **No event floods analytics.** Each kind of event has a limit per launch and
  process, and a limit for the same label, as unhandled errors have.
- **Recording never throws and never recurses.** It runs while another error is
  handled, and the analytics code itself logs.
- **No text that the user sees changes**, except the one sentence of stage 6.
  Events, log lines and error messages stay in English (`AGENTS.md`).
- **Each stage is one pull request** that passes CI on its own, with its tests
  and with this task's `STATUS.md` updated. The owner said on 2026-11-14 to
  carry the plan through without stopping, and to keep questions for the end:
  each is merged with the label `automerge` once CI passes and CodeRabbit's
  comments are dealt with. Merging does not release the application.
- **The names in [the table below](#what-the-application-sends-after-this-work)
  are what the analytics backend reads.** Changing one means telling the owner,
  as the backend's side has to follow.

## What the application sends after this work

Every event goes through `Analytics.trackEvent(category, action, label, value)`,
as the errors recorded today do, unless the row says otherwise.

| When | Category | Action | Label | Value | Stage |
| --- | --- | --- | --- | --- | --- |
| An error that nothing handles (as today) | `Unhandled Error` | `Unhandled Error (Main)`, `Unhandled Error (Renderer)` | `Name: message`, scrubbed | Up to 20 frames, then each `cause` with its frames | 1 |
| The limits dropped errors of a launch | `Errors Dropped` | `Errors Dropped (Main)`, `Errors Dropped (Renderer)` | How many of each kind, as `Unhandled Error: 3, Logged Warning: 41` | — | 1 |
| The code logs an error | `Logged Error` | `Logged Error (Main)`, `Logged Error (Renderer)` | The message without its values that are not shown ([stage 2](#stage-2-what-the-code-logs)) | Of the first `Error` among the arguments: `Name: message` and its frames, scrubbed | 2 |
| The code logs a warning | `Logged Warning` | `Logged Warning (Main)`, `Logged Warning (Renderer)` | The same | The same | 2 |
| A folder fails to open | `Opened Folder Info` | `Opened Folder: Failed` | `Name: message` of the reason, scrubbed | Its frames | 3 |
| Photos of an opened folder whose EXIF data cannot be read, or whose embedded thumbnail cannot be extracted or turned | `Opened Folder Info` | `Opened Folder: EXIF Read Failed` | `<status>: <what was thrown>`, scrubbed; the five most frequent | `Files: N` | 3 |
| The main process fails while it sets itself up; the page's modules cannot be loaded | `Unhandled Error` | `Unhandled Error (Main)`, `Unhandled Error (Renderer)` | As any unhandled error | As any unhandled error | 4 |
| A launch finds that an earlier one did not end as it should | `Launch Info` | `Launch Info: Previous Launch Ended Abnormally` | `Version: <version of that launch>` | `Session ID: <its session>; Started: <ISO time>; Last alive: <ISO time>` | 4 |
| The console of the main window's page shows an error that nothing else recorded | `Console Error` | `Console Error (Renderer)` | The message, scrubbed, a web address cut to its origin | Its source and line, scrubbed | 5 |
| A process crashes in native code | Not an event: `crashReporter` uploads the dump | — | — | The fields `user_id` and `session_id`, with those that Electron adds (`ver`, `platform`, `process_type`, …) | 6 |

`Opened Folder: Performance`, `Thumbnail Generation Failed`, `Process Gone` and
the other events of today keep their names, labels and values.

## The work in six stages

The stages are in the order of what the later ones build on. Stage 6 waits for
the address that the analytics backend takes crash dumps at; stages 1 to 5 wait
for nothing.

### Stage 1: More of each error

What each recorded error tells, and what the limits drop.

- **Frames:** `maxStackFrames` is 20 instead of 5. The backend takes labels and
  values far longer than this.
- **Causes:** the value goes on with `Caused by: Name: message` and the frames of
  `error.cause`, up to three causes deep, and with the first three errors of an
  `AggregateError`. The label stays the first error's, so that the same error
  stays one message.
- **Thrown values that are not errors:** an object is recorded as its JSON, cut
  to the label's length and scrubbed, instead of `[object Object]`.
- **The limits, as one piece of code for every kind:** today's limits (20 per
  launch and process, 3 with the same label) are in `record-error.ts` for
  unhandled errors alone. They become a small class that each kind of event
  has one of (the kinds of stages 2 and 5 too), which counts what it drops.
- **What was dropped:** `Errors Dropped`, once per process when it ends: the
  main process on `will-quit`, before the events that are not sent yet are
  saved; the renderer as far as it can, when its page goes (`pagehide`).

Steps:

- [x] `maxStackFrames` 20; causes and `AggregateError` in the value; JSON for
  thrown objects (`src-shared/analytics/error-for-analytics.ts`).
- [x] The limits as a class with counts of what it dropped; `recordUnhandledError`
  uses it (`src-shared/analytics/record-error.ts`).
- [x] `Errors Dropped` from both processes.
- [x] Tests: `test/src-shared/analytics/error-for-analytics.spec.em.both.ts`
  for the frames, the causes and the objects, with paths in each of them; a
  spec for the limits and their counts.
- [x] [Checks](#checks-for-every-stage); `STATUS.md`; pull request.

### Stage 2: What the code logs

Every `Logger.error` and `Logger.warn` becomes an event, without the values
that could name the user's files.

**The problem with sending a log line.** The lines hold paths and names:
``Failed to add the marker of ${photo.path}``, ``Opening ${fileOrFolderName} with
its associated app …``. The scrubbing of today replaces what looks like a path,
which is not enough here: a path with spaces that is not in quotes keeps the
words between its spaces, and a file's name alone has no separator to tell it
by. So what is sent is decided where the line is written, not guessed
afterwards.

**Design:**

- **A tag for the lines, `logged`.** ``Logger.error(logged`Failed to add the
  marker of ${photo.path}`, error)`` gives the logger two texts: the whole line,
  for the console and the log file as today, and the line as it is sent, where
  each value is `<value>` unless it is a number or a boolean, an `Error` (its
  `Name: message`, scrubbed), or wrapped in `shown(…)` by the caller because it
  cannot name anything of the user's: a window's name, a platform, a reason, a
  status, an IPC channel.
- **A line that is a plain string** is sent after the scrubbing of today, with
  every quoted text replaced as well. A lint rule (`no-restricted-syntax` in
  `eslint.config.mjs`, for `src/`, `src-main/` and `src-shared/`) refuses a
  template literal with values, or a concatenation, as the first argument of a
  logger's `error` or `warn`, so that a new line with values has to use the tag.
- **The logger does not import analytics**, which import the logger: each
  process sets what records a line, as `useLogFileWriter` sets what writes it
  (`src-main/analytics/analytics-setup.ts`, `src/analytics-setup.ts`). Lines
  logged before that are kept, up to a limit, as `Analytics` keeps events.
- **Lines that are not recorded:** those of the analytics code itself
  (`[Analytics Backend]`, Amplitude, Mixpanel, the wrappers' decorator), which
  would record their own failure to send; and those next to an event that says
  the same (`record-process-gone.ts`, `record-window-failures.ts`,
  `configure-electron-unhandled.ts`, `start-app.ts`, the registry's and the base
  layers' failures, the marker's). They log through a variant that only logs.
- **The event:** `Logged Error` or `Logged Warning`, with the process in the
  action; the label is the line as it is sent; the value is the first `Error`
  among the other arguments, as an unhandled error's. Its own limits, by
  stage 1's class: a flood of warnings does not use up the errors'.
- **The thumbnail worker's own lines** (`generate-thumbnail-file-worker.ts`
  writes to its console) stay as they are: its failures are recorded by reason
  already.

Steps:

- [x] `logged` and `shown` (`src-shared/log/`), with tests of what each kind of
  value becomes.
- [x] `Logger.error` and `Logger.warn` take a string or a tagged line; the
  variant that only logs; `createPrependedLogger` passes both on, and can make
  a logger that only logs.
- [x] What records a line, set by each process, with the limits and a guard
  against recording from inside recording.
- [x] The lint rule, and every call that it refuses changed to the tag (about
  105 calls; `git grep -n -E "ogger\.(error|warn)\("` lists them). For each
  value, decide whether it is `shown`: when unsure, it is not.
- [x] Tests: a line with a path with spaces, a file's name and the user's name
  sends none of them; the analytics' own lines send nothing; the limits.
- [x] [Checks](#checks-for-every-stage); `STATUS.md`; pull request.

### Stage 3: Failures with their reasons

- **A folder that fails to open:** `OpenFolderRecorder.fail(reason)` records
  `Opened Folder: Failed` with the reason, next to `Opened Folder: Performance`,
  which stays. Its log line becomes one that only logs.
- **Photos whose EXIF data cannot be read:** as `ThumbnailFailures` does for
  thumbnails (`src-main/thumbnail-generation/thumbnail-failures.ts`): a counter
  per opened folder, with a status for where it failed (reading, extracting
  the embedded thumbnail, turning it) and what was thrown, scrubbed; when the
  folder's photos are read, one `Opened Folder: EXIF Read Failed` for each of
  the five most frequent reasons, with `Files: N`. The per-photo `Logger.info`
  lines stay.

Steps:

- [x] `Opened Folder: Failed` (`src/app/sidebar/upper-pane/open-folder-recorder.ts`).
- [x] The counter and its event (`src/app/shared/exif-fetcher/`), recorded where
  the folder's photos have been read (`ExifFetcher.generatePathExifPairs` or
  `PathPhotoMapRecorder`).
- [x] Tests: the reasons are counted, the most frequent five are recorded, and
  a path in what was thrown is not sent (`test/src/app/shared/`).
- [x] [Checks](#checks-for-every-stage); `STATUS.md`; pull request.

### Stage 4: Starts that fail, launches that do not end, and saving at once

**The main process's start.** `./configure-electron-unhandled` is imported
before the setup that can throw: right after `./analytics/error-scrubbing-setup`,
which it needs. Its handler must then work before the log file is set up. The
`catch` at the end of `electron-main.ts` records what it caught. An event
tracked this early waits in `Analytics` until the analytics are set; if the
process ends before, it is lost unless it is saved at once (below).

**The page's start.** `reportStartFailure` in `src/main.ts` also sends
`Unhandled Error (Renderer)` through the bridge (`plmBridge().analytics.sendToBackend`),
with the label and value of `errorForAnalytics` and the home folder and user
name of the startup metadata. `src/main.ts` stays free of the application's
modules, which are what failed to load: `error-for-analytics.ts` imports
nothing. This event reaches the analytics backend only, not the two browser
SDKs, which are part of what did not load.

**A launch that did not end.** The main process writes a small file for its
launch when it starts (its process ID, the session ID, the version, when it
started), touches it now and then, and removes it on `will-quit`. A launch that
finds the file of a process that no longer runs records
`Launch Info: Previous Launch Ended Abnormally` and removes it.

- One file per process, as two instances can run: there is no single-instance
  lock.
- On Windows, `will-quit` does not come when the system shuts down or the user
  logs off (Electron's documentation of the event): the window's `session-end`
  removes the file then.
- The session ID is made in `AnalyticsBackendWrapper.initialize()` today. It
  moves to where the launch's file and stage 6 can read it before analytics are
  set.
- A forced quit and a power cut leave the file too. The event says that a
  launch did not end, not why.

**Saving at once.** The events that are not sent yet are saved when an error is
tracked, not only on `will-quit`, and stay in the file until they are sent: an
event that is sent twice is counted once by the backend, which tells events by
their `event_id`. The file is safe for two instances.

Steps:

- [x] The order of the imports and the `catch` (`src-main/electron-main.ts`);
  the handler works without the log file.
- [x] `reportStartFailure` sends the event (`src/main.ts`).
- [x] The launch's file: written, touched, removed, found at the next launch;
  `session-end` on Windows; the session ID's new place.
- [x] Unsent events saved when an error is tracked, kept until sent, for two
  instances (`analytics-backend-wrapper.ts`, `unsent-events-file.ts`).
- [x] Tests: an error thrown by a setup module is recorded and saved; a file of
  a process that does not run gives the event, one of a process that runs does
  not; events saved at once are loaded by the next launch and sent once.
- [x] [Checks](#checks-for-every-stage); `STATUS.md`; pull request.

### Stage 5: What only the console shows

The main process listens to the main window's `console-message` and records
the errors, as `Console Error (Renderer)`.

- **Only the level `error`**, and only what nothing else recorded: not the
  logger's own lines (they begin with the time and the process in brackets),
  not Chromium's `Uncaught …` lines and Angular's `ERROR …` lines, which the
  renderer records with their stacks, not the line of `reportStartFailure`.
- **The label** is the message, scrubbed; a web address keeps its origin
  (`https://tile.example.org/<path>`), so that a failed request tells which
  server. The value is the source and line, a file of the application by its
  name, anything else scrubbed.
- **Photo Data Viewer's window is left out:** that application records its own
  errors.
- Its own limits, by stage 1's class. A map without a connection logs one line
  per tile: the same label is recorded three times.

Steps:

- [x] Check the event's arguments in the Electron version in use: they changed
  from separate arguments to one event object in an earlier major version.
- [x] The listener (`src-main/`, set where `recordWindowFailures` is), the
  filter and the scrubbing of a web address.
- [x] Tests with stand-ins for the window, as
  `test/src-main/window/record-window-failures.spec.em.main.ts` has.
- [x] [Checks](#checks-for-every-stage); `STATUS.md`; pull request.

### Stage 6: Crash reports, and the Welcome dialog's sentence

**Needs** the address that the analytics backend takes crash dumps at, for dev
and for prod, once the backend takes them there. Do not point the application
at an address that does not take them yet.

- **`crashReporter.start`** in the main process, before `app` is ready and
  before any window is made (a renderer that exists already is not watched),
  after the settings are read, which hold the analytics user ID: `submitURL`
  by the rule that chooses the events' endpoint (dev for a development build
  and for a prerelease version, prod otherwise), `uploadToServer: true`,
  `compress: true`, `rateLimit: false`, and `globalExtra` with `user_id` and
  `session_id`, so that a dump can be put next to what the user did before it.
  Renderers and child processes are watched once the main process has started
  the reporter.
- **Tests never upload.** The e2e hooks cancel the application's requests
  (`electron-util/e2e-test-hooks.js`), but the reporter uploads outside
  Electron's session, where they do not reach. With the test profile and in
  unit tests, `uploadToServer` is false.
- **The Welcome dialog:** `welcome.usageInfoCollection` loses the word for
  "anonymous" in all 42 files of `src-shared/i18n/locales/`. English: "To
  improve this application, this application collects usage information. You
  agree to it by continuing to use this application." Japanese, as the owner
  approved it: 「このアプリの改善のため、使用状況データを収集しています。このアプリの使用を続けると、これに同意したものとみなされます。」
  The other languages: the same sentence without that one word, the rest
  unchanged.

Steps:

- [x] The endpoints and their rule, with a test as the events' rule has
  (`src-shared/analytics/config/`).
- [x] `crashReporter.start`, where the main process sets itself up
  (`src-main/electron-main.ts`); off in tests.
- [x] A check that a dump arrives: a local server that takes the upload, a
  renderer crashed on purpose (`process.crash()`), and the fields of the
  request. As an automated test if it is stable on CI; otherwise by hand on
  macOS, written down in `STATUS.md`.
- [x] With the backend's dev address: crash the application run in development
  mode on purpose, main process and renderer, and check that both dumps
  arrived, with the user ID and the session ID of the launch's events.
- [x] The sentence in 42 files; the translations' unit test; the layout check
  of the Welcome dialog in every language (`test/layout/README.md`); the e2e
  screenshots that show the dialog, if any, updated as `test/e2e/README.md`
  says.
- [x] [Checks](#checks-for-every-stage); `STATUS.md`; pull request.

## Checks for every stage

In a worktree, mise needs the file passed (`AGENTS.md`, "In a git worktree"):

```bash
MISE_TRUSTED_CONFIG_PATHS="$PWD/mise.toml" mise exec -- npm ci
MISE_TRUSTED_CONFIG_PATHS="$PWD/mise.toml" mise exec -- npm run lint:all
MISE_TRUSTED_CONFIG_PATHS="$PWD/mise.toml" mise exec -- npm run test:unit:all
PLM_VISUAL=1 MISE_TRUSTED_CONFIG_PATHS="$PWD/mise.toml" mise exec -- npm run test:e2e
```

- The e2e suite runs on a production build and keeps the windows off the screen
  on macOS and Windows (`test/e2e/README.md`).
- `npm run test:package` stops before its smoke test in a worktree; CI runs the
  whole of it.
- What differs by operating system (stage 4's `session-end`, the paths that the
  scrubbing meets on Windows) is checked by CI's three jobs. Read a failed job
  before running it again (`AGENTS.md`).

## Things to know before starting

- **`Analytics.trackEvent` does nothing in unit tests**
  (`EnvironmentDetector.isUnitTest`). Tests give what records a stand-in, as
  `record-window-failures.ts` lets them.
- **The e2e suite checks the events of a launch**
  (`test/e2e/regression.spec.mjs`, through the hooks that capture them). A new
  event at launch may need its lists changed. A normal launch records none of
  the new events: if one appears there, it is a finding, not a list to extend.
- **The main process's events also go to Amplitude and Mixpanel**, through the
  renderer (`AnalyticsMain.trackEvent`). The new events go the same way as the
  errors of today, except stage 4's page start, which cannot.
- **`src/main.ts` is the page's entry and loads before the application's
  modules.** Keep it so.
- **Module formats:** `import` everywhere; a `require()` only with its reason in
  a comment (`docs/contributing/module-formats.md`). `record-error.ts` has one,
  for the order in which the main process loads.
- **No dependency is needed** for any stage.

## Not part of this work

- **Recovering from a crashed renderer.** The main window stays as it is after
  its process ends; the application neither reloads it nor says so. It is a
  change that the user sees, proposed to the owner on 2026-11-14 as work of its
  own.
- **Showing the Welcome dialog again** to users who have confirmed it, and
  naming crash reports in its sentence: the owner decided against both.
- **The dashboard's pages for the new events**, and everything else that reads
  them: outside this repository.

## To check while implementing

These were not tried when the plan was written:

- That `./configure-electron-unhandled` can be imported before `./log/log-setup`
  without changing what the application does when nothing fails.
- The arguments of `console-message` in the Electron version in use, and which
  lines Chromium and Angular write for an error that the renderer records.
- That `session-end` comes in time on Windows to remove the launch's file.
- How large a crash dump of the main process and of a renderer is, compressed,
  on each operating system: the backend's side has a limit on what it takes.
- Whether the Welcome dialog is in an e2e screenshot.
