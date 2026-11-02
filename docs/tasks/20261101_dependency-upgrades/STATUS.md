# Dependency upgrade status

Updated: 2026-11-02 (Asia/Tokyo).

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
  The branch is pushed and Draft PR #630 is open. No public release was published.
- Source inspection, official release/registry reads, historical PR review and a
  read-only lockfile audit were performed. No external comments or edits.
- The final local code checkpoint is `2b7b0d7`: clean install, valid graph,
  production build, lint, 194 unit assertions, watcher lifecycle and 15 actual
  visual/functional cases pass. The exact versions are in IMPLEMENTED_VERSIONS.
  Final signing/notarization and remote CI are in progress; owner compatibility
  decisions remain. Do not treat the intermediate `d75efc0` package as final.
- No long-running baseline app remains. Final macOS packaging is running. Local command logs
  are under `.upgrade-artifacts`; test output is in its `e2e-results` directory.

## Read order on resume

1. Repository instructions, then this file.
2. [PLAN.md](./PLAN.md) for scope, gates and recovery procedure.
3. [VERSIONS.md](./VERSIONS.md) for the complete candidate inventory.
4. [evidence/research-summary.json](./evidence/research-summary.json) and
   [evidence/registry-snapshot.json](./evidence/registry-snapshot.json) for dated facts.
5. Inspect actual branch/HEAD/diff, task-related commits, existing processes and
   any newer user instructions. Reconcile records before executing commands.

Active task: U11. File-tree/date/module/queue, image/worker and analytics
updates, maps, charting, translations and tooling have passed locally. Next is
final platform/distribution verification.
Node 26 / bundled npm 11.20 and Electron 45 clean installation work;
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
| U07 | Verified locally | File/date/module, image/worker and analytics groups pass; compatibility exceptions are recorded. |
| U08 | Complete | Maps, charting and translations pass unchanged visual and actual interaction checks. |
| U09 | Verified locally | Bootstrap 5.3.8 with unchanged screenshots, focus/hover colors, both download URL requests and 390px layout; unused JS removed. Deployment remains gated by main. |
| U10 | Complete | Clean install, graph, tooling, audit disposition and all local regression gates pass. |
| U11 | In progress | Isolated updater transport passes; final clean platform/package verification remains. |
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

### U07b image/worker working tree

Installed Jimp 1.6.1 and workerpool 10.0.3; removed the obsolete workerpool
types. Named Jimp construction and object resize options retain the original
algorithm and jpeg-js quality 92. Independent comparisons against original Jimp
0.16.2 in the signed intermediate package produce identical bitmap/JPEG hashes
for four synthetic sizes and for the actual HEIC decode. A pure resize helper
and four original-output unit cases also cover nonzero Buffer byte offsets;
Jimp.fromBitmap 1.6 incorrectly includes the entire backing buffer in that case,
so the supported bitmap constructor is used.

The latest HEIC stack initially failed the immutable thumbnail hash. Isolated
comparisons prove this is libheif's raw decode, not Jimp or workerpool. All three
published versions allowed by heic-decode 2.1 (1.19.8, 1.23.2, 1.23.5) give the
same changed result. A reviewed child-only override retains libheif-js 1.18.2
inside heic-decode 2.0's allowed range. This deliberately preserves image output
rather than replacing the original reference. Detailed metrics and candidate
outputs are in HEIC_DECODER_COMPARISON.json; initial failure log is retained as
images-e2e-initial-pixel-failure.log.

Final compatible image validation is running in images-{graph,lint,build,unit,e2e}.log.
The four new resize assertions make the intended total 176 if all pass.
Next: inspect results, commit only after the original HEIC hash passes, then
update analytics libraries while explicitly preserving collection defaults.

### U07b completed

Jimp 1.6.1 and workerpool 10.0.3 pass graph/lint/build, all 176 assertions
(57 Angular + 78 main + 41 renderer), and all eight original visual/functional
cases. The HEIC pixel reference is unchanged with the reviewed decoder pin.
All four independent Jimp bitmap and encoded JPEG comparisons match original
0.16.2, including upscaling and nonzero buffer offsets.
Next: analytics SDKs; inspect original defaults before adopting their new APIs.

### U07c analytics working tree

Installed Amplitude browser 2.49.0 and Mixpanel 2.84.0; removed the obsolete
Mixpanel types and adapted its default/CJS export. Amplitude keeps attribution
(the previous SDK did this) while explicitly disabling new page/session, form,
file, interaction, performance and URL-enrichment capture. Remote configuration
and diagnostics are disabled because the original SDK had neither. Mixpanel
explicitly keeps autocapture/page-view/session-recording disabled. Existing
project selection, IDs, custom event names/properties and batching defaults remain.

Graph/lint/production build pass. A new real-app check sends a fixed main-process
event through both actual renderer SDKs, captures outgoing payloads without
sending them, checks properties and rejects new automatic event families. Test
transport retries are deduplicated by the SDK ingestion ID, not by action name.
The initial test fixture assumed every Mixpanel data field was base64; it now
accepts JSON and base64 forms. Current targeted verification is in
analytics-events-e2e.log. Full unit/visual gate is pending. No owner action needed.

### Analytics integration check refinement

The real transport check passes for both SDKs with exact fixed properties and
no automatic event families. The initial predicate incorrectly used the first
ElectronApplication.evaluate argument for the test service; that first argument
is Electron's namespace. Correcting the callback's second argument resolved the
false empty-result assertion. A diagnostic run confirms both services receive
the event, parsing succeeds and unit-test flags are absent.

The negative control enables a separate SDK instance with its new defaults under
the isolated test profile. It fails specifically on session_start and
[Amplitude] Page Viewed, proving the test detects the behavior the app disables.
Raw evidence: analytics-negative-control.log. No product defaults were changed
for that control. Full 176-assertion/9-case validation is now running.

### U07c completed

Graph/lint/production build, 176 unit assertions and all nine visual/functional
cases pass. The actual SDK payload check verifies both destinations receive one
fixed application event with unchanged category/label/value and no automatic
page/session/interaction events. Its deliberate default-SDK negative control
fails on the expected new events. Logs: analytics-{graph,lint,build,unit,e2e}.log.
Next: update Leaflet/Geoman/Turf, retaining existing controls and region selection.

### U08a maps completed

Leaflet 1.9.4, Geoman 2.20.4, Turf 7.4.0 and the current Leaflet/cluster types
pass graph, lint, production build, all 176 unit assertions and all ten E2E
cases. Markercluster remains its latest stable 1.5.3. All seven CDN resources
now have SHA-384 integrity values computed from the fetched bytes; see
[MAP_RESOURCES.json](./evidence/MAP_RESOURCES.json).

The six original primary toolbar controls and their pixels remain unchanged.
The focused toolbar reference copies pixels from the immutable Angular 18 /
Electron 32 screenshot, without resampling or capturing an upgraded app.
[MAP_TOOLBAR_REFERENCE.json](./evidence/MAP_TOOLBAR_REFERENCE.json) records the
source hash, crop and output hash. A deliberate 3px toolbar displacement fails
this comparison (map-toolbar-negative-control.log).

The new real-pointer case first passed against the original CDN libraries, then
against the updated ones. It draws overlapping rectangles/polygons, confirms
the union counts two photos once, removes each region, and selects the same
Kobe/Unga photos while excluding Apple Park/Gold Coast. The original behavior
clears drawings when a selection rebuilds the map. Unga's directory checkbox
counts its locatable children, so it is checked even though another file there
has no GPS. Drawing points avoid toolbar action menus and photo markers.

Logs: maps-{graph,lint,build,unit,e2e}.log; the pre-update interaction check is
maps-original-controls-baseline.log. Next: ECharts 6 with the official v5 theme,
then the translation loader/provider migration.

### U08b charts and chooser compatibility completed

ECharts 6.1.0 is installed with the official v5 compatibility theme. Additional
supported toolbox/slider options preserve 5.4.3 colors and positions; the theme
alone did not. A new real-pointer Year/zoom/reset/filter case first passed
against compiled 5.4.3. Graph, lint, production build, 194 unit assertions and all
12 visual/functional cases pass. Slider positioning uses public top/bottom
options, with no private layout properties. Do not regenerate references or
weaken tolerances. Logs: chart-{graph,unit}.log and
chart-agent6-{build,lint,e2e}.log.

The resize reference contains the hovered gutter color. An intermittent failure
had identical geometry but a neutral gutter; its existing 1s CSS transition was
not complete. The test now performs a real hover and waits for the original
hover color before comparison. Product CSS and references remain unchanged.

The folder-chooser history adapter and nine tests are also implemented. The
actual Electron option-capture E2E passes across cancellation and a real app
restart; its nine helper cases also pass in both Electron contexts. Its
supported-API limitations are recorded in
[NATIVE_CHOOSER_COMPATIBILITY.md](./evidence/NATIVE_CHOOSER_COMPATIBILITY.md).
The signed package still represents d75efc0, not this checkpoint.

U10 research found that Jasmine 7 explicitly drops Karma and Zone compatibility.
Use the highest compatible 6 line with the officially recommended scoped
karma-jasmine override, verify which core Karma actually resolves, and preserve
the failing-test exit check. Do not accept npm outdated's older Angular values:
its manifest picker prefers nondeprecated historical versions even though the
published current releases are 22.2.x. Other tooling/audit changes have not yet
been installed. A local-feed updater harness is being prepared separately;
it must isolate the updater cache as well as userData and prohibit native install.

### U11 local updater transport preflight

The new `test/updater/run.cjs` harness passes with its synthetic ZIP. It executes
the compiled application startup/version guard and real MacUpdater 6.8.12
metadata, availability, checksum, cache reuse and corrupt-download cleanup.
Both userData and the independent updater cache are isolated. Non-loopback
traffic is blocked; native feed setup is intercepted, and native check/install,
quit and relaunch calls are prohibited. No installation or rollback was performed.
See [UPDATER_TRANSPORT_CHECKPOINT.json](./evidence/UPDATER_TRANSPORT_CHECKPOINT.json)
and `test/updater/README.md` for the exact limits and final real-ZIP command.
Repeat against the final signed ZIP after all dependency changes; this preflight
does not replace notarization, Gatekeeper, installed-app or public-feed checks.

### U08c translation completed

Core/HTTP loader 18.1.0 remove TranslateModule and the old loader constructor.
The app keeps its NgModule architecture, imports the supported standalone
translation pipe/directive, and registers the new provider functions. The asset
path remains `./assets/i18n/` plus `.json`, English remains the fallback, and
`failOnError: true` preserves the old loader's error propagation.

Graph, lint, production build and 194 unit assertions pass. The initial build
after the module/provider change retained a stale Angular pipe scope and failed
at runtime. `mise exec -- npx --no-install ng cache clean` plus a production
rebuild fixes it; no custom pipe or library patch is needed. Original welcome,
settings, map and loaded/resized screens pass in targeted checks. The gutter
test now checks actual hover and completion of its transition, rather than
accepting a stale color during the 0.2s transition delay. The final rebuilt checkout
passes all 12 cases, including the adapter, and all 194 unit assertions. Logs:
translate-{graph,unit}, translate-final-{build,lint,e2e},
translate-clean-{build,e2e}, translate-gutter-stable.

U11 packaged tests need a fixed early test hook, gated by an absolute test
profile and explicit E2E flag, to remove known debugger arguments and intercept
test telemetry without disabling production logging or SDK initialization.
The adapter uses the signed app's own resources and worker dependencies and
must not modify a bundle after signing. It is implemented and passes static
normal/guarded lifecycle checks plus the full checkout suite. Actual packaged
and Rosetta checks remain until the final bundle exists. Commands and limits
are in `test/e2e/README.md`. Normal startup remains inert; test-profile launches
also block telemetry for package smoke tests without suppressing logging.

### U10a lint completed

ESLint 10.14.0, @eslint/js 10.0.1 and Stylistic 5.10.0 pass the complete lint
and dependency graph checks. The three newly recommended core rules are
explicitly disabled to retain the existing policy; template-literal allowance
uses Stylistic's supported `always` value. No autofix or app source changes.
Log: tooling-lint10.log. Next: supported Jasmine 6 and working coverage.

The separate decoder security review now documents real upstream advisories in
EXCEPTIONS.md. The old pixel-preserving pin is not publication-approved. Keep
that final owner choice visible while completing independent work.

### U10b Jasmine and coverage completed

Jasmine 6.3.0, its 6.0.0 types, HTML reporter 2.3.0 and karma-coverage 2.2.1
pass all 194 unit assertions. Both root and karma-jasmine resolve 6.3.0 using
the scoped override recommended by Jasmine's official 6 migration guide.
The former nested runner was 4.6.1 despite the root 5.2.0 declaration.
Jasmine 6 emits its expected Zone monkey-patching deprecation; no warning or
failure detection is suppressed. Version 7 is incompatible with this test stack.

Coverage now runs once and writes real HTML/LCOV reports for 124 source files.
A temporary failing assertion returns exit 1 with its TypeScript location;
the temporary spec has been removed. See
[JASMINE6_CHECKPOINT.json](./evidence/JASMINE6_CHECKPOINT.json).
Logs: jasmine6-{unit,coverage,negative,graph}.log. Next: script-tool replacement,
direct ts-node registration, unused dependencies and compatible transitive refresh.

### U10c working tree and final local gate

The maintained npm-run-all2 9.0.4 and npm-check-updates 23.1.1 replace the old
script tools. Cross-env, wait-on, RxJS and tslib are updated; native Webpack
types replace the stub, aligned with the builder's exact Webpack 5.112.0.
Direct ts-node 10.9.2 replaces Espower/Power Assert instrumentation. Assertion
pass/fail semantics remain, with standard Node diagnostics instead of expression
trees. Both intentional Electron failures return exit 1 and TypeScript stacks.
Unused Chai/tiny-worker/allSettled packages and obsolete install approvals are
removed. Lockfile format 3 and compatible transitive refresh pass clean npm ci.

The first clean gate passed all 194 assertions and 15 unchanged-reference E2E
cases, including Unicode/space/#/% CLI and viewer paths. Script-runner probes
verify Dev profile inheritance, sequential failure propagation and parallel
child shutdown. npm-check-updates help is verified without updating manifests.

Development verification found electron-reload's unclosed watchers prevent
process exit on Electron 45. It is replaced by a small lifecycle adapter using
current Chokidar 6.0.0. Real quit/reload/relaunch checks pass, as does the actual
HTTP photo flow and npm start/stop. See
[DEV_FLOW_CHECKPOINT.md](./evidence/DEV_FLOW_CHECKPOINT.md). CI now includes the
watcher lifecycle check. Test-only DevTools target handling is explicit.

A final clean install/build/unit/watcher gate passes after this compatibility
fix. All 15 visual/functional cases pass in final-e2e-stable.log. Native capture
can clear hover after it has been verified, so the screenshot holds only that
existing pseudo-state through the supported CDP API; no style, mask, reference
or tolerance change. Real hover/transition/color checks still run first.

Angular core has an optional Chokidar ^5 peer. Development's latest Chokidar 6
uses the npm alias `chokidar6`, allowing the peer to resolve supported 5.0.0;
the complete graph is valid without overriding that peer. A final registry
refresh also updates ng-mocks to 14.18.5; all 194 assertions pass with it.
The HEIC child override is restricted to parent 2.0.0 so it cannot accidentally
follow a future approved parent update. The obsolete notarize `tool` option is
removed for the current API.

See [LOCAL_FINAL_CHECKPOINT.json](./evidence/LOCAL_FINAL_CHECKPOINT.json) and
[AUDIT_DISPOSITION.json](./evidence/AUDIT_DISPOSITION.json). npm audit reports
75 propagated entries across five leaf packages; no compatible fixes remain
inside the supported parent ranges. The native decoder advisories are separate.
Logs use final-{clean-install,runtime,build,unit,watcher}.log, ready-{graph,audit},
latest-mocks-unit.log and alias-watcher.log. No development server or old test
Electron process remains. Signed artifacts still represent d75efc0; final
signing/notarization and remote CI are now running. Google Maps credentials were not
available in the task environment; live key-backed validation remains separate.

### U11 first remote checks and build-order correction

Draft PR: https://github.com/TomoyukiAota/photo-location-map/pull/630.
Head `9a56cd5` started push/PR checks on all three OSes, plus manual macOS
Intel verification (run 41378002739). macOS push job 125062227644 and Ubuntu
push job 125062212941 fail before watcher execution: the fresh checkout has no
compiled `src-main/configure-live-reload.js`. Logs were read before any retry.
This is a repository test-command ordering defect, not an environmental failure.
The watcher test command now builds src-main itself, making it independently
repeatable on a clean checkout. No checks, Windows draft publishing, or installer
retry behavior are removed. Push the validated fix and rerun Intel at the new head.

Final local notarization is independently running with real credentials; its
raw output is `.upgrade-artifacts/mac-final-package.log`. Do not run package
creation tests that overwrite the signed bundle. Next: final packaged arm64 and
Rosetta E2E, signature/Gatekeeper checks, real-ZIP updater transport, and CI.

### U11 final Mac artifacts and Linux runtime argument

The final `2b7b0d7` runtime bundle is signed and notarized. Deep strict codesign,
stapler, Gatekeeper, original icon, macOS 13 minimum and both universal slices
pass. The final DMG runs main and renderer for 60 seconds with an owned profile,
then quits and detaches. All 14 packaged arm64 visual/functional cases pass;
the separate website case is intentionally skipped. Runtime dependencies and
110 packaged runtime-source files match the checkout. ZIP/DMG metadata sizes and
SHA-512 match, and every blockmap chunk verifies (11,349 ZIP / 11,671 DMG).
The real final ZIP also passes isolated updater transport/cache/corruption checks.

Rosetta is absent on this machine: even `arch -x86_64 /usr/bin/true` fails with
Bad CPU type and no Rosetta receipt is installed. Do not install OS software
solely for redundant coverage. Native Intel CI is the x64 execution gate.

The `0c72971` build-order correction passes watcher lifecycle on remote runners.
Both Ubuntu triggers then fail at AppImage startup: its launcher supplies
`--no-sandbox`, which Commander rejects before application logging. Logs for
jobs 125063886387 and 125063902228 confirm the same repository compatibility
defect. A hidden option now accepts that existing Electron flag; it does not
add the flag, alter help, or accept arbitrary unknown options. Targeted checks
preserve Unicode/special-character --open values and unknown-option exit 1.
The previous signed artifacts are evidence for the pre-argument-fix source;
rebuild and notarize the final source before reporting final artifact readiness.
