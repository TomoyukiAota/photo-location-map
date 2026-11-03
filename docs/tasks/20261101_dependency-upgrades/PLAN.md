# Dependency upgrade plan

Research date: 2026-11-01 (Asia/Tokyo). **Implementation authorized on 2026-11-01. Publication remains a separate final gate.**

Read [STATUS.md](./STATUS.md) first on resume. See [VERSIONS.md](./VERSIONS.md)
for all 102 direct dependencies, other versioned resources, and exact candidates.
All candidates require installation and regression verification; a published
version and compatible peer range are not proof that this app works with it.

## Objective and version policy

Update repository-managed runtimes, libraries, tools, CDN resources and CI as far
as possible while preserving features, UI, interactions, stored data and release
behavior. Internal API/configuration adaptations are allowed once implementation
is requested. Preserve existing defects unless fixing one is essential to the
upgrade; record such exceptions instead of silently changing behavior.

Use supported Node LTS and its bundled npm. Do not install npm separately, add an
independent npm tool to mise, or upgrade the machine's global tools. `mise.toml`
remains the single source of truth. Verify `node --version`, `npm --version`, and
their executable paths locally and in every CI OS job.

The user selected Angular 22 on 2026-11-01. The final target is the configuration
previously called Path M, matching Photo Data Viewer's development runtime:

| Node / bundled npm | Angular core / CLI / Material | TypeScript | Policy |
| --- | --- | --- | --- |
| 26.13.0 / 11.20.0 | 22.2.4 / 22.2.5 / 22.2.5 | 6.0.3 | Node LTS with bundled npm; stable Angular 22 in Active support, followed by LTS through approximately June 2028. |

The framework choice is resolved and must not be asked again at the final gate.
Angular 21 is an intermediate migration checkpoint, not an alternative release
to prepare or compare. Keep checkpoints for recovery without maintaining two
release candidates. The dated registry evidence retains the original Path L/M
comparison as historical research only.

Angular 21's official compatibility table does not include Node 26, even though
some npm `engines` ranges accept it. Do not call that combination supported.
Node 24 is also usable with Angular 22 if a demonstrated Node 26-specific tool
failure requires a fallback; investigate and record the reason before changing
the selected final runtime.
Node 22.23.4 / bundled npm 10.9.9 is a temporary migration bridge compatible with
Angular 18 through 22, not the intended final development runtime.

Electron is a separate runtime. Candidate Electron 45.2.1 contains Node 24.22.1
and Chromium 156.0.8078.75. Its Node does not have to equal development Node;
there is no independently managed npm inside the shipped app. Compile shared
and main-process Node APIs against the Electron runtime (candidate
`@types/node` 24.19.2), not blindly against development Node 26. Native addons,
if present, must target Electron's ABI and the packaged architecture.

Electron has no official LTS line; it supports three stable majors. Candidate
45.2.1 requires macOS 13+, whereas the current 32 line can run on macOS 10.15.
43.8.6 is a temporary supported alternative for macOS 12, with scheduled EOL
2027-01-05. There is no currently supported Electron preserving macOS 10.15/11.
On 2026-11-01 the user explicitly accepted macOS 13+ as the minimum, citing the
end of security-update support for the older OS releases. This support decision
is resolved; do not prepare Electron 43 solely to preserve macOS 12 or ask for
the same approval again. Implementation and publication remain separate from
this planning decision. Confirm Windows/Linux platform requirements separately.

## Evidence and lessons from existing work

The research baseline is `911dd91bf8de231a40be55f80e0255f053bbc4e3` on `main`,
app version 1.12.2-alpha, Node 20.16.0, bundled npm 10.8.1, Electron 32.0.2,
Angular 18.2.4. The initial working tree was clean. The lockfile uses format 2
and records 2,130 package entries excluding its root.

[Photo Data Viewer PR 63](https://github.com/TomoyukiAota/photo-data-viewer/pull/63)
and [PR 64](https://github.com/TomoyukiAota/photo-data-viewer/pull/64) are merged.
They establish the desired Node/npm pair and useful practices: immutable
baseline screenshots, real JPEG/HEIC integration tests, actual splitter position
assertions after reload, three-OS checks, and records distinguishing verified
application commits from later documentation-only commits. Reuse public test
fixtures only after checking their license/privacy and assumptions. Its tests
currently target Electron 32.0.2; passing them does not prove Electron 45 works.
Its acceptance of older companion releases being unsupported does not authorize
a new minimum OS for this app. Its Next/React-specific ESLint constraint does
not apply here: this app's candidate lint plugins admit ESLint 10.

Relevant local precedent: PR 557 / commits `a9a601f`, `eec6c87`, `b8bf140`
updated Angular core/CLI/ESLint, Material/CDK and custom-webpack together;
PR 555 / `38ea842` also changed native menu types during an Electron update.
Use those diffs as guidance, not as permission to repeat historical force flags.

Read-only `npm audit --package-lock-only --json` reported 140 affected package
entries: 6 critical, 69 high, 51 moderate, 14 low. These are audit classifications,
not 140 independently exploitable application flaws. The exact dependency paths
must be assessed during implementation. In this repository renderer libraries
are deliberately in `devDependencies` and bundled into the shipped app; an
`--omit=dev` audit alone is insufficient. CDN libraries are outside npm audit.
See [evidence/research-summary.json](./evidence/research-summary.json).

No dependency installation, migration, application test, packaging, push,
publication or external write was performed during this planning task.

## Work packages and gates

Each row is a small resumable unit, not a command to run now. Split a row further
when needed; do not wait for an entire phase before saving progress.

| ID | Depends on | Work and acceptance gate |
| --- | --- | --- |
| U00 | Implementation request | Inspect actual checkout and instructions, protect unrelated edits, create a `codex/` branch in a suitable existing checkout, refresh dated metadata, and record the selected starting versions. |
| U01 | U00 | Capture original behavior with original Node/npm/lockfile. Run existing lint, unit and packaging checks; classify pre-existing failures. Capture UI, data, installed-app and companion baselines under isolated test profiles. |
| U02 | U01 | Add focused regression coverage for the contract below, including meaningful negative controls. Commit baseline references before migrations. Verify the suite on the original app. |
| U03 | U02 | Move development/CI to Node 22.23.4 and its npm 10.9.9 as a bridge. Update install-compatible tooling and CI actions in a separate checkpoint. Confirm clean install and lockfile reproducibility. |
| U04a | U03 | Bring Angular 18 to its last patches, including corresponding CLI/Material/ESLint. Align ngx-echarts and ng-mocks before the next major. Verify the baseline. |
| U04b | U04a | Angular 18 → 19, with matching Material/CDK, custom-webpack, ESLint and ngx-echarts. Review every migration and verify before committing. |
| U04c | U04b | Angular 19 → 20 with its matching package set and TypeScript. Preserve webpack, NgModules, animations and existing theme. Verify before committing. |
| U04d | U04c | Angular 20 → 21 as an intermediate checkpoint, retaining the Node 22 bridge and using TS 5.9.3. Explicitly preserve Zone-based behavior. Verify and record the checkpoint before continuing to 22. |
| U05 | U04d | Reach the selected destination: Angular 21 → 22, matching package set, TS 6.0.3, then Node 26.13.0 / npm 11.20.0. Preserve eager change detection. Verify the final runtime and framework together. |
| U06 | U03; coordinate U04/U05 | Electron 32 → 45 and builder 24 → 26, updater, notarize and remote, with the accepted macOS 13+ minimum. Change one coupled group at a time. Read all intervening Electron breaking changes; if failures are hard to localize, use intermediate stable majors to bisect. No requirement to publish intermediate/EOL builds. Verify the target Electron with Angular 22 before declaring the final build release-ready. |
| U07 | U05/U06 | Update runtime libraries in small groups: file tree/queue, images/workers, dates/geometry, analytics and module-format changes. Check actual decoded/selected/output data, not just compilation. |
| U08 | U04/U05 | Update Leaflet, Geoman, charting, translations and related types. Preserve CDN/global loading unless a bounded compatibility fix requires otherwise. Validate visual and interactive behavior. |
| U09 | U02; independent of U04–U08 | Update the static download site's dependencies with its own screenshots and link tests. Prepare changes locally; check Pages deployment behavior before pushing these files. App CI skips `docs/`, so it provides no validation for this site. |
| U10 | U07/U08 | Complete compatible transitive refresh, review obsolete/unused packages, lint/test-tool migrations, lockfile format, install scripts and audit triage. Record every retained version and its reason. |
| U11 | All applicable changes | Clean-install validation on Windows, Ubuntu, macOS arm64 and explicitly triggered macOS Intel. Package/install/launch and real app flows; signed and notarized universal Mac artifacts; staged auto-update and rollback checks. |
| U12 | U11 or documented independent blockers | Prepare one final decision packet: exact versions, before/after UI evidence, test results, artifacts/checksums, any newly discovered unresolved support issues, residual risks and only tasks requiring the user. Angular 22 and macOS 13+ are already selected. No publication by implication. |
| U13 | Final user authorization | Merge/publish only what is authorized; verify downloaded public artifacts, metadata and updater behavior, then record actual application SHA, release IDs and recovery details. |

Independent packages may proceed while a different gate is waiting. The accepted
macOS minimum is no longer a release decision gate; actual platform verification
and separate publication authorization still apply.
Do not require the owner to repeat a task that CI or this machine can perform.

## Migration rules for this repository

- Use `ng update` one major at a time and synchronize core/compiler/animations/
  browser/forms/router versions. CLI/build-angular and Material/CDK have their
  own patch series; they need not all share the same patch number. The registry
  snapshot includes intermediate versions and peer constraints.
- Do not enable the optional application/esbuild builder migration. The existing
  custom webpack target is `electron-renderer`, with top-level await and Node
  integrations. Latest build-angular is deprecated but still published; replacing
  this architecture is a separate decision if it becomes an actual blocker.
- Preserve NgModule declarations with `standalone: false` where migrations
  require it. Keep Zone.js and Zone-based app/test configuration across Angular
  21+. For 22, inspect the migration that preserves the former default change
  detection using `Eager`/the compatibility API; do not accidentally accept the
  new OnPush default. Check async IPC, file loading and chart refresh explicitly.
- Keep Material's indigo-pink/M2 appearance, density, typography and animations.
  Tree/control APIs and `ng-table-virtual-scroll` are compatibility hotspots;
  an open-ended peer range is not evidence of tested Angular 22 support. A small
  internal adapter is acceptable if proven equivalent. A large fork or redesign
  becomes a final decision item.
- ECharts 6 changes its default appearance and axis behavior. Start with the
  official v5 compatibility theme, then compare colors, geometry, labels,
  selection and data zoom; restore exact old settings where necessary. Never
  approve a changed screenshot solely because the new defaults look reasonable.
- `TranslateHttpLoader` constructor/provider APIs change between the current and
  candidate versions. Preserve the same asset path, language fallback, labels,
  missing-translation behavior and timing of updates.
- Main/shared output is CommonJS. `electron-unhandled`, `uuid`, `chai` and
  `p-queue` candidates include ESM packages; Jimp supplies both import and require
  exports. Validate actual imports in main, renderer, worker and test processes.
  Do not set the entire repository to ESM to fix one import. Prefer a narrow
  supported import/initialization adaptation; record a lower compatible version
  if equivalence cannot be established. Host Node success is not Electron proof.
- Jimp 1 changes exports, construction and resize arguments. Preserve the 400px
  maximum thumbnail dimensions, resize algorithm, orientation and JPEG quality
  0.92. Keep the current jpeg-js encoder unless evidence requires a change.
  Compare decoded pixels, dimensions and representative file sizes. Refresh
  libheif through heic-decode; test generated caches and older caches separately.
- Review Electron's removed/changed APIs actually used by this app, including
  `protocol.registerFileProtocol('file', ...)`, remote calls, window preferences,
  fullscreen menus, window state and local-file URLs on Windows. Test spaces,
  Unicode, `#`/`%`, missing files and development versus packaged loading.
  Preserve behavior; do not bundle a wholesale IPC/security redesign.
- Update builder/updater/notarization together where necessary. Keep `asar:
  false`, universal dmg/zip, NSIS wizard and AppImage targets. Builder 26.18.1
  still embeds NSIS 3.0.4.1 and nsis-resources 3.4.1; do not inject an unrelated
  latest NSIS binary or remove the existing narrowly targeted installer retry
  without evidence. Inspect binary/toolset versions that do not appear in npm.
- Migrate both root and script ESLint configurations to supported flat config
  when adopting ESLint 10. Preserve their rule intent and inclusion boundaries.
  Test `espower-typescript`/ts-node with the selected TS version; Karma and its
  Electron launcher being unchanged at latest does not guarantee compatibility.
- `moment` and `reflect-metadata` are imported directly but currently supplied
  transitively. Declare them explicitly in the appropriate dependency section
  if still required. Types supplied by uuid/workerpool/mixpanel can replace their
  stub `@types` packages. Confirm type checks before removal. `chai`, tiny-worker
  and the allSettled polyfill have no obvious active references in the initial
  search; establish reachability before removing them.
- Refresh indirect dependencies within parent-supported ranges. Never force
  every nested package to its registry maximum or apply blanket `--force`,
  `--legacy-peer-deps`, `npm audit fix --force`, or unreviewed overrides.
  Reconstruct from the accepted lockfile with `npm ci` and check `npm ls --all`.
  npm 11 may rewrite lockfile format 2 to 3; record the format change separately.
- Preserve install/postinstall behavior needed for Electron download and native
  rebuild. If npm's script policy blocks an install, inspect the exact package
  script and use a scoped supported approval. Do not copy Photo Data Viewer's
  allowlist blindly or disable all scripts and claim the app was tested.

## Behavior and validation contract

U01/U02 must turn the following into reproducible evidence. Use synthetic or
already-public fixtures; do not publish private photos, paths or credentials.

| Area | Required comparison |
| --- | --- |
| Initial UI | Welcome/about/settings dialogs, menus, toolbar, status bars, text, theme, fonts, borders, spacing, focus and keyboard behavior. |
| File loading | Folder picker, recursive scanning, sort/filter, zero/many files, invalid/unsupported files, progress/cancel, local paths and Windows Explorer entry. |
| Images | JPEG/HEIC/HEIF, EXIF thumbnail and generated thumbnail, rotated images, no GPS, corrupt files, Live Photos/video behavior, cache reuse/removal and worker failure. |
| Map | Both map modes, raster layers, markers/clusters/popups, zoom, Geoman selection, selected photo set, external links and network-failure fallback. |
| Date/chart | Timezone/DST, stored date settings, date bins, chart labels/tooltips, zoom/select, empty data and filtering. Timezone data updates can change historical conversions: record differences. |
| Persistence | Actual splitter coordinates and window bounds after restart, tree selection/scroll, stored settings and pre-upgrade profile copies. Do not assert only that a saved key still exists. |
| Companion | Current public embedded Photo Data Viewer with real JPEG and HEIC paths, title, query options, local-file bridge, resizing and external-browser links under target Electron. |
| Background behavior | Analytics opt-in/configuration, event names/counts, error logging, retry/queue behavior. Use intercepted endpoints or isolated test services so tests do not pollute production. |
| Distribution | Clean install, upgrade over the previous release, launch, quit, reopen, x64/arm64 universal slices, notarization/Gatekeeper, Windows NSIS and Linux AppImage/FUSE. |
| Website | Download buttons, correct OS asset selection, responsive widths, layout and analytics semantics. |

Capture stable reference screenshots before updating dependencies. Use fixed
window sizes, zoom, DPI, locale, timezone and fixtures. Stabilize maps, fonts,
animations and timestamps where possible. Keep a separate live-network smoke
check for maps and the companion. Compare the same OS/rendering environment;
cross-OS font rasterization is not a useful pixel baseline. Review any remaining
Chromium rendering differences instead of increasing screenshot tolerance until
tests pass. Include assertions on geometry, selection and persisted outcomes.

Existing package smoke tests only look for main/renderer log entries after
launch. They do not establish that a map, photo, dialog or updater works. They
also clear the configured log directory. Isolate `userData`, logs, thumbnail
caches and update cache in test-owned directories before running locally; do
not point a baseline or downgrade at the owner's live profile. Retain backups
of test profile copies and compare formats. Changing Chromium can make profile
downgrades unsafe even when application JSON has not changed.

Run relevant checks after each change and the full suite at release checkpoints:

```sh
mise exec -- node --version
mise exec -- npm --version
mise exec -- npm ci
mise exec -- npm ls --all
mise exec -- npm run lint:all
mise exec -- npm run build:src-main
mise exec -- npm run build:dev
mise exec -- npm run build:prod
mise exec -- npm run test:unit:all
# Run only after test-owned profile/log isolation is in place:
mise exec -- npm run test:package
```

Add a documented command for real Electron UI regression checks at U02. A
compatible Playwright 1.64.1 is a candidate harness, not an existing dependency
or a proven Electron 32/45 test setup. Run `npm start` and packaged app flows.
The development source compile does not replace packaged-runtime checks.

`npm run package:mac` can sign/notarize autonomously using existing credentials,
per repository instructions; `test:package` skips notarization. Collect sanitized
codesign, `spctl`, stapler/notary and universal-architecture evidence. Do not log
secret values. If credentials or a physical device are unavailable, finish all
other checks and put the exact remaining action in U12.

Auto-update needs separate coverage: current prerelease versions disable it.
Use an isolated release-like test profile and local/staging feed to exercise old
release → candidate download/install/restart and preservation of settings.
Verify metadata names, checksums, mac zip/dmg and Windows blockmaps; do not point
test builds at a public feed for destructive install tests. If a true signed
public upgrade cannot be verified before release, state that remaining limit
and perform a controlled post-release check after authorization.

## CI and publication behavior to preserve

The Windows workflow intentionally publishes draft artifacts on code pushes to
every branch. Do not remove or further gate this behavior. Plan branch/version
use so candidate artifacts cannot unintentionally replace a stable published
release. Inspect existing drafts before an implementation push. Local
`package:*` scripts pass `--publish never`; manual publishing is a distinct step.
Never clean up expected draft releases as if they were accidental leftovers.

Keep explicit required-check names, document-only filters and the Intel manual
job. Trigger Intel CI before merging changes to Electron, builder, native code
or Mac packaging. Classify failure logs promptly; retry environmental failures
with evidence, not real regressions. Do not run `git clean -fdx` on the user's
working checkout just because disposable CI uses it.

The OS runners are infrastructure, not the app's minimum OS. The official image
inventory now lists `ubuntu-26.04` as generally available. Evaluate that LTS
image separately from the dependency updates, including FUSE/Xvfb and required
check names; retain the 24.04 checkpoint if it fails. `windows-latest` currently
selects Server 2025 / VS 2026, and macOS 26/26-intel are already selected. Record runner image,
Xcode/CLT, Python, FUSE and OS package versions in build evidence instead of
blindly upgrading the owner's machine. Mergify is hosted and has no repository
version to bump. The same applies to hosted fonts/maps/analytics services and
the separate companion deployment; these need integration verification.

## Checkpoints, interruption and autonomy

Before each work unit, after meaningful results, and before stopping, update
STATUS with: active ID, exact HEAD/branch, changed files, runtime versions, last
verified checkpoint, commands/results, evidence locations, open failures,
agent-owned processes and one concrete next action. Record the code SHA in a
subsequent status update, not in its own commit. Keep code and lockfile together.

An incomplete task may be left as uncommitted work, clearly marked unverified.
When asked to stop, stop starting work immediately; save a brief status if
possible without finishing the phase. No correctness claim follows from a pause.
On resume, inspect the actual diff/log/processes and reconcile stale records
before rerunning anything. Never replay a push, release or installation merely
because the last log is incomplete. Preserve unrelated edits; use targeted
reverts, not a destructive reset. Restart from the smallest unblocked action.

Store small sanitized evidence and chosen-version snapshots in this folder.
Keep large logs/images outside tracked source until privacy/size review, with
checksums and recoverable locations. Baseline images used by automated tests
should be committed once sanitized. Do not rely on chat memory, temporary paths
alone, or local assistant memory to resume. Commit planning/evidence records
with implementation checkpoints when implementation is authorized.

Routine API/type/configuration fixes, dependency investigation, tests, local
builds and draft review preparation should proceed autonomously. A blocked
package does not block unrelated work: retain the last verified compatible
version and collect the evidence. User decisions are needed only for changed
behavior/UI, platform support beyond the accepted macOS 13+ minimum, licensing/cost, a substantial maintained
fork, missing credentials/devices, and publication not already authorized.
These are concrete conditions, not reasons to add speculative approval steps.

At U12, report the selected Angular 22 / Node 26 / bundled npm configuration and
macOS 13+ verification, plus any unavoidable exceptions with verified alternatives.
Do not reopen those resolved choices. Include installable artifacts
and a short list of manual checks the agent genuinely cannot perform. Ask for
the remaining choices/actions together. Until answered, keep only dependent
release actions pending; silence is not approval.

## Primary sources

- [Node release index (includes bundled npm)](https://nodejs.org/dist/index.json)
  and [support policy](https://nodejs.org/en/about/previous-releases).
- [Angular compatibility](https://angular.dev/reference/versions),
  [support stages and upgrade policy](https://angular.dev/reference/releases),
  [Zone configuration](https://angular.dev/guide/zoneless), and
  [component change-detection defaults](https://angular.dev/api/core/Component).
- [Electron stable releases](https://releases.electronjs.org/release?channel=stable),
  [schedule](https://releases.electronjs.org/schedule),
  [breaking changes](https://www.electronjs.org/docs/latest/breaking-changes),
  [ESM behavior](https://www.electronjs.org/docs/latest/tutorial/esm), and
  [45.2.1 platform support](https://github.com/electron/electron/blob/v45.2.1/README.md).
- [ECharts v6 migration](https://echarts.apache.org/handbook/en/basics/release-note/v6-upgrade-guide/),
  [Jimp v1 migration](https://jimp-dev.github.io/jimp/guides/migrate-to-v1/), and
  [Bootstrap migration](https://getbootstrap.com/docs/5.3/migration/).
- Exact npm registry endpoints and CI release URLs are saved in
  [evidence/registry-snapshot.json](./evidence/registry-snapshot.json) and
  [evidence/github-releases.json](./evidence/github-releases.json).
