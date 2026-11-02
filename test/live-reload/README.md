# Development watcher lifecycle

Build the main process, then run `mise exec -- npm run test:live-reload`.
Linux needs the same Xvfb display as the other Electron checks.

The check creates hidden Electron windows and test-owned source/profile folders.
It verifies clean app quit, a real renderer reload after another source file
changes, and a real process relaunch after the entry changes. Ordinary arguments
must survive relaunch, quit hooks must run, and both processes must exit without
forced termination. Forced cleanup makes failures fail; it does not turn them
into successful exits. Logging/analytics are disabled only in these tiny fixtures.

The real development UI/IPC/photo flow is verified separately through the E2E
live-reload mode. Production launches do not load Chokidar.
