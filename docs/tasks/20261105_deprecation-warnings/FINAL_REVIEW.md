# Deprecation cleanup review

## Result

The complete dependency tree contains zero deprecated packages. A clean `npm ci`
emits zero deprecation warnings; `npm ls --all` exits zero. Reproduced npm-profile,
Angular builder/API, Sass, exifr FileHandle, and macOS image-mount deprecations
have been addressed without suppressing warnings or changing registry metadata.
CommonJS optimization notices remain visible and are not deprecation warnings.

No feature or UI changes were necessary. Original screenshot references and
tolerances were retained. Every component's generated Sass CSS is byte-identical;
shared CSS differs only in whitespace and identical keyframe deduplication.

## Implementation and review boundaries

- Official Angular application/dev-server/Karma builders replace webpack.
  Typed Electron bridges retain Node access in renderers and workers; lazy
  ECharts shares its production core with the existing v5 theme. Map configuration
  readiness is awaited explicitly before bootstrap. Dev/JIT remains supported.
- Unused legacy animation providers and dynamic bootstrap dependencies are
  removed. Native cache cleanup retains metadata-file and empty-root behavior.
- npm-run-all2's supported Node runner preserves the npm development profile
  without forwarding deprecated package-config CLI flags.
- The exifr adapter owns chunked readers through normal results, early returns,
  parser failures, and initial I/O failures. It preserves original metadata,
  thumbnail bytes, memory bounds, and parsing errors.
- Scoped compatible dependency replacements and two private development adapters
  remove obsolete transitive implementations. The adapters cover only inspected
  Karma/ASAR/Temp interfaces, reject unknown option/API drift, and use supported
  glob/native filesystem APIs. Their support contracts and removal criteria are
  in `compat/`. They are not shipped in the application.
- Local adapters are packed, not linked. Installation tests check actual consumer
  identities, current source hashes, physical directories, and lock entries.
  No unrelated registry package version changed during the adapter migration;
  existing native packages and their install-script policy were retained.
- Package smoke tests use supported disk-image tools when detected, with the
  existing legacy fallback on older tools. Real attachment failures still fail.
- Jasmine runs as classic framework code with native async setup; obsolete
  Zone testing patches and the Ubuntu Node20 action were replaced. Electron-Mocha
  receives a version/source-guarded two-site executable-spawn patch in postinstall
  to fix Windows DEP0190. See `JASMINE.md` and `ELECTRON_MOCHA.md`.

Independent reviews covered dependency APIs, bootstrap/JIT, Electron bridges,
Sass equivalence, resource ownership, callback errors, portable installation,
POSIX escapes, and Windows separators. Findings were addressed and tested.

## Local validation

| Check | Result |
| --- | --- |
| Clean installation / locked deprecated entries | PASS / 0 |
| Complete npm dependency validation | PASS |
| Dependency compatibility and packed-source checks | PASS, 27 tests (including the final edge review) |
| Lint / bridge+adapter checkJs / worker typing | PASS |
| Angular unit tests | PASS, 57 |
| Electron main / renderer unit tests | PASS, 117 / 55; no DEP0137 |
| Development watcher lifecycle | PASS |
| Package-runner tests | PASS, 19 |
| Dev/JIT visual startup and settings | PASS |
| Full checkout visual E2E | PASS, 15 |
| Vite HTTP-origin visual/photo/map/chart E2E | PASS, 3 |
| Signed/notarized universal macOS package | PASS |
| Deep/strict code signature / stapled ticket / Gatekeeper | PASS; Notarized Developer ID |
| Signed-bundle visual E2E | PASS, 14; website case intentionally skipped |
| Final DMG smoke with supported mount/eject commands | PASS, 60 seconds; logs, clean exit/eject, zero deprecations |

Both arm64 and x86_64 slices are present. This host rejects x64 execution with
`Bad CPU type in executable`; no Rosetta/system installation was attempted.
Windows/Linux/native Intel were verified separately by the final-source CI
runs recorded in `CI_STATUS.md`.

## Handoff and publication

Read `PLAN.md` for the current checkpoint and exact continuation steps.
The owner authorized branch publication, PR creation, and cross-platform CI on
2026-11-05 (JST). PR #634 is open. Source commits and current run evidence are
tracked in `CI_STATUS.md`; signed-bundle validation above predates the final
development-tool-only fixes and still covers the unchanged application runtime.

All-platform warning verification is complete for source `1998112`. A push
deliberately triggers Windows draft-release publishing under repository policy;
retain that workflow. This publication is authorized; merging is not. Review
the manual Intel policy in `AGENTS.md` before merging relevant release changes.

The first published CI source passed on every requested platform, but log review
found Jasmine warnings missed by the original case-sensitive scan. The final
test-only fix and native Ubuntu display command are documented in JASMINE.md.
Subsequent source `e10e1b9` also passed all platforms, but full Windows logs
exposed four Electron-Mocha DEP0190 warnings per job. The guarded follow-up
patch passes fresh installation, compatibility25, script lint and local
main117/renderer55 with zero deprecations. All seven final-source workflows (eight test jobs) pass, including native Intel,
and every complete test/change-detection log contains zero deprecation messages.
Check annotations contain no deprecations; ARM has only GitHub's capacity notice.
`CI_STATUS.md` records exact runs and superseded failure dispositions. Later
commits publish evidence only; confirm the live PR checks before owner handoff.
The PR remains open and unmerged. No feature/UI decision is needed to complete
warning cleanup. `EDGE_REVIEW.md` records the subsequently verified dangling-link
regression fix (27 compatibility checks and Angular57 pass locally) requiring
fresh all-platform CI. It also records a pre-existing cache-policy weakness,
left unchanged and reserved for a separate owner decision. Read the current
continuation at the end of `PLAN.md` before relying on the earlier source result.
