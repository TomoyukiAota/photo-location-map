# Cross-platform CI validation

The owner authorized branch publication, PR creation, and all-platform CI on
2026-11-05 (Asia/Tokyo). Merging is not authorized.

- PR: https://github.com/TomoyukiAota/photo-location-map/pull/634
- Branch: `codex/remove-deprecation-warnings`.
- Latest published source: `e10e1b98446a26e11f09e45acf0330dcb00063c9`;
  executable-spawn follow-up ready for publication (see the last section).
- Base: `abf208623c60219292310d74a84490f13b3ac59b`.
- Current local validation: compatibility25, Angular57, main117 and renderer55.

## First source runs (superseded)

| Platform / trigger | Run | Current result |
| --- | --- | --- |
| Windows push | [41928188112](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41928188112) | Success; follow-up required |
| Windows PR | [41928273831](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41928273831) | Success; follow-up required |
| Ubuntu push | [41928187883](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41928187883) | Success; follow-up required |
| Ubuntu PR | [41928273961](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41928273961) | Success; follow-up required |
| Apple Silicon push | [41928188120](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41928188120) | Success; follow-up required |
| Apple Silicon PR | [41928273774](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41928273774) | Success; follow-up required |
| Manual Apple Silicon + native Intel | [41928270873](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41928270873) | Success; follow-up required |

All runs above test the same source head. The manual run was dispatched with
`gh workflow run ci-on-mac.yml --ref codex/remove-deprecation-warnings` and adds
the native Intel job. The regular workflows intentionally skip that job.
Windows push publishing is deliberate and authorized; retain its draft release.

## Resume and failure handling

1. Inspect current runs/jobs, including push and PR triggers. Do not rely on this
   snapshot alone and do not dispatch duplicate workflows.
2. Handle each failure immediately: read its job log, identify the first failing
   step, compare the other trigger for the same commit, and classify the cause.
   Retry only evidenced environment failures likely to pass; report any code
   defect and fix it without masking or repeatedly rerunning the failure.
3. If code changes, push a new commit, update the source/run table here, and
   dispatch the native Intel workflow for that new source. Keep prior failure
   evidence and dispositions below.
4. Verify every requested platform and trigger completes successfully, then
   update the PR description and durable plan. Keep the PR open for owner review;
   do not add the `automerge` label or merge it.

## Findings from the first source run

Ubuntu push and PR completed successfully, including packaged AppImage E2E
(14 tests), but their logs exposed residual Jasmine deprecations. These are
repository integration defects, not environmental failures or reasons to rerun
unchanged code:

- Zone.js/testing monkey-patches Jasmine 6 environment methods. The suite only
  uses five `waitForAsync` setup wrappers and no fakeAsync/tick/clock API; replace
  those wrappers with native async setup and retain the base zone.js polyfill.
- Angular's Karma plugin forces Jasmine's classic browser files to ESM, which
  Jasmine 6 explicitly rejects. A supported Karma file-list hook is being tested
  to preserve classic framework loading while app/spec files remain ESM.
- Ubuntu's xvfb-action v1.7 declares Node20 and receives a GitHub deprecation
  annotation. Replace its six wrappers with the same native xvfb-run command;
  install its existing xvfb/x11-xserver-utils prerequisites once per job.

The original run remains useful platform evidence. Do not accept a green check
as proof of zero warnings. A new source commit and all-platform runs are required
after fixing these findings. No environmental retry has been requested.

## Jasmine follow-up

The first seven runs all completed successfully, including native Intel Mac and
Windows publishing. They are superseded for the zero-warning claim because the
Jasmine messages were not captured by the original case-sensitive warning scan.
The follow-up removes their causes, adds a real Karma file-refresh regression,
and replaces the obsolete Ubuntu action with the same native Xvfb commands.
Local compatibility/lifecycle checks (21), lint, and Angular tests (57) pass; a
case-insensitive scan including DEPRECATION prefixes finds zero warning messages.
Next: push the follow-up and redispatch native Intel for its source. Record the
new run IDs below and inspect logs/annotations as well as conclusions.

## Final-source runs

Source `b9de3d041dc983b51abc9b6e4f814776c86b00cc` is pushed and the PR is updated.
All runs below belong to that source. Native Intel was dispatched explicitly.

| Workflow / trigger | Run | Result |
| --- | --- | --- |
| CI on macOS / workflow_dispatch | [41955610483](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41955610483) | In progress |
| CI on Windows / pull_request | [41955595086](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41955595086) | In progress |
| CI on macOS / pull_request | [41955594840](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41955594840) | In progress |
| CI on Ubuntu / pull_request | [41955594772](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41955594772) | In progress |
| CI on Ubuntu / push | [41955587505](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41955587505) | In progress |
| CI on macOS / push | [41955587529](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41955587529) | In progress |
| CI on Windows / push | [41955587476](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41955587476) | In progress |

The owner-approved monitoring phase is active. Inspect each completed job's log
with a case-insensitive deprecation scan; a green conclusion alone is not enough.
No merging is authorized. No environmental reruns have been needed so far.

### Windows fixture correction

Both Windows runs for `b9de3d0` failed in the new Karma lifecycle regression,
jobs `127009670619` (PR) and `127009643419` (push), with the same first error:
`Could not find test entrypoint file.` The real Angular polyfill plugin matches
the builder's POSIX-normalized `/test_main.js` pattern. The synthetic fixture
used native Windows backslashes instead. This is a test defect, not a runner
failure; unchanged reruns were not requested. Normalize the fixture pattern just
as Angular does, retaining actual native filesystem paths when creating files.
All 21 local compatibility tests pass after correction. Republish and repeat
the final-source checks; the prior manual Mac run is superseded after its unit
checks passed, so cancel it before dispatching Intel for the corrected source.

## Corrected final source

Source `e10e1b98446a26e11f09e45acf0330dcb00063c9` is now pushed. The prior manual
run was cancelled as superseded, and the corrected source was dispatched for
native Intel. No unchanged-code rerun was used to conceal the Windows failure.

| Workflow / trigger | Run | Result |
| --- | --- | --- |
| CI on Ubuntu / pull_request | [41956182026](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41956182026) | In progress |
| CI on Windows / pull_request | [41956182040](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41956182040) | In progress |
| CI on macOS / pull_request | [41956182034](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41956182034) | In progress |
| CI on Ubuntu / push | [41956175993](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41956175993) | In progress |
| CI on Windows / push | [41956176148](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41956176148) | In progress |
| CI on macOS / push | [41956176212](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41956176212) | In progress |
| CI on macOS / workflow_dispatch | [41956175246](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41956175246) | In progress |

The Jasmine-remediated Ubuntu push on prior source `b9de3d0` also completed with
21 compatibility tests, Angular57, main117, renderer55, package-runner19, and
packaged AppImage E2E14 all passing; its complete job log has zero deprecation
messages under the corrected case-insensitive scan. Final acceptance still
requires the corrected source's Windows and all other requested runs.

### Electron-Mocha follow-up (current work)

The corrected Ubuntu push/PR logs each contain zero deprecation messages and
have no check annotations. Corrected Windows push/PR both pass all tests and
the push successfully publishes the intended draft assets, but each complete
log exposes four DEP0190 warnings from Electron-Mocha's executable spawn calls.
Classify this as an upstream development-tool defect, not a runner failure; do
not rerun the unchanged source to conceal it. Mac push/manual ARM logs scanned
so far have zero deprecations. Prior-source platform runs remain historical
evidence; a new source commit is required for final acceptance.

All seven `e10e1b9` workflows now completed successfully, including native Intel.
Every non-Windows job's complete log has zero deprecations; both Windows logs
have the four warnings described above. This is not final zero-warning acceptance.

The guarded two-site patch and four installed-source/lifecycle tests are ready;
see `ELECTRON_MOCHA.md`. Fresh installation, compatibility25, script lint, and
serialized main117/renderer55 recheck pass with zero deprecations. Commit/push and dispatch
native Intel for the new source. Update the final run table and inspect complete
job logs case-insensitively plus check annotations. Keep the PR open, unmerged.
