# Development flow verification

Observed: 2026-11-02.

Story: Open Folder in the development UI calls the actual Electron dialog/IPC
and filesystem photo scan, then renders the same tree, map and date chart.

| Boundary | Result | Evidence |
| --- | --- | --- |
| Development server | Passed | Angular reports `listening on localhost:4200` and `Compiled successfully`; wait-on 9.5.1 accepts its HTTP response. |
| Actual npm start | Passed | Both parallel scripts start; main logs report `Determined DevOrProd: Dev`, HTTP live-reload mode and `Launching the main window.` Ctrl-C stops both owned processes. |
| UI to IPC/data | Passed | The real picker route loads five public fixture files, four with GPS. Only the native picker response is stubbed; parsing/scanning is real. |
| Data to UI | Passed | Tree selection, map marker removal/restoration, chart rendering and native splitter movement pass. Restart retains the original 25/75 splitter reset behavior. |
| Watcher lifecycle | Passed | Hidden Electron fixtures verify clean quit, renderer reload and process relaunch with preserved arguments, without forced termination. |
| Profiles/telemetry | Passed | Test-owned profiles, active SDKs and explicit test traffic interception; no owner profile or real analytics submission. |

The former electron-reload 1.5.0 emits quit but leaves its file watchers alive.
A minimal Electron 45 probe exits normally without that library and needs forced
termination with it. The replacement uses Chokidar 6.0.0's public watch/close
API, closes on will-quit, and retains renderer reload versus entry-file restart.
It is loaded only in development. The real application flow then quits normally.

Development normally opens DevTools. That additional CDP target confused the
initial test controller. The explicit E2E flag keeps DevTools closed for this
automated flow; ordinary development still opens it. The controller selects the
HTTP application page and its actual BrowserWindow.

The development flow is a functional check. Its attempted resized screenshot
matched application geometry/content but differed only in the transient gutter
hover color. Strict original-reference comparisons remain enabled for the
production/file and packaged suites; no reference or tolerance was changed.

Raw ignored logs: dev-server-final.log, dev-flow-functional.log, dev-start.log,
live-reload-exit-probe-fixed.log and chokidar6-lifecycle-final.log. Fixture
logging/analytics are suppressed only in the tiny lifecycle programs; the real
application E2E flow initializes its normal SDKs and logging.
