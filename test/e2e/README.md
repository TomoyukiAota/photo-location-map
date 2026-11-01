# Electron regression checks

Build with `npm run build:prod`, then run `npm run test:e2e`. Tests launch the
repository's actual Electron executable with the app's compiled main process.
Each test uses a temporary profile, session, logs and thumbnail cache. Analytics
requests are canceled by the test entry before the application starts.

`PLM_VISUAL=1 npm run test:e2e` also compares the committed macOS arm64 screenshots.
Use the same OS, 1200x800 content size, display scaling, locale and fonts as the
baseline. The live OpenStreetMap background may vary independently of the app;
inspect differences rather than regenerating references. Date examples and test
cache paths are masked because they change between runs. Nonvisual functional
checks and the HEIC decoded-pixel reference run on every platform.

References were captured before dependency upgrades (Angular 18.2.4 / Electron
32.0.2). The suite rejects snapshot-update mode on any other dependency versions.
Do not accept new screenshots to make an upgrade pass. The opt-in diagnostic
`PLM_VISUAL=1 PLM_NEGATIVE_CONTROL=1 npm run test:e2e -- --grep welcome` deliberately
moves the Open Folder button 20px and must fail the empty-home comparison.

Tests cover welcome/about/settings, picker-based recursive photo loading,
marker/selection behavior, chart creation, splitter movement, persisted settings
and cancellation after a full app restart, the actual HEIC worker, corrupt
input, and public embedded Photo Data Viewer integration for JPEG and HEIC.
The embedded integration and map library loading need network access. Further
platform/packaging checks are recorded in the task STATUS rather than implied
by this suite.
