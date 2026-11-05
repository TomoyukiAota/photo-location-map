# Vitest migration CI validation

PR634 remains open and unmerged, without automerge. Branch:
codex/remove-deprecation-warnings. All-platform CI and native Intel were
explicitly authorized earlier in this task. Intentional Windows push draft
publishing is preserved and succeeded.

## Accepted source and current runs

Migration: e4ed6ba4fef014620a5f998d24972890b38ba1ad.
Windows test-only portability correction: 5ee46302ee2eb08eed5bdc951ba79d021ecc450f.
Current regular runs use the latter source.

| Workflow / trigger | Run | Result |
| --- | --- | --- |
| Ubuntu / pull_request | [41994324085](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41994324085) | Success |
| Ubuntu / push | [41994317284](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41994317284) | Success |
| Windows / pull_request | [41994323912](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41994323912) | Success |
| Windows / push | [41994317302](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41994317302) | Success, including draft publication |
| macOS ARM / push | [41994317244](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41994317244) | Success |
| macOS ARM / pull_request | [41994323804](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41994323804) | Success |
| macOS Intel + ARM / manual | [41993533367](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41993533367) | Both success, release-equivalent e4ed6ba |

All successful test jobs and changes jobs above have complete-log
case-insensitive audits with zero deprecation messages. Check annotations have
no deprecations; ARM jobs have only the GitHub macOS capacity notice, and other
jobs have none. All six regular workflows and both manual test jobs pass.

Each platform test job passes Vitest37, Electron main117/renderer69,
package-runner19, real platform packaging/smoke and14 packaged-app E2E cases.
Dependency checks:19 on current Mac;18 pass plus1 native-Mac-only skip elsewhere.
The retained manual run has the original18-check shape, including the same Mac
integrity and merge assertions before they were split into separate tests.

## Windows test portability correction

Initial migration runs [41993376783](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41993376783)
(PR, job127130713012) and [41993366467](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41993366467)
(push, job127130694649) failed new ASAR tests at the same source. Complete logs
were read before action:

- ASAR listPackage returns native Windows separators. The new hidden-file
  assertion assumed POSIX output; normalize only the assertion's display paths.
- The macOS universal merger assumes POSIX archive paths and uses lipo. The new
  test invoked it on Windows and failed looking up a leading-backslash entry.
  Integrity stays on every OS; actual archive merging runs on native Mac hosts.

These were repository test defects, not runner flakes. No unchanged-code rerun
was requested. Temp's six tests and actual builder entrypoint checks already
passed in both failed logs. The correction preserves extraction, literal names,
unpacked data, integrity and missing-entry rejection coverage.

The correction changes only test/deprecation-warnings/packaging-asar.cjs and
documents. Application, dependency, release and workflow inputs are byte-identical
to the successful manual Intel source. No redundant native dispatch is needed
for this correction or later documentation-only commits. Reassess Intel if any
release/runtime input changes.

## Local verification

Clean npm ci/npm ls pass with no deprecated or compatibility packages.
Vitest37 with coverage/watch, Electron117/69, live reload, package-runner19,
dependency19, lint and type/worker checks pass. Independent review findings were
fixed and re-reviewed. All final local logs have zero deprecation messages.

Actual signed/notarized universal packaging, codesign deep/strict, stapler and
Gatekeeper pass. The signed app passes14 application/visual E2E cases with
unchanged reference images; the website-only case is intentionally skipped.
Isolated-profile DMG smoke passes after60 seconds, including main/renderer logs,
app termination and detach. PLAN.md records one initial E2E teardown timeout,
its successful283ms diagnostic and full successful recheck without app/timeout
changes. The isolated delay's exact trigger remains unproven.

## Documentation-only follow-up

After final evidence is committed, check the resulting head's workflows and
annotations before reporting completion. The code-bearing runs pinned above
remain the release evidence: only task documents change after5ee4630.
Record the final head/check outcome in the PR body, avoiding an endless sequence
of status-only commits. Preserve the open PR and do not merge.

Raw optional logs: .upgrade-artifacts/vitest-migration/ (ignored, not required to
understand or resume this work).
