# Compatibility exceptions

Observed 2026-11-01. Recheck these when upgrading their parent or upstream fixes.
These are specific compatibility decisions, not permission for blanket overrides.

| Package | Highest investigated | Selected | Evidence and revisit condition |
| --- | --- | --- | --- |
| electron-unhandled | 6.0.0 | 4.0.1 | An actual Electron 45 main-process probe fails with ERR_REQUIRE_ASYNC_MODULE: 5/6 have top-level asynchronous initialization. Version 6 additionally installs renderer-crash/unresponsive dialogs with no opt-out switch. Keep synchronous startup and the original error UI; revisit when the public API supports that policy without a listener/source patch or broader startup change. |
| p-queue | 10.0.0 | 9.3.5 | Both bundled Karma and native Electron Mocha renderers reject the queue's DOM EventTarget in Node setMaxListeners before assertions start. The 9 line uses a compatible emitter. Revisit a release fixing the hybrid renderer check; do not mutate global process/EventTarget or patch dependency sources. |
| heic-decode / libheif-js | 2.1.0 / 1.23.5 | 2.0.0 / 1.18.2 | Every published decoder satisfying 2.1's range (1.19.8, 1.23.2, 1.23.5) changes the original decoded thumbnail pixels. Independent old/new Jimp comparisons identify the decoder, not resizing or JPEG quality. A reviewed child-only pin within 2.0's supported range preserves pixels; revisit after an explicit image-output decision. |
| TypeScript | 7.0.2 | 6.0.3 | Angular 22 and typescript-eslint peers exclude 7. Use their supported compiler range. |
| @electron/universal | 3.0.6 | 2.0.3 | Exact app-builder-lib 26.18.1 pin. Universal assembly and both architecture checks pass; do not override the parent's major. |
| @electron/osx-sign | 2.7.2 | 1.3.3 | Exact builder pin. Actual Developer ID signing and strict/deep verification pass. Revisit with a builder release selecting the newer API. |

Local failure logs are ignored because they contain absolute filesystem paths.
`unhandled6-probe.log` and `runtime-core-native-pqueue.log` retain the actual
runtime failures. The final version snapshot and status record state which
selected versions have completed their gates.

Time-zone data corrections are recorded separately in
[evidence/TIMEZONE_CHANGES.json](./evidence/TIMEZONE_CHANGES.json). They update
historical/political rules while keeping application formatting and selection
logic. See STATUS for the still-open native file-chooser default-directory item.
