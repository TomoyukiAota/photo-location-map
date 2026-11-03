# Development watcher lifecycle

Build the main process, then run `mise exec -- npm run test:live-reload`.
Linux needs the same Xvfb display as the other Electron checks.

The check creates hidden Electron windows and test-owned source/profile folders.
It verifies clean app quit, a real renderer reload after a non-code file
changes, and a real process relaunch after either the entry or a loaded sibling
JavaScript module changes. The sibling case checks that the new process reads
the module's updated export rather than the old cached value. Ordinary arguments
must survive both relaunch cases, quit hooks must run, and both processes must
exit without forced termination. A fifth lifecycle case runs beneath a hidden
checkout ancestor, ignores dot descendants and dependency folders, then verifies
a real module relaunch. Forced cleanup makes failures fail; it does not turn them
into successful exits. Logging/analytics are disabled only in these tiny fixtures.

A separate event-burst check runs the compiled watcher with controlled Electron
dependencies and a pending quit. Several module events must queue one relaunch,
preserve arguments and close the watcher. The five process fixtures establish
the actual Electron lifecycle separately, including the hidden checkout case.

The real development UI/IPC/photo flow is verified separately through the E2E
live-reload mode. Production launches do not load Chokidar.
