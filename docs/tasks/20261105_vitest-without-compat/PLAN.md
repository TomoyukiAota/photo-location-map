# Angular Vitest migration and compatibility-adapter removal

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
- [ ] Clean installation and local behavioral/release validation complete.
- [ ] Independent review and all-platform CI/log/annotation audit complete.
- [ ] Final evidence and open PR updated; no merge performed.

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

Implementation is in the working tree on the existing open PR634 branch,
with separate migration commits planned. Vitest5.1.0/jsdom30.1.3 and official
unit-test builder are configured; genuine Electron assertions moved without
spoofing renderer identity. Initial Vitest36 and Electron main117/renderer69
pass. A further native-process invariant raises the final Vitest target to37.
Read TEST_ENVIRONMENTS.md and VITEST_DESIGN.md for intent mapping and the JIT/
platform-boundary decisions. EnvironmentDetector now recognizes actual Vitest;
normal application features/UI remain unchanged.

Karma/Jasmine/ng-mocks and both local compatibility packages are uninstalled;
compat/ and Karma-specific configs/tests are deleted. Stable ASAR4 replaces
ASAR3/glob7. Temp uses maintained rimraf6 plus a source-guarded four-call-site
postinstall migration, preserving async/sync APIs and retries. This removes the
adapters, not all upstream source workarounds. PACKAGING.md records the stable
version choice, genuine probes, rejected plain override and remaining patch.
Temp's six integrated checks pass. Archive tests had fixture/error-wording
issues now corrected; rerun the complete18-check dependency suite.

Root npm ci and npm ls --all pass. Installation adds1123 packages with zero
deprecated entries/messages; strict install-script policy and retained native
versions are unchanged. All18 dependency checks pass. Vitest37 passes with v8
coverage; watch initially passes37 and a changed/restored cache component spec
rebuilds and passes twice. Watch stopped intentionally with Ctrl-C. Electron
main117/renderer69, live-reload lifecycle, package-runner19, lint and types pass.
Case-insensitive scans find zero deprecations in all these final local logs.

Independent review caught the retired --code-coverage flag and an existing
native cache path outside the new test isolation. Fixed to --coverage and setup
PLM_TEST_ROOT before app imports, with a cache containment assertion; re-review
found no further defect. Read VITEST_DESIGN.md for the tested boundary model.

Actual npm run package:mac is running in the background, log package-mac.log
(session2202 at this checkpoint). It has built production and reached universal
signing; inspect actual current status before starting another build. Next finish
signed/notarized output verification, packaged visual E2E and isolated DMG smoke.
Publish the reviewed migration as a separate commit on open PR634 and run
all-platform CI plus native Intel. Do not merge. Current source is not yet pushed.
Raw logs: .upgrade-artifacts/vitest-migration/.
