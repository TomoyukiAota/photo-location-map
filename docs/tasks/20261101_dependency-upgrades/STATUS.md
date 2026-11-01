# Dependency upgrade status

Updated: 2026-11-01 (Asia/Tokyo).

## Authorization and actual state

- **Implementation authorized on 2026-11-01 and started with Sol.**
- On 2026-11-01 the user selected Angular 22 and explicitly accepted macOS 13+
  as the minimum OS. These are resolved choices, not pending release approvals.
- Final target: Angular 22.2.4, CLI/Material 22.2.5, TypeScript 6.0.3, Node
  26.13.0 and its bundled npm 11.20.0, matching Photo Data Viewer; Electron 45.2.1.
- Application baseline: `911dd91bf8de231a40be55f80e0255f053bbc4e3`, branch `main`.
- Initial working tree: clean. This task adds planning/evidence documents only.
- The planning phase changed documents only. Execution now adds profile isolation
  and regression tests with Playwright; application dependency upgrades start at U03.
  No push or publication has occurred.
- Source inspection, official release/registry reads, historical PR review and a
  read-only lockfile audit were performed. No external comments or edits.
- The original app is verified with the new test harness. No upgraded framework
  or Electron checkpoint is verified yet.
- No long-running baseline app or packaging process remains. Local command logs
  are under `.upgrade-artifacts`; test output is in its `e2e-results` directory.

## Read order on resume

1. Repository instructions, then this file.
2. [PLAN.md](./PLAN.md) for scope, gates and recovery procedure.
3. [VERSIONS.md](./VERSIONS.md) for the complete candidate inventory.
4. [evidence/research-summary.json](./evidence/research-summary.json) and
   [evidence/registry-snapshot.json](./evidence/registry-snapshot.json) for dated facts.
5. Inspect actual branch/HEAD/diff, task-related commits, existing processes and
   any newer user instructions. Reconcile records before executing commands.

Active task: U04a. Baseline and Node 22 bridge checks are captured.
Upgrade Angular one major at a time. See BASELINE.md
for the original Karma shutdown issue; do not claim it is a clean pass.
Do not begin with a bulk package update or by running Angular 18 under Node 26.

## Work queue

| ID | State | Next result needed |
| --- | --- | --- |
| Research | Complete | Refresh time-sensitive candidates at implementation start. |
| U00 | Complete | Existing checkout inspected; only the task documents were uncommitted. |
| U01 | Complete | Original install/lint/build and Mac universal package smoke pass; Karma shutdown issue recorded. |
| U02 | Complete | Seven real Electron/website cases, original screenshots, HEIC pixel reference and restart persistence. |
| U03 | Verified locally | Node 22.23.4/npm 10.9.9; clean install, full graph and 7 visual/functional cases pass. CI actions updated; remote CI pending. |
| U04a | In progress | Updating to the final Angular 18 patches and aligned adapters. |
| U04b | Not started | Angular 19 checkpoint. |
| U04c | Not started | Angular 20 checkpoint. |
| U04d | Not started | Angular 21 intermediate checkpoint on the Node 22 bridge. |
| U05 | Not started | Selected Angular 22 + Node 26 / bundled npm destination. |
| U06 | Not started | Electron/packaging checkpoint with accepted macOS 13+ minimum. |
| U07 | Not started | Runtime library groups verified. |
| U08 | Not started | Map/chart/translation updates verified visually. |
| U09 | Not started | Static website candidates verified locally. |
| U10 | Not started | Final graph, audit disposition and version exceptions. |
| U11 | Not started | Full platform/distribution verification. |
| U12 | Not started | One concrete final decision/action packet. |
| U13 | Not authorized | Publication and post-release verification. |

## Resolved decisions

- Angular 22 is selected despite currently being in Active rather than LTS-phase
  support. Use Node 26.13.0 / bundled npm 11.20.0 as the final runtime target.
- macOS 13+ is accepted. The user cited the end of security updates for older OS
  releases. No older-macOS release alternative or repeated approval is needed.
- Angular 21 remains only an intermediate migration checkpoint. Do not spend
  work preparing a separate Angular 21 / Node 24 release candidate.
- Implementation was subsequently authorized on 2026-11-01. Publication remains a final gate.

## Implementation handoff

- On 2026-11-01 the user stated a preference for Sol, rather than Astra, to carry
  out implementation. Preserve that preference when execution is started; no
  model switch or implementation has been performed by this planning task.
- No further user decision is currently required before starting implementation.
  The next user action is to select the intended execution model and request
  implementation. U00 must inspect and preserve these currently uncommitted task
  documents before creating implementation checkpoints.
- The executing agent should read the files in the order above, follow the same
  behavior-preservation gates, and keep STATUS current. The model choice does not
  change acceptance criteria or reopen the resolved Angular/macOS decisions.
- Any genuinely user-only issue discovered during implementation belongs in the
  final packet after independent work has been completed, as described in PLAN.

## Remaining items to prepare, not ask for prematurely

- Any UI/behavior mismatch that cannot be repaired, maintained fork, unresolved
  vulnerability or unavailable signing/device check must include evidence and a
  fallback before being presented at U12.
- Publishing is separate from preparation. Preserve the repository's intentional
  Windows CI draft publication behavior when implementation eventually pushes.

## Per-work-unit record template

Copy this for each meaningful checkpoint; do not overwrite the only record of a
failed approach or a verified baseline.

```text
Task ID / state:
Date/time (Asia/Tokyo):
Branch / HEAD:
Last verified application SHA:
Uncommitted files and purpose:
Node / bundled npm / Electron / embedded Node / framework:
Lockfile hash / format:
Commands and actual results:
Evidence paths / artifact checksums / CI URLs:
Failure classification and retained alternatives:
Processes started (ID, owner, log, stop command):
User-only decision/action, if genuinely needed:
Next smallest unblocked action:
```

No tests have been marked passed based on this planning task. Document consistency
checks are separate from application validation.

Planning validation completed: the inventory covers exactly the manifest's 24
runtime and 78 development dependencies; all local Markdown links resolve; all
JSON evidence parses; recorded hashes of package.json, package-lock.json,
mise.toml, angular.json and electron-builder.json still match the baseline.
`git diff --check` is clean. Only this task-document directory was added.

## Execution checkpoints

- `926a777`: original application with isolated profiles and regression harness.
- Node 22 bridge: clean `npm ci`, `npm ls --all`, all seven visual/functional
  regression cases pass. CI action versions refreshed and the regression command
  added after package tests on all platforms. Remote CI has not run yet.
- Focused negative control fails on the toolbar snapshot as intended.

### Reference stabilization result

The original Angular 18.2.4/Electron 32.0.2 dependency pair was reinstalled from
`926a777`. Dialog snapshots now use the real dialog container (component hosts
use display:contents), and launch waits for Geoman and map tiles. Capture and
all seven visual/functional comparisons pass on the original app. The original
HEIC pixel reference is unchanged. Raw logs: `baseline-stable-*.log`.
Trying Karma clearContext=true did not resolve the old shutdown error; that
configuration experiment was reverted. No check was disabled.
Next: restore the patched-Angular-18 manifest pair from
`.upgrade-artifacts/angular18-patched-manifest/`, reinstall, rebuild and compare
against these original-app references.
