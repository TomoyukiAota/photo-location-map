# Remove Electron remote through measured implementation stages

## Start here

The final objective is option 3: remove @electron/remote and remove direct Node
access from the main Angular renderer and the separate Photo Data Viewer window,
using explicit application APIs and isolated preloads. Implement and measure
options 1 and 2 as real intermediate checkpoints before option 3.

**Current authorization is to write this plan only. Do not implement, build a
benchmark harness, measure, change dependencies or deploy the viewer until the
owner explicitly starts the implementation work.**

Read AGENTS.md, README.md, docs/CONTRIBUTING.md and the dependency/CI guides.
Then read [STATUS.md](STATUS.md), [PERFORMANCE.md](PERFORMANCE.md) and the
[design investigation](../20261105_dependency-lifecycle-audit/REMOTE_OPTIONS.md).
This plan controls execution; the investigation explains alternatives and
superseded proposals. Keep repository content English and public-safe. Do not
add CLAUDE.md or store handoff knowledge only in agent memory.

## Boundaries and starting snapshot

- Planning date: 2026-11-06, Asia/Tokyo.
- Current documentation branch: codex/dependency-lifecycle-audit.
- Snapshot: cf4fa9b796e3789654cd34c408c7a980967877d5. Its changes after the
  merged runtime are task documents only. The last locally fetched main is
  d57cbfdff69daa5b81635547d2eec585aa3cd277; refresh it at implementation kickoff.
- Node 26.13.0 / bundled npm 11.20.0 via mise; Electron 45.2.1, Angular 22.2.x,
  electron-builder 26.18.1. Record actual resolved versions before measurements.
- Final target: both windows have contextIsolation:true, nodeIntegration:false,
  nodeIntegrationInWorker:false and sandbox:true, with narrow preload APIs.
  Sandbox/preload/module changes are part of the staged design, not a flag-only
  change. C is complete only when C1 and C2 both pass.
- Preserve features, UI, existing screenshot references/tolerances, photo metadata,
  EXIF orientation, settings paths/schema/defaults, analytics/quit behavior,
  auto-update and NSIS/DMG/ZIP/AppImage signing/notarization/release behavior.
- Retain cross-env. Moment/moment-timezone/Temporal and zoneless Angular remain
  outside this work. Do not upgrade unrelated dependencies or adopt prerelease
  release tools. Do not introduce a generic replacement remote/RPC proxy.
- Record webSecurity/CSP/resource-origin settings separately from Node isolation.
  Assess restoring browser defaults deliberately with provider/local-photo tests;
  do not silently expand the scope, preserve permissive settings as a new
  workaround, or claim a complete security audit merely from Node removal.

## Checkpoint discipline

Use implementation commits on a suitable codex/ branch when work is started.
Do not rewrite/remove accepted stage commits. Each accepted stage has a source
SHA, build/artifact hash, harness/protocol/fixture IDs, test results, performance
summary and a recorded decision in STATUS.md. A branch name or a green test
alone is not a checkpoint. Checkpoints do not have to be separate public releases.

At every stage: finish functional verification, measure under PERFORMANCE.md,
review deltas against original 0 and the accepted predecessor, investigate
regressions, and save evidence before advancing. Final C remains the goal;
an intermediate timing win is not permission to stop at 1 or 2.

If a material performance loss persists, fix it within the stage. If completing
the goal requires accepting a performance tradeoff or changing features/UI,
prepare the measured alternatives and consult the owner. Do not silently weaken
acceptance criteria or ask for routine confirmation at every checkpoint.

## 0: Establish the baseline and reusable measurement harness

1. Inspect git status/remotes and any running builds/CI; preserve unrelated
   changes. Refresh main and choose the exact implementation base. If runtime
   code changed since this plan, refresh the inventory and baseline accordingly.
2. Record platform/architecture, Node/npm/Electron versions, main/viewer settings,
   resolved dependencies, fixture hashes and the current served viewer build.
   Inventory main-only calls and renderer Node consumers against current code.
3. Implement the common performance harness and minimal test-only hooks described
   in PERFORMANCE.md. This is future stage-0 work, not already available tooling.
   Keep the remote-based architecture intact. Version instrumentation separately;
   demonstrate that normal launches have no test-hook behavior.
4. Run functional checks and repeated baseline scenarios. Freeze metric meanings,
   run counts, cache definitions, exclusions and regression budgets after observing
   baseline variability but before examining stage-1 results. Record a protocol ID.
5. Preserve the baseline source, runnable production artifact and tracked summary.
   Do not rely on dist/ or release/ surviving later builds.

Gate: a reproducible, functionally correct 0 exists, with valid baseline samples,
no unclassified failures, and a frozen comparison policy. No measured values
exist yet. Last known suite counts are historical evidence, not new stage-0 runs.

## 1 / A: Remove remote with the existing renderer privileges

1. Introduce typed, purpose-specific IPC for startup metadata, native folder
   selection, main-owned EXIF, restart and fixed Windows context-menu operations.
   Derive the dialog parent from the caller; do not pass BrowserWindow objects.
2. Make version/userData/executable metadata available before imports of AppModule,
   currentUserSettings, prerelease detection and analytics. A promise awaited only
   inside the existing bootstrap body is too late for its static imports.
3. Use renderer-local fs-extra/path/os for the existing synchronous settings
   adapter. Keep existing files, keys, errors and call signatures. This is A's
   measured architecture; do not quietly implement B's main-owned settings cache.
4. Keep EXIF parsing and managed-exifr's chunked reader/finally cleanup in main.
   Return selected plain metadata/thumbnail bytes; reconstruct renderer models
   and keep DOM-based rotation there. Preserve the end-to-end queue bound of ten.
5. Keep current renderer/window privileges and the directory Worker. Logging
   already uses main-owned file writing; remove needless main import indirection.
6. Replace production and test consumers, then remove @electron/remote from
   package/lock, its main initialization/window-enable hook and remote bridges.
   Replace remote-identity assertions with genuine IPC/behavior assertions.
   Verify both windows and the packaged production module tree.
7. Run stage verification and measure A versus 0. Save the accepted A artifact
   before changing its storage adapter in B.

Gate: remote is absent, EXIF still runs in main, A's synchronous renderer settings
and privileges are explicit, features/UI pass and performance evidence is accepted.
The A-to-B settings rewrite is intentional intermediate work; reuse contracts and
tests, but do not skip or retrospectively relabel this measured checkpoint.

## 2 / B: Main-owned services and asynchronous persistence

1. Keep A's typed application interface while replacing its settings implementation
   with main-owned per-key persistence and an initialized renderer read cache.
   Keep startup metadata/settings ready before consumer imports and first paint.
2. Maintain file layout/defaults/validation. Update intended keys only; do not
   overwrite main-owned UUID, launch/history or viewer state from a stale snapshot.
   Google Maps key files remain fresh-on-demand, including external edits after
   startup, missing/invalid-file guidance and the existing failure fallback.
3. Define ordered writes, failure propagation and flushing on normal quit, covering
   rapid base-layer/sort/welcome updates as well as the settings Save button.
   Preserve when date/time settings take effect; do not add unintended live updates.
4. Finish persistence/cache operations before relaunch/quit. Separate acknowledgement
   from shutdown; do not require a normal renderer response after app.quit().
   Retain before-quit/will-quit behavior and single-counted analytics/unsent events.
5. Preserve startup/ready-to-show versus renderer analytics readiness. Do not allow
   initial settings flashes or incorrect prerelease endpoints during async boot.
6. Keep unrelated Node integrations/window flags, the directory Worker, EXIF
   placement and HEIC pool behavior. Async IPC must not concentrate heavy
   synchronous parsing/traversal on the main event loop.
7. Test actual renderer-requested settings/cache restart in a separate process,
   not just manual close/relaunch. Measure B versus A and 0; save the checkpoint.

Gate: main owns the migrated persistence, synchronous rendering reads use the
initialized cache, save/quit/restart semantics and failures pass, and comparative
performance is accepted. Renderer Node removal has not yet been claimed.

## 3 / C1: Isolate the main Angular window

1. Implement a purpose-specific preload API and shared TypeScript contracts.
   Use absolute paths derived from app.getAppPath(), not cwd or Angular asset
   URLs. A possible layout is electron-util/preload/main.cjs and viewer.cjs,
   included by the existing electron-util/**/* package rule.
2. Make preload build outputs explicit. Sandbox preloads cannot require arbitrary
   local helpers or fs; produce self-contained/bundled CommonJS entries. Verify
   actual loading from checkout, Vite localhost and installed production paths.
3. Move remaining renderer Node operations behind browser-compatible helpers or
   explicit services. Replace process/platform/test-mode assumptions and existing
   raw IPC subscriptions with narrow calls/events that return unsubscribe handles.
4. Replace the Node-enabled directory Worker with main-owned off-thread execution.
   Retain filtering, tree/sort timestamps, progress, error handling and concurrency.
   Do not run synchronous directory scanning on the main event loop. Leave
   browser decoding/rotation where appropriate and preserve HEIC worker recycling.
5. Remove unused production renderer Node bridges/mappings, then set the main
   window's target isolation/Node/worker/sandbox flags. Validate runtime absence
   of require/Node access and the actual preferences, not just compilation.
6. Validate IPC sender/window/frame and input schemas; do not expose generic
   invoke/send/fs/process/shell access through contextBridge. Adapt test drivers
   that previously used window.require without weakening production isolation.
7. Leave the separate viewer's current settings explicit until C2. Record all
   remaining exceptions; C1 is main-window isolation, not final C.
8. Verify and measure C1 versus B and 0, then save its artifact/evidence.

## 3 / C2: Isolate View Data and finish C

1. Prepare a versioned viewer bridge: handshake, selected-photo metadata/resource,
   display settings and narrow analytics. Preserve the View Data action, separate
   window, title/bounds, JPEG/HEIC, orientation, date/time formatting and links.
2. Compare authorized resource URL delivery with full-byte IPC under the same
   viewer build, decoding and session/cache policy (PERFORMANCE.md). Do not assume
   main must hold a whole photo Buffer, or promise zero-copy/zero main RSS.
   Prefer evaluating stable protocol.handle/net.fetch without consuming/cloning
   the forwarded body. Avoid experimental registerSource/legacy protocol APIs.
3. Bind photo authority to the intended viewer via validated IPC. protocol.handle
   receives a Request, not an IPC event with senderFrame: use a known session and
   high-entropy, selected-photo capability with explicit lifetime/revocation.
   Validate the relevant origin/request context; do not accept arbitrary paths.
4. Adapt viewer file acquisition, buffer/path helpers, process.type detection and
   analytics. Check CORS/CSP/session behavior of its served origin and local resources.
   Revoke capabilities/listeners on navigation, close or crash; test multiple windows.
5. Prepare and verify the backward-compatible viewer BEFORE distributing the C2
   desktop. New viewer supports old hosts/legacy Node path and standalone-browser
   behavior, preferring the versioned bridge when present. New isolated host plus
   old viewer is unsupported and blocks release. Never fall back to re-enabling
   Node silently when the handshake fails.
6. Coordinate any separate viewer production publication under actual user
   authorization. A local/immutable preview may validate integration first; if
   rollout cannot finish, record the exact external action and keep C2 incomplete.
7. Enable the viewer's target isolation/Node/sandbox settings only with a compatible
   viewer. Verify legacy-host compatibility and new-host behavior, using pinned
   viewer build IDs/hashes for measurements. Measure C2 versus C1 and 0.

Gate: C1 and C2 pass, no production remote dependency or renderer Node access
remains, viewer rollout/compatibility is verified, final functionality and
performance evidence are accepted. Intermediate legacy exceptions are resolved.

## Verification and final delivery

Use mise exec -- for commands. After npm ci, run npm run verify:electron serially
before concurrent Electron consumers. Do not run performance work concurrently
with other tests/builds. Commands available now, to run only after implementation
is started and as appropriate to the stage:

```sh
mise exec -- npm ci
mise exec -- npm run verify:runtime
mise exec -- npm run verify:electron
mise exec -- npm ls --all
mise exec -- npm run lint:all
mise exec -- npm run test:dependency-compat
mise exec -- npm run test:unit:all
mise exec -- npm run test:package-runner
mise exec -- npm run test:live-reload
mise exec -- npm run build:prod
mise exec -- npm run test:e2e
```

Preserve meaningful assertions rather than fixed test counts. Add coverage for
IPC/data/error boundaries, bootstrap, normal-quit persistence, real relaunch,
folder parent/cancel/history and network-check timeout, Windows registration,
Maps key edits, EXIF handles, preload isolation and viewer capabilities/lifetimes.
Use test/e2e/README.md for original visual comparisons and signed-bundle commands.
Do not regenerate screenshots or relax tolerances to pass a migration.

Run platform package/smoke and all-OS functional CI for accepted implementation
checkpoints that change production behavior. Use native Intel at final C when
required by AGENTS.md (and record why it is run or not needed); do not dispatch
it repeatedly for document/harness-only changes. Local performance results and
ephemeral GitHub runner durations are not interchangeable benchmarks.

At final C, run actual npm run package:mac in the background and inspect its log;
verify signing, notarization, Gatekeeper, packaged visual E2E and isolated DMG
smoke. npm run test:package skips notarization and does not replace this evidence.
Verify Windows/Linux packaging and unchanged update feeds. Preserve intentional
Windows push draft publishing and classify failed logs before any rerun. Do not
blindly rerun a failure or merge a future PR on the strength of PR634's old approval.

Final delivery: accepted C commit/artifact IDs, completed test/CI/log/annotation
audit, benchmark comparisons and limits, resolved viewer compatibility, remaining
owner decisions, and updated STATUS.md. Prepare a reviewable PR when authorized;
new PR merge and independent production deployment need their own authorization.

## Stop and resume safely

After every meaningful unit of work, update STATUS.md with current files/commit,
the last accepted stage, exact unfinished step, commands/results, artifact/log
locations and the next executable action. Commit source and evidence at coherent
checkpoints; save WIP without claiming acceptance. Do not push private inputs,
local credentials, user-data paths or raw personal-photo logs.

Before stopping, record PID/session ownership and whether each build/test is
running. Stop only task-owned processes safely; preserve pending writes, test
profiles and partial results. Interrupted measurements are INCOMPLETE. Do not
terminate unrelated owner apps or delete dist/release/artifacts blindly.

On resume (Codex, Claude Code or another agent):

1. Read AGENTS.md, this plan, STATUS.md and PERFORMANCE.md; inspect git status,
   branch, log, stage refs and any changes newer than the documents.
2. Inspect recorded processes and live CI before rerunning anything. A stale PID
   may belong to another process; verify command/start time/working directory.
3. Verify source, harness/protocol, fixture, viewer and artifact hashes. If context
   drift changes the comparison, start a new measurement series under the drift
   policy. Do not overwrite the original baseline or accepted summaries.
4. Resume the first unfinished step of the active stage. Do not start over or
   advance because raw logs are unavailable; reconstruct or rerun required evidence.
5. Preserve stage 0 and predecessor artifacts before builds overwrite dist/release.
   Log fixes/decisions and update STATUS before the next pause.
