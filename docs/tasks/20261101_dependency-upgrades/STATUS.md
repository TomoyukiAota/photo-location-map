# Dependency upgrade status

Updated: 2026-11-01 (Asia/Tokyo).

## Authorization and actual state

- **Implementation authorized on 2026-11-01 and started with Sol.**
- On 2026-11-01 the user selected Angular 22 and explicitly accepted macOS 13+
  as the minimum OS. These are resolved choices, not pending release approvals.
- Final target: Angular 22.2.4, CLI/Material 22.2.5, TypeScript 6.0.3, Node
  26.13.0 and its bundled npm 11.20.0, matching Photo Data Viewer; Electron 45.2.1.
- Application baseline: `911dd91bf8de231a40be55f80e0255f053bbc4e3`, branch `main`.
- The planning phase began with a clean working tree and added planning/evidence
  documents; implementation is now progressing through the checkpoints below.
- The planning phase changed documents only. Execution now adds profile isolation
  and regression tests with Playwright; application dependency upgrades start at U03.
  No push or publication has occurred.
- Source inspection, official release/registry reads, historical PR review and a
  read-only lockfile audit were performed. No external comments or edits.
- Electron 45 / Angular 22 is verified locally at `d75efc0`, including the
  signed universal package. The U07a working tree has also passed its gate;
  final remote CI, notarization and the native chooser item remain.
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

Active task: U07. File-tree/date/module/queue updates have passed locally.
Next is the image/worker group, followed by analytics and map/chart/translation
updates. Node 26 / bundled npm 11.20 and Electron 45 clean installation work;
the old extractor caveat is resolved. Retain `ng test --watch=false` and never
regenerate the original screenshots or HEIC pixel reference.

## Work queue

| ID | State | Next result needed |
| --- | --- | --- |
| Research | Complete | Refresh time-sensitive candidates at implementation start. |
| U00 | Complete | Existing checkout inspected; only the task documents were uncommitted. |
| U01 | Complete | Original install/lint/build and Mac universal package smoke pass; Karma shutdown issue recorded. |
| U02 | Complete | Seven real Electron/website cases, original screenshots, HEIC pixel reference and restart persistence. |
| U03 | Verified locally | Node 22.23.4/npm 10.9.9; clean install, full graph and 7 visual/functional cases pass. CI actions updated; remote CI pending. |
| U04a | Verified locally | Angular 18.2.14 / CLI 18.2.21; graph/lint/build, 172 assertions and 7 regression cases. Karma shutdown issue remains. |
| U04b | Verified locally | Graph/lint/build, 57+74+41 assertions and all 7 visual/functional cases pass. Explicit single-run also verifies failure exit code. |
| U04c | Verified locally | Graph/lint/build, clean 57+74+41 tests and 7 unchanged regression cases. |
| U04d | Verified locally | Graph/runtime/lint/build, 172 tests and all 7 unchanged regression cases. |
| U05 | Verified locally, install caveat | Angular 22/TS 6/Node 26 build, 172 assertions and 7 unchanged visual/functional cases. Electron 32 installer needs the bridge; U06 must resolve final clean installation. |
| U06 | Verified locally; native chooser item open | Clean install/runtime/lint/build, 172 tests, 8 visual/functional cases and signed universal DMG/ZIP smoke pass with original icon. Windows/Linux/Intel CI and native chooser history remain. |
| U07 | In progress | Update file-tree/module/queue/date group, then images/workers and analytics in separate verified checkpoints. |
| U08 | Not started | Map/chart/translation updates verified visually. |
| U09 | Verified locally | Bootstrap 5.3.8 with unchanged screenshots, focus/hover colors, both download URL requests and 390px layout; unused JS removed. Deployment remains gated by main. |
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
- No further user decision is currently required. The user selected Sol and
  authorized execution; U00 and the framework migration checkpoints are underway.
  Continue independent work and collect only user-only final decisions at U12.
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

### Angular 18 patch checkpoint

Core/Material 18.2.14, CLI/build-angular 18.2.21, angular-eslint 18.4.3,
ngx-echarts 18.0.0 and ng-mocks 14.18.4. Full graph/lint/build pass,
57+74+41 test assertions pass (old Karma teardown error remains), and all
seven refined visual/functional cases pass unchanged, including HEIC pixels.
Logs: `angular18-{update,graph,lint,build,unit,e2e}.log`. The temporary original
manifest restoration is complete; actual files now contain patched Angular 18.
Next: run the complete coupled Angular 19 ng-update group, inspect migrations,
then verify before committing. No processes remain from U04a.

### Angular 19 working tree

`ng update` applied core 19.2.25, CLI 19.2.27, Material/CDK 19.2.19,
custom-webpack 19.0.1, angular-eslint 19.8.1, ngx-echarts 19.0.0 and Zone 0.15.1.
The required migration adds `standalone: false` to existing NgModule components.
The newly introduced prefer-standalone lint rule is off to retain that selected
architecture; original rules remain enabled. Graph, lint and production build
pass. Unit/regression validation is running under `angular19-*.log`; the source
changes are uncommitted until the gate completes. Last verified framework
checkpoint is `775aebd` (patched 18); baseline references are `5944433`.

### Angular 19 completed

Graph, lint, production build, 57 Angular + 74 main + 41 renderer assertions,
and all seven visual/functional comparisons pass. Dialog/tree/chart references
and the HEIC decoded-pixel hash are unchanged.
The old Karma problem was caused by the CLI watch default: explicitly passing
`--watch=false` makes the 57-test suite exit cleanly with code 0. An isolated
intentional assertion failure exits with code 1. The watch-mode negative probe
hung and was terminated; its temporary spec was removed. The normal script now
sets watch=false; the separate watch command retains its original purpose.
Logs: `angular19-single-run.log`, `karma-negative-single-run.log` and its result
JSON (local). No failure or navigation check was disabled.
Next: Angular 20; no temporary negative-control spec or running test remains.

### Angular 20 working tree

Core 20.3.34, CLI/build-angular 20.3.42, Material/CDK 20.2.14, custom-webpack
20.0.0, angular-eslint 20.7.0, ngx-echarts 20.0.2, TypeScript 5.9.3.
The schematic raised ESLint to 9 and typescript-eslint to 8.72.1; migrated root
and script lint configurations to native flat config, preserving rules, NgModules
and constructor injection. Legacy max-len exceptions now name @stylistic/max-len.
ESLint and its JS config are pinned to 9.39.5 for this intermediate framework;
target ESLint 10 still requires the final compatible Angular lint group.
Old @types/node 22.5.5 conflicted with TS 5.9 generic typed arrays. Use updated
20.19.43 temporarily to match current Electron's embedded Node 20; move to
24.19.2 when Electron 45 is installed. No runtime buffer copy was introduced.
CLI changed Angular module resolution to bundler; application webpack architecture
remains in place. Material's schematic also visited ignored dist/release outputs;
those scratch outputs/signatures are not release evidence and must be rebuilt.
Validation logs: `angular20-*.log`; changes are not a verified checkpoint yet.
Last verified application/framework checkpoint: `6cfcea4`.

### Angular 20 completed

All validation now passes: lint without warnings, production/main build,
57 Angular + 74 main + 41 renderer tests with clean termination, and all seven
visual/functional comparisons including the original HEIC pixel hash. Logs are
`angular20-{graph,lint,build,unit,e2e}.log`. The flat-config migration retained
old rule intent and removed three now-unused lint directives.
Next: apply Angular 21 as an intermediate stage; preserve Zone-based behavior.

### Angular 21 working tree

Core 21.2.25, CLI 21.2.29, Material/CDK 21.2.14, custom-webpack 21.1.0,
angular-eslint 21.4.0 and ngx-echarts 21.0.0. The required core migration converted
legacy structural template control flow and made Zone-based bootstrap explicit
with provideZoneChangeDetection. NgModules and existing change-detection choices
remain. The optional application-builder migration was not run.
Added a runtime check that reads Node's version from mise.toml and verifies that
the active npm CLI is inside that same Node installation. Every CI OS calls it
before installation. Its local Node 22.23.4 / bundled npm 10.9.9 check passes.
Validation is running in `angular21-*.log`; source is uncommitted until the gate
completes. Last verified framework checkpoint: `541f134` (Angular 20).

### Angular 21 completed

Runtime check, complete dependency graph, lint, production/main build, clean
57+74+41 unit tests and all seven visual/functional comparisons pass, with
unchanged references and HEIC pixels. Required control-flow conversion preserves
the original rendered layouts and interactions in these checks.
Next: Angular 22 migration on the compatible Node 22 bridge. Select Node
26.13.0 and bundled npm 11.20.0 only after the framework permits it.

### Angular 22 working tree

Last verified framework commit: `5d508f2` (Angular 21). Core 22.2.4,
CLI/Material 22.2.5, custom-webpack 22.0.1, angular-eslint 22.6.0 and
TypeScript 6.0.3 are installed. Node 26.13.0 and its bundled npm 11.20.0
pass the runtime identity guard. Zone 0.16.3 remains explicitly enabled.
The official migration preserves previous default components with Eager change
detection and the previous HTTP backend with withXhr().

The inherited lock had optional chokidar/yaml peers resolving to incompatible
ancestors. A supported `npm dedupe` resolved the graph without overrides, force,
legacy-peer flags or extra pins; `npm ls --all` passes. Lock format remains 2.
angular-eslint 22 moved recommended configs to the umbrella angular-eslint
package; the native config now reads those official configs and preserves
existing eager/NgModule choices rather than enforcing the new OnPush preference.

TypeScript 6 requires explicit preservation of the previous non-strict mode and
ambient Node/Jasmine types. Removed an unused baseUrl and incompatible generated
extendedDiagnostics with strictTemplates=false. Main code uses NodeNext
resolution with CommonJS output. esModuleInterop=false is now deprecated, so
callable/scalar CommonJS imports use supported default imports instead. This
includes physical-cpu-count, avoiding a silent numeric namespace regression.
The webpack config now has a separate tsc check in every build because the new
custom-webpack loader no longer typechecks it. No deprecation error was hidden.

Validation process: npm script pipeline; logs `angular22-*.log` under ignored
`.upgrade-artifacts`. Final lint/build/unit/e2e results are pending.
No user-only action has arisen. Next: inspect the pipeline, fix any actual
compatibility failures, clean-install and verify before committing U05.

### Angular 22 behavior verified; Electron install boundary

Production/main/config builds and lint pass. Angular's 57 assertions pass;
Electron Mocha's 74 main + 41 renderer assertions pass after selecting the
existing per-process tsconfig explicitly and setting rootDir for TypeScript 6.
All seven unchanged original screenshot/functional cases and the HEIC pixel hash
pass. Logs: `angular22-{runtime,graph,lint,build,unit,em-unit,e2e}.log`.

npm 11 blocks uncovered dependency scripts even in non-strict warning mode.
Reviewed the eight script-bearing packages and added exact-version approvals
for the Electron download, esbuild validation and optional build-tool native
loaders. Explicitly denied the core-js/es5-ext informational scripts and the
fsevents lifecycle entry (its prebuilt binary is shipped). All native build
tools, including fsevents, load successfully. Project .npmrc makes unreviewed
scripts fail clearly; no machine-global setting was changed.

**Installation caveat, not a final pass:** clean npm ci completes but the old
Electron 32 extractor (extract-zip 2 / yauzl 2) exits successfully after only the
first archive file under Node 26. Explicit rebuild behaves the same. Running only
that extractor once with the Node 22 bridge installs the same Electron 32 binary
and enables the successful behavior comparison above. This temporary bridge is
not the final installation procedure. Electron 45 uses the maintained internal
extractor and no longer has a postinstall download; its first require/CLI call
downloads the binary. U06 will verify that path with a fresh Node 26 install.

Next smallest action: install the coupled Electron 45 / builder 26 group, inspect
new lifecycle scripts, then validate clean installation, real runtime versions,
all unit/visual tests and the macOS package. No user decision is needed.

### Electron 45 working tree

Node 26 clean npm ci and the maintained Electron binary download now work.
The runtime probe reports Electron 45.2.1 / Node 24.22.1 / Chromium
156.0.8078.75. Builder 26.18.1, updater 6.8.12, notarize 3.1.2, remote
2.1.3, electron-mocha 13.1.0 and Node types 24.19.2 are installed.
mac.minimumSystemVersion is explicitly 13.0. Required CI jobs now probe the
actual Electron runtime as well as the host Node/npm identity.

Reviewed all intervening breaking-change headings (33–45) and the relevant
implementation/docs. Electron 45's bootstrap becomes the root of the CommonJS
parent chain. remote.require consequently resolved app packages from a synthetic
module and failed for fs-extra/exifr. A supported remote-require event handler
now resolves the five existing imports from the app's helper module. No IPC
architecture change or global module-path mutation. Temporary Karma diagnostic
instrumentation was removed. The first fix covered four imports; the remaining
exifr import was identified by a diagnostic run and included before verification.

All 57+74+41 tests and seven original visual/functional cases pass on Electron
45, including actual JPEG/HEIC companion loading and unchanged worker pixels.
Additional checks now cover restored window geometry, the original splitter
reset on restart (this app never persisted split ratios), and Windows fullscreen
menu visibility. Electron 34's new fullscreen menu default has a narrow Windows
compatibility listener. That branch still requires Windows CI. Package smoke
verification is running in `electron45-package.log` after the expanded suite.

Install-script policy: Electron 45 no longer has a postinstall hook; its obsolete
32 approval was removed. The Squirrel-only electron-winstaller 5.4.0 architecture
copy script is explicitly denied because this repository ships NSIS, never
Squirrel. Required native build tools remain version-approved. No blanket bypass
is used for actual clean installations.

Open compatibility item: Electron 43+ explicitly starts an unspecified native
file chooser in Downloads instead of letting the OS restore its last location.
The app's folder chooser supplies no defaultPath. Exact native history migration
requires further investigation; do not claim this native behavior is unchanged.
Windows 10+ x64/arm64 and supported 64-bit Linux distributions remain the upstream
platforms. This repo already targets x64 Windows and no removed 32-bit platforms.
Next: inspect expanded tests and package smoke, then commit the verified group
and move to runtime-library adapters. Final notarized artifacts wait until U11.

### Static website U09 (independent while Mac packaging runs)

Bootstrap CSS is now 5.3.8 with a freshly computed SHA-384 SRI. Explicit
compatibility CSS preserves Bootstrap 4 colors, corners, link decoration and
list indentation. Existing desktop/600px references pass unchanged. Both page
scripts use browser APIs only; unused jQuery, Popper and Bootstrap JS were
removed. Download targets and analytics scripts are unchanged. GitHub Pages
settings read confirms legacy deployment from main:/docs, so this feature branch
will not deploy the website. Actual Mac/Windows download URL assertions and a
390px responsive check are being added; test downloads are intercepted and
cancelled before any real installer is saved. Logs: website-bootstrap5-e2e.log.

Mac package gate detected a builder 26 icon-resolution change: the previous
directory value now selects electron.icns. The source icon files are unchanged;
mac/win config now names their existing favicon.icns/favicon.ico explicitly.
The first package run started with the old value and cannot verify this fix.
Rebuild the package with the corrected config before claiming icon equivalence.

### Website U09 verified

Original desktop/600px snapshots, 390px stacked buttons, original dark-button
focus/hover styles, Mac DMG request and automatic Windows EXE request all pass.
The focused checks use the original Bootstrap 4 CSS values; tolerances and
references are unchanged. The fixture cancels installer requests at Electron's
webRequest boundary, preserving real download.js execution without saving files.
Playwright page.route was tried, but interfered with a file:// icon request; that
test interception was removed, not worked around in the product.

The first Electron 45 universal package creation/mount/60-second launch/quit and
detach passed. Its default Electron icon was correctly rejected by the new bundle
assertion. A fresh package run with explicit original icon paths is now active in
electron45-package-fixed-icon.log; do not treat the first artifact as final.

### Electron/packaging U06 local gate passed

The corrected icon package passes creation, bundle assertions, mount, actual
60-second launch, main/renderer logs, quit and detach. Strict/deep codesign
verification passes. The original ICNS SHA-256 matches exactly; both executable
and Electron framework contain x86_64 and arm64; LSMinimumSystemVersion is 13.0.
Evidence: ELECTRON45_MAC_CHECKPOINT.json and local electron45-package-fixed-icon.log.
This package deliberately skips notarization. U11 must rebuild and notarize the
final dependency set; do not distribute this intermediate artifact.

Lint/build, 57+74+41 unit tests and all eight current visual/functional cases
pass. The new geometry case checks real restored bounds and the splitter's
original reset behavior. Windows fullscreen menu preservation awaits CI.

CI runner labels now select Ubuntu 26.04 LTS, confirmed in the official runner
image inventory. FUSE uses libfuse2t64. The historical required-check name
`test (ubuntu-24.04)` remains explicit, so protection/Mergify settings need no
owner change. All workflow YAML parses. Remote CI is not yet run.

Remaining U06 item: unspecified native file choosers start in Downloads in
Electron 43+. Investigate preservation of the OS's old remembered directory.
Continue U07 independently; no user-only action is needed yet.

### U07a file-tree/dates/module/queue group in progress

Last verified application checkpoint: d75efc0. Installed commander 15.0.0,
directory-tree 3.6.0, fs-extra 11.4.1, lodash 4.18.1, moment 2.31.0,
moment-timezone 0.6.6, uuid 14.0.3, comlink 4.4.2 and updated related types.
Declared directly imported moment and reflect-metadata; removed obsolete uuid
types after the library supplied its own. A shared directory-tree adapter
explicitly requests the old size/type/extension fields because v3 omits them by
default. All production callers and existing fixture tests use that adapter.

Two latest candidates failed actual Electron probes:
- electron-unhandled 6.0.0 cannot load through the synchronous main entry
  (ERR_REQUIRE_ASYNC_MODULE, top-level await). Version 5 source has the same
  asynchronous main initialization. Version 6 also adds renderer crash and hang
  dialogs without a configuration switch, changing the old error policy. Keep
  4.0.1 while preserving synchronous startup and that UI; no whole-app ESM change,
  copied dependency fork or listener suppression was introduced. Revisit if the
  upstream API permits preserving the old policy with bounded initialization.
- p-queue 10.0.0 combines a DOM EventTarget with Node's setMaxListeners in an
  Electron renderer. Both the bundled Karma and native Electron Mocha renderer
  fail before tests start. No global process/EventTarget mutation or dependency
  source patch. Version 9 is the compatible candidate. The current pipeline uses
  9.3.0; registry inspection subsequently found 9.3.5 as the highest stable 9,
  which must be selected and verified before the final snapshot.

Failure evidence: runtime-core-unit.log (initial failing run was overwritten by
the compatible rerun), runtime-core-native-pqueue.log, unhandled6-probe.log;
source inspection notes are retained here. Current validation is in
runtime-core-{graph,lint,build,unit,e2e}.log. No unresolved issue requires owner
action at this stage.

Timezone data changed from 2022g. Twelve public synthetic timestamp samples
include two expected data corrections: Almaty +06 becomes +05 and Cairo's summer
+02 becomes +03. Tokyo and the sampled US DST boundaries are unchanged. Exact
before/after outputs and data version are in TIMEZONE_CHANGES.json. Do not
misrepresent timezone database corrections as byte-identical date results.

### U07a completed

The final compatible queue is 9.3.5. Graph, lint, production/main/config build,
57+74+41 assertions and all eight unchanged visual/functional comparisons pass.
Commander 15 explicitly retains the old tolerance for excess positional arguments.
Native synchronous loading of uuid 14 succeeds in actual Electron processes.
Directory metadata, real EXIF/GPS extraction and directory selection remain
covered by existing unit/integration assertions. Logs: runtime-core-*.log.

Next: Jimp 1 / heic-decode 2.1 / workerpool 10. Preserve scale-to-fit behavior,
400px bound, jpeg-js encoder, 0.92 quality and original decoded output hash.
Do not update image references to accommodate a changed algorithm.
