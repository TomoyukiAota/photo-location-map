# Angular Vitest migration and compatibility-adapter removal

> **Update, 2026-11-07:** the npm `overrides`, `script/patch-temp.js` and
> `script/patch-electron-mocha.js` that this migration kept have been removed,
> and the deprecation warnings they removed appear again. See the
> [override removal record](../20261107_remove-dependency-overrides/STATUS.md).

## Objective and boundaries

Migrate Angular unit tests to the current Angular CLI default (Vitest and jsdom),
retain genuine Electron/Node integration coverage in the existing Electron-Mocha
and Playwright suites, and aim to remove compat/ through maintained upstream
APIs/dependencies. Preserve all application features, UI, screenshots, release
formats, signing/notarization, auto-update and intentional Windows CI publishing.
Do not fake Electron integration assertions merely to make jsdom tests pass.
Do not hide warnings or edit deprecation metadata. Avoid beta release tooling,
unrelated dependency upgrades, or unreviewed major jumps. Ask the owner only if
an unavoidable feature/UI change or a material unresolved tradeoff remains.
A clean install must remain free of deprecated packages and warnings.

All repository content is English and public-safe. Read AGENTS.md, README.md,
docs/CONTRIBUTING.md and relevant dependency/CI guides before continuing. Do not
create CLAUDE.md or use machine-local agent memory as durable documentation.

## Starting point

- Date: 2026-11-05 (Asia/Tokyo).
- Checkout: current repository, codex/remove-deprecation-warnings.
- Starting HEAD: 0671b3f9a4a3b39d6f6b0ab23cec167cedc41467; clean worktree.
- Prior cleanup and all-platform evidence: ../20261105_deprecation-warnings/.
- Toolchain: mise exec -- (Node26.13.0 / bundled npm11.20.0).
- Current suites: Angular57; Electron main117 / renderer55; package-runner19;
  compatibility27; packaged app E2E14. Preserve test intent when regrouping.
- Existing adapters: glob serves Karma and ASAR3; rimraf serves Karma and Temp0.9
  in Windows installer tooling. Removing Karma alone cannot remove both adapters.
- Existing Angular builder is application; its official unit-test builder is
  installed and defaults to Vitest. Angular documents existing-project migration
  as experimental; review generated changes and custom environment behavior.
- Existing publication/all-platform CI authorization persists. Keep PRs open;
  merging is not authorized. Use separate commits for this migration.
- Optional raw logs/probes: .upgrade-artifacts/vitest-migration/ (gitignored).
  Record decisions/outcomes here so another clone or coding agent can resume.

## Execution plan (written before migration investigation/implementation)

1. Inventory test intent and environments. Map each Angular/shared test to jsdom,
   Node or genuine Electron. Identify remote/import-time filesystem/app calls,
   Zone usage, Jasmine syntax, global setup, assets/styles and build targets.
2. Research maintained packaging paths independently. Inspect exact ASAR/Temp
   consumer APIs and stable supported upgrades; test candidate dependency graphs
   outside the root install first. Prefer deleting obsolete paths or supported
   upstream replacements over another repository-owned legacy adapter. Record
   what prevents complete compat removal; do not disguise a copied adapter.
3. Implement official Angular unit-test configuration and minimal test setup.
   Move Electron-specific assertions to the proper existing suite, retaining
   real behavior and count/intent mapping. Remove Karma/Jasmine packages, config,
   plugins and no-longer-applicable regressions. Keep application runtime intact.
4. Integrate the reviewed packaging solution, manifest and lockfile together.
   Remove compat/ and scoped overrides only when no consumer needs them. Inspect
   install scripts and maintain strict allowScripts policy. Keep unrelated
   registry versions/native dependencies stable; clean-install before acceptance.
5. Verify fresh npm ci/npm ls, deprecated lock entries and warning output; Vitest
   run/watch/coverage where applicable, Electron suites, lint/types/workers,
   development reload, visual/application E2E, release packaging and actual signed/
   notarized universal Mac build if release tooling changes. Run all-platform CI
   and native Intel for relevant release changes. Classify failures before retries.
6. Independently review the final diff, record warning counts/test outcomes and
   exact remaining actions, publish the branch/PR update and inspect full CI logs
   plus annotations. Keep the PR unmerged. If stable supported paths cannot remove
   all adapters, document the concrete alternatives for the owner's decision.

## Checkpoints

- [x] Read repository guidance and write a durable plan before migration work.
- [x] Test/environment inventory and coverage-preservation map complete.
- [x] Maintained packaging dependency path assessed with isolated probes.
- [x] Vitest migration implemented, real Electron checks preserved.
- [x] compat/ removed, or exact supported blocker/alternatives documented.
- [x] Clean installation and local behavioral/release validation complete.
- [x] Independent review and all-platform CI/log/annotation audit complete.
- [x] Final evidence and open PR updated; no merge performed.

## Resume procedure

1. Read this plan and AGENTS.md. Inspect git status, branch, log and diff; preserve
   unrelated owner changes and uncommitted evidence newer than this document.
2. Read the latest status below and companion investigation files. Check running
   processes/CI before duplicating installs, builds or dispatches. Only the
   coordinating agent mutates root package.json/lock/node_modules.
3. Continue the first incomplete checkpoint. After each meaningful result, update
   decisions, exact commands/outcomes and next action. Parallel agents may read
   or own disjoint files; do not rely on their sessions surviving a handoff.
4. Use mise exec --. After npm ci, run npm run verify:electron serially before
   concurrent Electron consumers to avoid racing the lazy binary extraction.
5. Read a failed job log before retrying. Compare same-source push/PR runs; retry
   only evidenced runner failures likely to pass. Preserve Windows draft releases.
   A green check alone is not proof of zero deprecations: audit complete logs
   case-insensitively and check annotations. Never add automerge or merge a PR.
6. Preserve any unresolved owner decision and its exact evidence here before
   stopping. Do not silently change features/UI to fit a test environment.

## Latest status

Migration implementation is committed as e4ed6ba, with the Windows test-only
portability correction in 5ee4630, on the existing open PR634 branch. Vitest5.1.0,
jsdom30.1.3 and the official unit-test builder replace Karma/Jasmine/ng-mocks.
Final Vitest37 and Electron main117/renderer69 pass; genuine Electron assertions
are retained without spoofing renderer identity. Read TEST_ENVIRONMENTS.md and
VITEST_DESIGN.md for intent mapping and the dedicated JIT test configuration.
EnvironmentDetector recognizes actual Vitest; application features/UI remain
unchanged. Original visual references and tolerances are unchanged.

Both repository-owned compatibility packages and compat/ are deleted. Stable
ASAR4 uses maintained glob. Temp uses maintained rimraf6 plus a narrow guarded
postinstall call-site migration, preserving async/sync cleanup and retries.
This removes the legacy adapters; it does not remove every upstream workaround.
PACKAGING.md records the stable release-tool choice, genuine consumer probes,
rejected plain override and remaining Temp patch. The existing Electron-Mocha
Windows spawn patch remains. Neither patch nor Temp ships in the app.

Root npm ci and npm ls --all pass. Installation adds1123 packages with zero
deprecated entries/messages; strict install-script policy and retained native
versions are unchanged. Dependency19 passes on Mac; Windows/Linux have18 pass
and1 explicitly Mac-only merge skip. Vitest37 passes with v8 coverage; watch
passes37, then rebuilds and passes the changed/restored cache spec twice before
intentional Ctrl-C. Electron main117/renderer69, live reload, package-runner19,
lint, and type/worker checks pass. Complete final local logs contain zero
deprecation messages in case-insensitive scans.

Independent review caught the retired --code-coverage flag and a native cache
path outside the new test isolation. Fixed to --coverage and PLM_TEST_ROOT set
before app imports, with a cache containment assertion. Re-review found no
further defect. A separate review of 5ee4630 confirmed the Windows assertion
normalization and native Mac merge coverage preserve meaningful checks.

Actual npm run package:mac passed, including signing and Apple notarization.
codesign deep/strict, stapler and Gatekeeper exit0 checks pass. Artifact audit
found no test/compatibility packages or source patches shipped in the app.
The signed app passes14 visual/application E2E cases; the website-only case is
intentionally skipped. An isolated-profile DMG smoke passes after60 seconds,
with both main/renderer logs, graceful termination and successful detach.

Preserve the first signed-app E2E failure evidence:13 cases passed and the
normal-path HEIC viewer passed its assertions but app.close exceeded the
existing10-second teardown bound. A traced single-case diagnostic subsequently
exited0 and closed in283ms; the complete recheck passed14. No app/quit change,
timeout relaxation or visual reference update was made. The exact trigger of
that isolated teardown delay is unproven; investigate before further retries if
it recurs. Raw logs: signed-app-e2e.log, heic-shutdown-diagnostic.log and
signed-app-e2e-final.log under the optional ignored artifact directory.

Both initial Windows runs failed new ASAR test portability assumptions. Their
complete logs were classified before changing tests, with no unchanged reruns.
Fix5ee4630 normalizes listing separators and separates all-platform integrity
from native Mac universal merge. All six current Windows/Ubuntu/Mac push and PR workflows pass. Complete logs
and check annotations have zero deprecations; only GitHub ARM capacity notices
remain. Native Intel and manual ARM also pass on e4ed6ba: release,
runtime, dependency and workflow inputs are byte-identical in 5ee4630 (only the
archive test and documents changed). Do not dispatch redundant Intel jobs for
only these assertion/document changes.

Implementation, independent review and local/all-platform release validation
are complete. PR634 records the result and remaining narrow upstream patches.
Commit/push this final evidence, then follow the documentation-only head checks
to completion; record their outcome in the PR body without another status-only
commit. If resuming, inspect that final head before repeating any work. No
unresolved owner decision requires a feature/UI change. Keep the PR open; do
not merge.
Raw optional logs/probes: .upgrade-artifacts/vitest-migration/.
