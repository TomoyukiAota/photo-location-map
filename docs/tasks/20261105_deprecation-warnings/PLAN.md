# Remove deprecation warnings

## Objective and boundaries

Remove deprecation warnings from a clean dependency installation, development
startup, production build, tests, and packaging without changing application
features or UI. Preserve Electron main/renderer behavior, Node access, workers,
photo decoding, maps, translations, analytics, development reload, and releases.
Do not hide warnings with log levels, filters, `--no-deprecation`, or edited
registry metadata. Prefer supported replacements and compatible upstream fixes.
Ask the owner before a necessary feature or UI change. Collect other unresolved
decisions for the final report while continuing independent work.

This is the durable execution and handoff document for any coding agent. Read
`AGENTS.md`, `README.md`, `docs/CONTRIBUTING.md`, and the dependency/CI guides
before continuing. Keep all repository content in English and free of private
sources, links, credentials, screenshots, and personal data.

## Starting point

- Date: 2026-11-05 (Asia/Tokyo).
- Checkout: current repository; branch `codex/remove-deprecation-warnings`.
- Base: `abf208623c60219292310d74a84490f13b3ac59b`.
- Initial working tree: clean.
- Toolchain: use `mise exec --` (Node 26.13.0 and its bundled npm 11.20.0).
- Requested warning surfaces: `npm ci` and `npm start`, including deprecated
  Angular webpack builders and packages, legacy Angular bootstrap/animations,
  deprecated transitive npm packages, and npm's custom `devOrProd` config.
- Raw local logs: `.upgrade-artifacts/deprecation-warnings/` (gitignored).
  Carry durable findings and command outcomes into this document; raw logs are
  optional local evidence, not required to resume on another machine.

## Execution plan (written before investigation/implementation)

1. **Baseline and inventory.** Capture clean installation, dependency paths for
   each deprecated package, development startup, production build, and relevant
   test warnings. Record exact messages, owners, replacement options, and risk.
   Separate deprecation warnings from unrelated informational/security messages.
2. **Design compatible fixes.** Check primary upstream documentation/source for
   Angular's current build/bootstrap/animation replacements and each dependency
   API that changes. Identify bundling, Electron, and release constraints. Avoid
   speculative major upgrades or incompatible overrides to silence warnings.
3. **Implement in resumable groups.** Migrate build tooling while preserving
   emitted paths and Electron runtime behavior; replace deprecated app/test APIs;
   fix npm script configuration; remove deprecated dependency paths through
   compatible replacements. Record decisions, rejected approaches, and remaining
   warnings after each group. Keep package manifest/lockfile changes coordinated.
4. **Verify behavior and warning removal.** Re-run a clean install, lint, type
   checks, production/development builds, unit tests, live-reload lifecycle,
   application E2E, and package creation/smoke tests appropriate to the changes.
   Use the existing photo/map regressions to detect behavior changes. If release
   tooling or native dependencies change, also perform signed/notarized universal
   macOS packaging; Intel CI is required before merging where `AGENTS.md` applies.
   Read/classify failures before retries. Never run a publishing command locally.
5. **Review and handoff.** Review the complete diff and perform an independent
   review. Record final warning counts, test outcomes, residual upstream blockers,
   exact next actions, and any owner decisions. Do not claim full cleanup while
   deprecated packages or reproduced warnings remain. Publishing artifacts needs
   separate approval; do not create external comments without instructions.

## Checkpoints

- [x] Read repository guidance and requested warning examples.
- [x] Create this plan before beginning investigation or implementation.
- [x] Baseline complete and warning inventory recorded.
- [x] Compatible replacement design recorded.
- [x] Build tooling migration implemented and validated.
- [x] Deprecated app/test APIs replaced and validated.
- [x] npm configuration and dependency paths resolved.
- [x] Final clean installation and full local regression checks complete.
- [x] Independent review addressed and final report recorded.

## Warning inventory

| Surface | Reproduced warning | Owner / planned resolution |
| --- | --- | --- |
| Clean install | 12 deprecated package/version pairs: inflight 1.0.6; rimraf 2.6.3, 2.7.1, 3.0.2; glob 7.2.3, 10.5.0; lodash.isequal 4.5.0; boolean 3.2.0; Angular animations/platform-browser-dynamic 22.2.4; Angular build-angular/ngtools-webpack 22.2.5 | See `DEPENDENCIES.md`; remove direct deprecated paths and assess scoped compatible replacements. |
| `npm start` | Unknown CLI config `devOrProd` (twice), followed by unknown env config `devorprod` | npm-run-all2 forwards package config as unsupported npm CLI flags. Use its supported Node script runner mode, retaining the inherited npm package config/profile. |
| `npm start` | Deprecated webpack dev-server builder | Migrate to official `@angular/build` application/dev-server/Karma builders; see `BUILD.md` when available. |
| `npm start` | Sass `@import`, global builtins and `darken()` | Supported Sass modules and exact HSL adjustment; see `SASS.md`. |
| Electron renderer tests | DEP0137: FileHandle closed by garbage collection | Investigate exifr chunked reader early-return/error cleanup; preserve metadata extraction and memory behavior. |
| macOS 27 package smoke | `hdiutil attach` deprecated; use `diskutil image attach` | Discovered during final package test; migrate own smoke-test mounting with compatible capability detection and cleanup. |

Baseline install succeeded: 1,628 packages added. `npm start` built and launched
the Electron application; the owned watcher/app process was stopped with Ctrl-C.
Electron unit suites passed (106 main tests and 55 renderer tests); renderer
emitted the FileHandle warning above.
Other baseline messages include CommonJS optimization notices and npm audit
results. Those are not deprecation warnings and are not grounds for unrelated
feature/security changes in this task.

## Decisions and implementation record

- Parallel work is divided into build tooling (`BUILD.md`), Angular APIs and
  Sass (`ANGULAR_APIS.md`, `SASS.md`), and dependency compatibility research
  (`DEPENDENCIES.md`). The coordinating agent owns manifest/lock mutations and
  integrated validation. Do not depend on child agents existing after a resume.
- Enable `npm-run-all2.nodeRun` in package.json. The installed runner's
  `run-task.js` uses Node's `--run` without constructing package-config CLI flags.
  The outer npm command still supplies `npm_package_config_devOrProd=Dev`; nested
  scripts inherit it, and directly launched packaged apps still default to Prod.
  No source/profile migration is needed. No aggregated script currently depends
  on npm pre/post lifecycle hooks. Reference:
  [npm-run-all2](https://github.com/bcomnes/npm-run-all2).
- Replace the sole `delete-empty.sync` cache cleanup call with native fs
  traversal/removal. Preserve recursive empty-directory cleanup, OS metadata
  suffix handling (case insensitive), and possible cache-root removal. Do not
  traverse directory symlinks outside the cache. Focused regression tests cover
  metadata-only trees, retained thumbnails/logs, external links, and absent roots.
- Removed direct delete-empty/type dependencies and deprecated Angular packages;
  replace custom-webpack/build-angular/webpack with `@angular/build` 22.2.5.
  Lockfile regeneration and integrated build validation passed.
- Applied narrowly scoped replacements: Mocha's glob 10 → 13.0.6 (same APIs used
  by Mocha 11), updater's two-argument comparator → lodash.isequalwith 4.4.0,
  and downloader's global-agent 3 → 4.1.6. All three behavioral compatibility
  checks passed against installed replacements. Added `test:dependency-compat`
  to `test:all` so dependency upgrades recheck these assumptions. See
  `DEPENDENCIES.md` for primary source/API evidence and rejected blanket changes.
- At the first validated checkpoint, the lockfile still had four deprecated pairs: glob 7.2.3,
  inflight 1.0.6, rimraf 3.0.2 (Karma), and rimraf 2.6.3 (temp/Squirrel).
  That intermediate checkpoint was not a zero-warning installation. Karma's Glob constructor,
  ASAR's promisified callback glob, and temp's callback rimraf prevent simple
  modern-version overrides. Stable release-tooling constraints remain in force.
- The final exifr adapter is tracked `electron-util/managed-exifr.cjs`, checked
  with JSDoc/TypeScript. This avoids a new compilation prerequisite for standalone
  tests and preserves the existing remote import name. See `EXIFR.md` for the
  confirmed resource-leak paths, cleanup guarantees, and explicit upstream limit.
- Add explicit `typecheck:worker` before Angular builds: the application builder
  does not retain webpack's worker type-checking behavior automatically.
- Continued the four residual dependency paths with bounded repository-owned
  adapters in `compat/glob` and `compat/rimraf`. They translate only inspected
  Karma/ASAR/Temp APIs onto maintained glob 13 and native `fs.rm`; no published
  deprecation metadata or warning output is altered. See `DEPENDENCIES.md` and
  each package README for exact support limits and removal criteria.
- Isolated fresh installation and ten actual-consumer checks passed with zero
  deprecated entries. `install-links=true`, private file-package dependencies,
  and scoped `$` override references are required for portable packed copies.
  A moved-copy clean-install check also passed. Existing-lock integration retained
  stale modules, however; installed-source identity tests exposed this instead
  of allowing a false zero-warning result. Full-manifest lock migration and integrated acceptance subsequently passed;
  see the latest status. Run `npm ci` after adapter edits.

## Validation record

| Command | Outcome |
| --- | --- |
| `mise exec -- npm ci` | PASS, baseline 12 deprecated package/version pairs. |
| `mise exec -- npm start` | PASS startup, warnings inventoried above; stopped owned process. |
| `mise exec -- npm run test:unit:em:both` | PASS, npm config warnings gone with nodeRun; DEP0137 reproduced. |
| Independent Sass before/after compilation | PASS, exact component CSS preserved; see `SASS.md`. |
| `mise exec -- node --test test/deprecation-warnings/dependency-compat.cjs` | PASS, 3 tests against installed scoped replacements. |
| `mise exec -- npm run lint:all` | PASS. |
| `mise exec -- npm run build:prod` (official builder) | PASS, no deprecation warnings; CommonJS optimization notices remain visible. |
| `mise exec -- npm run test:unit:ng` (first migrated attempt) | FAIL, generated ESM specs are wrapped by legacy karma-electron JS preprocessor; fixing configuration, not retrying unchanged. |
| `mise exec -- npm run test:unit:ng` (preprocessor removed) | PASS, 57 tests. |
| Intermediate `mise exec -- npm ci` | PASS, 1,230 packages; exactly four deprecated package/version warnings, down from 12. |
| `mise exec -- npm run build:dev` | PASS, no deprecation warnings. |
| `PLM_VISUAL=1 mise exec -- npm run test:e2e -- --grep 'welcome, about'` against dev build | PASS, JIT bootstrap and unchanged welcome/about/settings screenshots. |
| `mise exec -- npm run test:all` | PASS: lint, 3 dependency checks, Angular 57, Electron main 114, renderer 55, live-reload lifecycle, package runner tests, universal package creation and 60-second DMG smoke. No DEP0137; macOS 27 mounting warning newly discovered. Read-stage cleanup and mount-command follow-ups require targeted rechecks below. |
| Final `mise exec -- npm run test:unit:em:both` | PASS, main 117 and renderer 55 after complete exifr cleanup; zero deprecation warnings. |
| Final `PLM_VISUAL=1 mise exec -- npm run test:e2e` (checkout) | PASS, all 15 tests and original screenshot comparisons; photos, maps, charts, settings/restarts, analytics, HEIC, embedded viewers and website. |
| Final `mise exec -- npm run test:package-runner` | PASS, 19 tests including four disk-image capability/fallback checks. |
| Real DMG attach/eject using selected commands | PASS, zero deprecation warnings; mounted app executable exists, eject removes mountpoint. See `DISK_IMAGES.md`. |
| Isolated-profile `mise exec -- npm start` | PASS, app launched in Dev profile on Vite; no npm config, builder, Sass, or Node deprecation warnings. Owned process stopped. |
| `PLM_E2E_LIVE_RELOAD=1 PLM_VISUAL=1 mise exec -- npm run test:e2e -- --grep 'welcome, about\|folder picker loads\|map regions preserve'` with `ng:serve` | PASS, 3 tests; real HTTP origin, module worker, Node access, photo/chart/map behavior and original visual comparisons. Server stopped. |
| `PLM_VISUAL=1 mise exec -- npm run test:e2e` (first attempt) | First two visual/settings/map tests PASS. Interrupted after later startup timeouts: remote hook was edited concurrently before its new TS helper was compiled. Correct integration by making adapter tracked CommonJS, then rerun against a stable tree. |
| Isolated adapter package fresh `npm install` and `npm ci` | PASS, zero deprecated entries/messages; ten actual-consumer tests pass. This is isolated feasibility evidence, not full-repository acceptance. |
| Repository adapter installation using existing lockfile | Stale graph detected: four deprecated entries remain. Targeted `npm update glob rimraf --package-lock-only` failed with consumer-relative `ENOENT`; resolved by isolated regeneration, retained-version seeding, explicit direct-adapter packing, and clean-install validation. |


| Final root `mise exec -- npm ci` and `npm ls --all` | PASS, zero deprecation warnings, zero deprecated lock entries, valid complete dependency tree. |
| Final `mise exec -- npm run test:dependency-compat` | PASS, 18 tests including direct packing, actual consumer source hashes, archive/discovery/cleanup behavior, and path/error cases. |
| Final-tree lint, Angular/Electron unit, live-reload, package-runner commands | PASS: Angular 57, main 117, renderer 55, package runner 19; no deprecation warnings. |
| `mise exec -- npm run package:mac` | PASS, signed/notarized universal DMG and update ZIP; zero deprecation warnings. |
| `codesign --verify --deep --strict`, `xcrun stapler validate`, `spctl --assess` | PASS, Gatekeeper accepted Notarized Developer ID. |
| Original visual E2E against final signed bundle | PASS, 14 application tests; website skipped as designed. |
| Final isolated-profile DMG smoke | PASS, 60 seconds, main/renderer logs, app quit and diskutil eject; zero deprecation warnings. |
| x64 execution on this host | Unavailable: both binary slices exist but x64 spawn returns Bad CPU type; no system changes attempted. |

## Resume instructions

1. Read this document and repository guidance. Run `git status --short`,
   `git branch --show-current`, and inspect the diff before changing anything.
   Preserve unrelated owner changes. The working tree is the source of truth;
   checkbox status alone does not prove a change is present or tested.
2. Read the latest status below. Check any running process before starting a
   duplicate install/build/test. Avoid concurrent npm mutations and shared-output
   builds. Use the specified toolchain, not the system Node/npm.
3. Continue the first unfinished checkpoint. For every meaningful unit of work,
   update decisions, exact command/outcome, and the next action here. Record
   blocked work separately and continue other authorized work.
4. Before a planned interruption, stop owned watcher/app processes, record
   partial edits and tests still required, and save a coherent checkpoint. Never
   rely on chat history, agent memory, or local-only logs for essential context.

## Latest status

The complete repository now installs with zero deprecation warnings and zero
locked deprecated packages. `npm ls --all` exits zero. All 20 dependency tests
pass, including six installed-source checks (root adapters and actual consumers),
packed-directory/lock guards, Karma file-list/watch behavior, ASAR archives,
Temp cleanup, native path-separator cases, and POSIX escapes. `checkJs` covers both adapters.
Final-tree lint, Angular 57 tests, Electron main 117 and renderer 55 tests,
live-reload lifecycle, and package-runner 19 tests all pass.

Final `npm run package:mac` passed. Codesign deep/strict verification, stapled
ticket validation, and Gatekeeper assessment all pass (`Notarized Developer ID`).
Signed-bundle visual E2E passed all 14 application cases (website intentionally
skipped). Final 60-second DMG smoke passed with zero deprecations, main/renderer
logs present, clean application exit, and successful diskutil eject. Final review
is recorded in `FINAL_REVIEW.md`; the validation checkpoint follows the source commits. The binary contains both x86_64 and
arm64 slices; actual x64 execution fails with `Bad CPU type in executable` on this
host, so Rosetta/x64 E2E is unavailable here. Do not install system components
to work around this; Windows/Linux/native Intel results remain CI follow-ups.
No feature/UI change was necessary. The owner approved branch publication, PR
creation, and all-platform CI (including Intel Mac) on 2026-11-05 (JST).
Publication and CI verification are the active phase; merging is not authorized.

The final portability preflight restored two additional glob 7 contracts:
case-sensitive matching by default on every OS (including removal-pattern
expansion), and forward-slash results on Windows. Added case-discriminating
tests; all 20 compatibility checks and bridge/adapter type checking pass after
a clean installation. The Angular suite was rechecked after these changes.
The adapters remain development-only; application files and the signed bundle's
runtime source were unchanged by these preflight fixes.

Earlier validated checkpoint: `74a2cf8`. It already passed full checkout visual
E2E (15), dev/JIT visual startup, actual `npm start`, and Vite-origin photo/map/
chart visual E2E (3). The adapter follow-up is saved in local commit `33a6d6f`.

Lock migration was resolved without unrelated upgrades: generate the adapter
graph in isolation, seed retained registry entries from `74a2cf8`, and let npm
regenerate/prune. Reject the unconstrained graph (it updated unrelated Babel and
native dependencies). Explicitly reinstall the two direct adapters with npm
`--save-dev ... --install-links=true` to replace stale direct symlinks; ordinary
`npm install` did not repair them. Then root `npm ci`, `npm ls --all`, and the
installed-source tests all passed. The only shared package-path version change
from the checkpoint is the genuine glob 7 replacement with the private adapter
1.0.0. Native msgpackr-extract remains 3.0.4; the repository's install-script policy
is unchanged. `compat/glob/README.md` contains the exact reinstall command.

For a final signed-bundle E2E run:

```sh
PLM_PACKAGED_EXECUTABLE="$PWD/release/mac-universal/Photo Location Map.app/Contents/MacOS/Photo Location Map" \
PLM_VISUAL=1 mise exec -- npm run test:e2e
```

For smoke without rebuilding, set an absolute isolated `PLM_TEST_ROOT` before
requiring `script/package-test/package-smoke-test.js`, then call its exported
`run()` and propagate any rejection as exit code 1. Never run it against the
owner's normal profile: it clears the profile's log directory.

Windows/Linux CI has not run; pushing would trigger the repository's deliberate
Windows draft-release publishing. Preserve the publishing steps. Confirm the
outward publishing step before uploading artifacts. The manual Intel CI policy
in AGENTS.md still applies before merging changes within its stated scope.
