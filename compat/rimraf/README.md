# Legacy removal adapter

**TL;DR:** Scope this package to Karma 6 and Temp 0.9. Their callback and `.sync`
interfaces use maintained Node filesystem removal and supported glob 13.

**Details:** Karma passes a temporary path and callback. Temp additionally sets
`maxBusyTries: 6` and uses synchronous cleanup on exit. The adapter preserves
recursive removal, absent-path success, literal existing paths containing glob
characters, and missing-pattern expansion with case-sensitive matching by
default on every OS. Supported options are `maxBusyTries`,
`glob` (including `false`), and `disableGlob`; unknown options fail visibly.
There is no CLI or custom-filesystem-hook support.

Node's documented retry policy replaces rimraf's old `emfileWait` behavior and
Windows synchronous retry loop. These consumers do not configure either.
`maxBusyTries` maps to Node's `maxRetries`, with the legacy default of three and
a 100 ms retry delay. Removal does not follow symlinks into outside directories.

The actual consumers are exercised by
`test/deprecation-warnings/legacy-rimraf.cjs`. Recheck this contract on upgrades,
including Windows CI/package tests. Remove the adapter when compatible upstream
releases no longer require the legacy APIs.
