# Test environments and preserved coverage

## Baseline and intended split

The starting Angular/Karma target has 30 spec files and 57 tests. Six shared
specs (25 tests) assert properties of a genuine Electron renderer; they must not
run against a fabricated renderer in jsdom. The remaining 24 files (32 tests)
contain Angular construction checks or platform-independent calculations and
belong in Vitest. The existing Electron-Mocha main/renderer and Playwright suites
remain separate and continue testing their real runtimes.

This inventory precedes the test moves. Status and integrated command outcomes
are recorded below and in `PLAN.md`. No application runtime change is needed to
move the assertions.

## Genuine Electron assertions

| Current source | Tests | Destination and treatment |
| --- | ---: | --- |
| `src-shared/process/process-accessor.spec.ts` | 5 | Existing `test/src-shared/process/process-accessor.spec.em.renderer.ts` already covers `getProcess() === process` and `process.type`. Add the three missing assertions: `process === window.process`, accessor identity with `window.process`, and `window.process.type`. |
| `src-shared/process/process-identifier.spec.ts` | 5 | All five assertions already exist in `test/src-shared/process/process-identifier.spec.em.renderer.ts`. Remove the duplicate Angular file; retain the real renderer suite unchanged. |
| `src-shared/require/proxy-require.spec.ts` | 6 | Move all six null/identity checks to new `test/src-shared/require/proxy-require.spec.em.renderer.ts`; use real `window.require('electron'/'os'/'path')`. |
| `src-shared/require/require-from-main-process.spec.ts` | 4 | Move all four null/identity checks to new `test/src-shared/require/require-from-main-process.spec.em.renderer.ts`; use real `@electron/remote.require` module proxies. |
| `src-shared/log/file-config/log-file-config.spec.ts` | 1 | Move the renderer-only setup rejection to new `test/src-shared/log/log-file-config.spec.em.renderer.ts`. Main-process configuration checks already have a separate suite. |
| `src-shared/environment/environment-detector.spec.ts` | 4 | Replace the four Karma flags with genuine Vitest runner checks and add a native Node/non-Electron invariant. Electron-Mocha suites retain their distinct real runner and isUnitTest checks. No Karma globals or Electron flags are fabricated. |

Expected count after these moves: Angular/Vitest 37, Electron renderer 69
(previously 55 plus 14 new nonduplicate checks), Electron main 117 unchanged.
Seven duplicate Angular assertions are consolidated: five process identifiers
and two accessor checks. Four Karma flags become four Vitest runner checks,
and one native Node/non-Electron invariant is added. This accounts for the new
totals without dropping unique surviving runtime intent.

The Electron-Mocha renderer launcher already enables Node integration and loads
`test/em-renderer-require-in-main-process.js`, which installs the isolated profile
and real remote bridge. New files match the existing `*.spec.em.renderer.ts`
discovery pattern. Do not set a Node process's `type` to `renderer`, counterfeit
`window.require`, or mock these genuine integration assertions.

## Vitest files

Each app spec below currently contains one test. Existing test intent is retained;
platform mocks are permitted only at dependencies outside the asserted unit.

| Spec under `src/app/` | Environment / dependency consideration |
| --- | --- |
| `about-box/about-box.component.spec.ts` | jsdom; remote `app.getVersion()` and OS-link boundary. |
| `app.component.spec.ts` | jsdom; lifecycle services import renderer globals, settings, dialogs, selection and storage. Keep the existing welcome-dialog double; isolate renderer initialization/other external effects. |
| `loaded-files-status-bar/component/loaded-files-status-bar.component.spec.ts` | jsdom; settings-backed service imports storage. |
| `loaded-files-status-bar/service/loaded-files-status-bar.service.spec.ts` | jsdom; current user settings import storage. |
| `loading-folder/dialog/loading-folder-dialog.component.spec.ts` | jsdom; progress service/logging boundary. |
| `loading-folder/progress-reporter/loading-folder-progress-reporter.service.spec.ts` | jsdom; shared progress and logger imports. |
| `map/leaflet-map/leaflet-map-force-render/leaflet-map-force-render.service.spec.ts` | jsdom; service construction; preserve actual map behavior in Playwright. |
| `map/map/map.component.spec.ts` | jsdom; existing dummy Leaflet child and mocked Google Maps child remain. Review those imported children's platform side effects. |
| `no-photos-with-location-data-dialog/no-photos-with-location-data-dialog.component.spec.ts` | jsdom; Angular dialog construction. |
| `settings-dialog/appearance-settings/appearance-settings.component.spec.ts` | jsdom; settings/storage boundary. |
| `settings-dialog/cache-settings/cache-settings.component.spec.ts` | jsdom; `ngOnInit` creates the cache directory, so its filesystem boundary must be isolated. |
| `settings-dialog/date-time-settings/date-time-settings.component.spec.ts` | jsdom; settings and Material select, without the removed legacy animation engine. |
| `settings-dialog/service/restore-settings.service.spec.ts` | jsdom; settings-backed loaded-files service. |
| `settings-dialog/service/settings-changed.service.spec.ts` | jsdom; Angular/RxJS service construction. |
| `shared/model/lat-lng.model.spec.ts` | jsdom/Node-compatible; pure model calculation. |
| `shared/service/photo-data.service.spec.ts` | jsdom; construction imports photo-loading helpers, so avoid triggering filesystem/decoder actions. |
| `thumbnail-generation/service/thumbnail-generation.service.spec.ts` | jsdom; real service with inert IPC, logging and analytics boundaries. Its constructor registers IPC listeners. |
| `thumbnail-generation/status-bar/component/thumbnail-generation-status-bar.component.spec.ts` | jsdom; Angular/status service construction. |
| `thumbnail-generation/status-bar/service/thumbnail-generation-status-bar.service.spec.ts` | jsdom; Angular/RxJS service construction. |
| `welcome-dialog/welcome-dialog.component.spec.ts` | jsdom; remote app version and storage-backed welcome state. |
| `welcome-dialog/welcome-dialog-at-app-launch/welcome-dialog-at-app-launch.service.spec.ts` | jsdom; isolate settings persistence. |

The three platform-independent shared specs remain in the Angular unit target:

| Source | Tests | Intent |
| --- | ---: | --- |
| `src-shared/async-util/async-util.spec.ts` | 2 | Async mapping/filtering results. |
| `src-shared/date-time/now.spec.ts` | 4 | Valid date-time formatting and bounded current-time results. |
| `src-shared/date-time/moment-diff.spec.ts` | 5 | Moment differences, edge cases, input immutability and ISO duration output. |

## Minimal test-only platform boundaries

The coordinating agent owns Vitest setup/configuration. Prefer stable narrow
module doubles or existing TestBed provider doubles rather than faking the
Electron runtime:

- `electron`: inert `ipcRenderer` listener/send methods needed by construction.
- `@electron/remote`: deterministic test `app.getVersion()` and paths, plus
  inert OS shell/dialog operations if imported. This is not evidence that the
  real remote bridge works; the moved renderer assertions provide that evidence.
- `UserDataStorage`: in-memory reads/defaults/writes. Its real module computes
  `RequireFromMainProcess.electron.app.getPath('userData')` at import time, so
  mocking only a later instance provider is insufficient.
- Logging and analytics: inert test-only module boundaries to prevent profile
  writes, IPC or analytics startup. `EnvironmentDetector` deliberately recognizes
  Karma/Electron-Mocha today; do not set Electron-Mocha flags just to make Vitest
  look like that runtime. The final implementation recognizes Vitest directly in EnvironmentDetector
  so the real unit-test guards remain effective without spoofing another runner.
- Cache creation: stub the `fs-extra.ensureDirSync` boundary (and destructive
  cache/OS operations defensively) for component construction. Do not run against
  the owner's actual cache/profile.

The renderer tsconfig currently resolves Node/Electron imports through
`electron-util/renderer-modules/*.cjs`, which call `globalThis.require`. jsdom
does not supply the application's Electron loader. The Vitest test configuration
must avoid these runtime bridges or replace them with test-only aliases before
module evaluation; a package mock that is bypassed by a prebundled bridge is not
sufficient. Keep the production renderer/worker mappings unchanged.

No current Angular spec uses `waitForAsync`, `fakeAsync`, `tick`, Jasmine clock,
or Zone testing helpers. Native async setup already awaits `compileComponents`.
Retain ordinary TestBed teardown and test isolation when changing the runner.

## Other suites retained

- Electron-Mocha main tests: main-process services, filesystem and release logic.
- Electron-Mocha renderer tests: actual renderer/remote identity, EXIF/image and
  shared behavior. They continue to use the installed Electron runtime.
- Playwright: real checkout/packaged application, photos/workers, maps/charts,
  settings/restarts, analytics interception, visual references and release output.
  Vitest component creation checks do not replace these flows.
- Dependency/package/live-reload regressions remain owned by the coordinating
  agent; remove obsolete Karma-specific tests only with the corresponding tool.

## Execution status

The coordinating agent applied all moves after this inventory. Three renderer
files were added, accessor coverage extended, and five duplicate/renderer-only
Angular files retired. Vitest setup/configuration and explicit test boundaries
are documented in VITEST_DESIGN.md. Integrated initial results: Vitest36 and
Electron main117/renderer69 pass; one further native-process guard was then added.
Clean-install/final validation is in progress; consult PLAN.md for current state.
