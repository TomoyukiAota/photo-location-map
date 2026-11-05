# Cross-platform CI validation

## Current follow-up

The final edge review found and fixed a development-adapter regression involving
dangling links and disappearing files. Fresh installation, compatibility27,
Angular57 and build/bridge/adapter typing pass locally. Publish the reviewed fix,
dispatch native Intel for its source, and audit all-platform logs/annotations.
The accepted-source runs below predate this adapter fix; preserve their evidence
but do not substitute them for the new source's checks. `EDGE_REVIEW.md` records
the genuine glob7 comparison and the separate pre-existing cache-policy finding
that remains unchanged. Application runtime/signed-bundle source is unchanged.

## Earlier accepted application source

The implementation is complete and all requested platforms pass. The owner
approved branch publication, PR creation, all-platform CI and intentional Windows
draft-release publishing on 2026-11-05 (Asia/Tokyo). Merging is not authorized.

- PR: https://github.com/TomoyukiAota/photo-location-map/pull/634 (open, unmerged).
- Branch: `codex/remove-deprecation-warnings`.
- Accepted code source: `199811285127c54df4e6bcc65706045cfb2bd2e1`.
- Base: `abf208623c60219292310d74a84490f13b3ac59b`.
- Later evidence-only commits change documents, not application, tests,
  dependencies, build/release configuration or CI workflows.

All seven workflows below completed successfully. Their eight test jobs each
pass compatibility25, Angular57, Electron main117, renderer55, package-runner19,
package creation/smoke and packaged-app E2E14. Lint, runtime verification and
live-reload checks also pass. The manual macOS workflow includes native Intel;
regular push/PR workflows intentionally skip that optional job.

Every complete test-job log and every change-detection-job log was scanned
case-insensitively for DEPRECATION prefixes, DeprecationWarning, npm warn deprecated
and other warning/deprecated messages: **zero deprecation warnings**. Check
annotations were inspected too: Windows, Ubuntu, Intel and change-detection
annotations are empty. The three ARM test jobs have only GitHub's informational
runner-capacity/queue notice, with no deprecation annotation.

| Workflow / trigger | Run | Result |
| --- | --- | --- |
| macOS / manual ARM + native Intel | [41958397248](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41958397248) | Success; both logs 0 deprecations |
| macOS / PR | [41958396398](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41958396398) | Success; log 0 deprecations |
| Windows / PR | [41958396459](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41958396459) | Success; log 0 deprecations; publishing skipped as intended |
| Ubuntu / PR | [41958396359](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41958396359) | Success; log 0 deprecations |
| Windows / push | [41958389663](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41958389663) | Success; log 0 deprecations; draft publishing passed |
| macOS / push | [41958389666](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41958389666) | Success; log 0 deprecations |
| Ubuntu / push | [41958389662](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41958389662) | Success; log 0 deprecations |

The Windows push uploaded the expected installer, blockmap and update metadata.
The PR run correctly skipped actual publication. Preserve both existing paths;
the draft release is an intentional CI artifact, not cleanup work.

## Continuation and failure handling

Implementation and platform acceptance are complete. Final documentation updates
can start another PR check cycle; inspect the live PR checks before handing off.
A documents-only update needs no repeated native Intel dispatch: the accepted
code source above and its Intel run remain unchanged. Keep the PR open for the
owner's review; do not merge or add the `automerge` label.

If resuming work, first read `PLAN.md`, `FINAL_REVIEW.md` and repository guidance,
then inspect git status/diff and current GitHub runs. Do not duplicate a running
workflow. Local evidence edits may be newer than the commit; preserve them.

For each failure, read the failed job's log immediately, identify the first
failing step, and compare push/PR runs for the same source. Classify the cause
before retrying. Retry only evidenced environment failures likely to pass; fix
repository defects without masking them or rerunning unchanged code. Any new
code change requires appropriate tests and updated platform evidence. Preserve
intentional Windows publishing. Redispatch native Intel for relevant code or
release-tooling changes as required by AGENTS.md and the approved task scope.

Portable commands available to either coding agent include:

```sh
gh run list --branch codex/remove-deprecation-warnings
gh pr checks 634
gh run view <run-id> --log
gh api repos/TomoyukiAota/photo-location-map/actions/runs/<run-id>/jobs
```

Each job's metadata gives `check_run_url`; fetch its `/annotations` as well as
reading the log. A green conclusion alone does not establish zero warnings.
No environmental reruns were needed during this task.

## Superseded runs and dispositions

### First source: `01c1e7f`

All seven workflows passed, including native Intel and intentional Windows
publishing, but full logs contained Jasmine warnings. The original warning scan
missed uppercase DEPRECATION prefixes. That mistake was corrected; these green
runs are not accepted as zero-warning evidence.

Runs: Windows push 41928188112 / PR 41928273831; Ubuntu push 41928187883 /
PR 41928273961; macOS push 41928188120 / PR 41928273774; manual 41928270873.

The reproduced repository integration defects were Zone.js/testing patches of
Jasmine6 and Angular's Karma plugin forcing classic Jasmine runtime files into
ESM. Replace the five async wrappers with native async setup and use Karma's
supported file-list hook for framework loading; retain base zone.js and compiled
ESM specs. Ubuntu also used a retired Node20 Xvfb action; replace it with the
same native Xvfb command. See `JASMINE.md`.

### Jasmine follow-up: `b9de3d0`

Both Windows runs failed in the new lifecycle regression with the same first
error: `Could not find test entrypoint file.` Jobs 127009670619 (PR run 41955595086)
and 127009643419 (push run 41955587476) were read and classified as a test defect.
The fixture used native backslashes, whereas the real Angular builder supplies
a POSIX-normalized `/test_main.js` pattern. Fix that fixture; do not rerun the
unchanged source as an environmental retry. The superseded manual Mac
run 41955610483 was cancelled after its unit checks passed to free the runner for
the corrected source. Prior Ubuntu follow-up logs already had zero deprecations.

### Fixture correction: `e10e1b9`

All seven workflows passed, including native Intel. Every non-Windows complete
log had zero deprecations. Both Windows logs still contained four DEP0190
warnings: Electron-Mocha's launcher and detached cleanup each used an unnecessary
shell for both main/renderer suites. Classify this as an upstream development-tool
defect; unchanged reruns would not fix it. The pinned two-site source-guarded
postinstall workaround and four lifecycle/source tests resolve it; see
`ELECTRON_MOCHA.md`. All accepted-source Windows logs above confirm zero DEP0190.

Runs: Ubuntu PR 41956182026 / push 41956175993; Windows PR 41956182040 /
push 41956176148; macOS PR 41956182034 / push 41956176212; manual 41956175246.
