# Vitest migration CI validation

PR634 remains open and unmerged. Branch codex/remove-deprecation-warnings.
The migration source is e4ed6ba4fef014620a5f998d24972890b38ba1ad.
All-platform CI and native Intel were explicitly authorized earlier in this task.
Preserve intentional Windows push draft publishing; do not merge or add automerge.

## Initial migration runs (snapshot)

| Workflow / trigger | Run | Dispatch/inspection status |
| --- | --- | --- |
| CI on macOS / workflow_dispatch | [41993533367](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41993533367) | Inspect live status |
| CI on macOS / pull_request | [41993376642](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41993376642) | Inspect live status |
| CI on Ubuntu / pull_request | [41993376869](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41993376869) | Inspect live status |
| CI on Windows / pull_request | [41993376783](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41993376783) | Failed: new ASAR test portability |
| CI on macOS / push | [41993366355](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41993366355) | Inspect live status |
| CI on Ubuntu / push | [41993366290](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41993366290) | Inspect live status |
| CI on Windows / push | [41993366467](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41993366467) | Failed: new ASAR test portability |

Inspect live run/job status before continuing; this table is not final acceptance.

## Windows test portability correction

Both Windows runs failed in dependency tests at the same source, jobs127130713012
(PR) and127130694649 (push). Complete logs were read before taking action:

- ASAR listPackage returns native Windows separators. The new hidden-file
  assertion assumed POSIX output; normalize the assertion's display paths.
- The macOS universal archive merger assumes POSIX archive paths and uses lipo.
  The new test invoked it on Windows and failed looking up a leading-backslash
  archive entry. Keep integrity validation on every OS; run actual Mac archive
  merging on its native macOS hosts, including Intel.

These are repository test defects, not runner flakes. No unchanged-code rerun
was requested. Temp's six tests and the builder's archive-entrypoint checks
already pass in both Windows logs. The corrected local dependency suite has19
tests on Mac; other OSes have18 pass and1 explicitly Mac-only skip.

The correction changes tests/documents only. Retain the initial manual Intel
run: application, dependency, release and workflow inputs are byte-identical.
No new native Intel dispatch is needed for only assertion normalization and
splitting the same native-Mac archive assertions. If release/runtime inputs
change, reassess and dispatch Intel for that source.

## Local verification

Clean npm ci/npm ls pass with no deprecated packages or compatibility packages.
Vitest37 with coverage/watch, Electron117/69, live reload, package-runner19,
lint/types pass with zero deprecations. Independent review findings were fixed.
Actual signed/notarized universal packaging passes; codesign/stapler checks pass,
and Gatekeeper/signed-app E2E/smoke are being verified. See PLAN.md and raw optional
logs under .upgrade-artifacts/vitest-migration/.

## Continue

Publish the test correction, record its new run IDs, and handle any failures
immediately. Audit every completed current push/PR job's full log
case-insensitively for deprecation messages plus check annotations; green checks
alone are insufficient. Retain the code-equivalent native Intel evidence above.
Update final evidence and PR body, keep the PR open, and do not merge.
