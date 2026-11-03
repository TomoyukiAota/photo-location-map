# Final pre-publication review

Updated: 2026-11-04 (Asia/Tokyo). Each checkpoint carries its actual UTC
observation time and exact tested source; later document heads are separate.

**The implementation and review fixes are verified at c0f0dc9.** All seven
workflow runs across three workflows and eight actual test jobs pass, including
native Intel. Fresh signed/notarized Mac, distribution, updater and Windows-byte
evidence is complete. The documentation corrections are complete at f37956c: all six automatic runs
pass and the latest CodeRabbit review has no new actionable comments. The current
follow-up introduces stable macOS check names; its exact-head checks/review and
owner migration are described below, separately from the verified application source.

The HEIC output, confirmed-folder chooser policy and older-macOS update risk are
accepted decisions. Merge, a stable-version/channel change and application
publication remain unauthorized. The owner reserved the coordinated required-check
replacement described below; no other implementation choice needs reopening.

The November 4 owner review requests indentation fixes and otherwise limits
changes to serious current bugs. The four remaining template attribute layouts
are restored with identical Angular semantics and all eight emitted runtime
JS/HTML/CSS files byte-identical to the previous build and signed c0 bundle.
The other five suggestions are deliberately deferred; see the
[assessment and local proof](./evidence/CLAUDE_REVIEW_FOLLOWUP.json). This does not
relabel the signed artifacts as a later source; source maps can record different
source formatting/locations. Inspect the actual follow-up head's CI/review.

## Candidate and scope

| Item | Selected candidate |
| --- | --- |
| Application version | `1.12.2-alpha`; no release-version bump. |
| Verified application source | [`c0f0dc97f1b7dfd687462c318fea88e585c1a94f`](https://github.com/TomoyukiAota/photo-location-map/commit/c0f0dc97f1b7dfd687462c318fea88e585c1a94f) |
| Platform CI | [REVIEW_CI_CHECKPOINT.json](./evidence/REVIEW_CI_CHECKPOINT.json): head and actual checked-out commit are recorded separately for each job, including PR merge commits. |
| Review | [PR #630 — ready](https://github.com/TomoyukiAota/photo-location-map/pull/630), with no automerge label or native auto-merge request. |
| Framework | Angular core 22.2.4; CLI/Material 22.2.5; TypeScript 6.0.3. |
| Development runtime | Node 26.13.0 with bundled npm 11.20.0, matching Photo Data Viewer. |
| Application runtime | Electron 45.2.1; embedded Node 24.22.1; Chromium 156.0.8078.75. |
| Minimum macOS | 13.0; no older-OS auto-update guard, as explicitly accepted. |
| Approved HEIC | heic-decode 2.1.0 / libheif-js 1.23.5, actual packaged versions/payloads and separately approved pixels asserted. |

The [complete 99-entry inventory](./evidence/IMPLEMENTED_VERSIONS.json),
[retained-version constraints](./EXCEPTIONS.md) and
[HEIC source/security limits](./evidence/HEIC_APPROVED_UPDATE.md) remain available.
NgModules, webpack/CommonJS, Material appearance, map controls and ECharts v5
styling are retained. The actual chart palette now has a direct runtime assertion
in addition to the original screenshot comparisons. Approved HEIC/chooser changes
and time-zone corrections remain material. Optional Dev-only Google Maps lacks a key.

## Verification gates

All current records below identify application source c0f0dc9. Earlier HEIC,
a059f34 and f7afae2 records remain historical and are not relabeled.

| Gate | Status and evidence |
| --- | --- |
| Local runtime, graph, build and lint | **PASS** — [Mac/local checkpoint](./evidence/REVIEW_MAC_CHECKPOINT.json). Dependency versions/lockfile are unchanged; clean npm ci is repeated in each platform CI job. |
| Local unit and lifecycle checks | **PASS** — 209 unit assertions (57 Angular/97 main/55 renderer), five package-runner cases and five actual watcher lifecycle cases. |
| Local visual/functional behavior | **PASS** — all 15 checkout cases and 14 actual signed-app cases; packaged website case intentionally skipped. All 15 original/approved reference files and comparison tolerances are unchanged. |
| Amplitude and snapshot controls | **PASS** — real-SDK manual events/identity and sessions retained, no new page views/URL enrichment, zero captured-payload parse errors. Page-view and enrichment-only negative controls fail independently. Future snapshot updates work; opt-in migration protection rejects updates before launch. |
| Real universal Mac signing/notarization | **PASS** — [fresh identity](./evidence/REVIEW_MAC_CHECKPOINT.json): strict signature, staple, Gatekeeper, exact minimum 13.0, both executable/framework slices and original icon. |
| ZIP/DMG content, metadata and blockmaps | **PASS** — both archives match all 4,754 files and links; metadata hashes/sizes and every chunk verify (11,316 ZIP / 11,625 DMG). |
| Mounted-DMG smoke | **PASS** — 60-second launch observation, main/renderer logging, reported 55-second app session, normal quit, owned-profile cleanup and detach. This is not 60 seconds after readiness. |
| Final ZIP updater transport | **PASS** — exact ZIP download/hash, cache reuse, corrupt-checksum rejection and isolated paths; native installation/signature checks are separate. |
| Native Mac updater fixture | **PASS** — signed candidate-runtime 99.0.1 → 99.0.2 → 99.0.1 install/relaunch/explicit downgrade; production prompt Yes twice and saved setting through four starts. Exact native caches/jobs/preferences cleaned; production signature/fingerprint unchanged afterward. Fixtures have an isolated identity and are not notarized/public old releases or the production-identity ZIP. |
| Windows installed NSIS app | **PASS** — both [CI triggers](./evidence/REVIEW_CI_CHECKPOINT.json), 209 units + five runner + five watcher + 14 packaged cases per job, including actual installed startup with --updated. |
| Windows draft bytes | **PASS** — [dated download](./evidence/REVIEW_WINDOWS_DRAFT_BYTES.json), all three GitHub digests, update metadata, all 6,564 chunks, seven compiled files and five decoder payloads. Read-only inspection; no local EXE execution. |
| Ubuntu AppImage | **PASS** — both triggers, same complete counts; stable check name test (ubuntu), actual Ubuntu 26.04.1. |
| macOS arm64 universal app | **PASS** — push/PR/manual jobs, same complete counts. CI deliberately skips notarization; local real notarization is separate. |
| Native macOS Intel universal app | **PASS** — manual run 41630843941 / job 125899705853 at the same source, same complete counts. No local Rosetta execution is inferred. |
| Experimental Dev-only Google Maps | **OPTIONAL / key unavailable** — not a packaged-Prod blocker. |
| Public-feed/post-release downloads | **NOT RUN / publication unauthorized** — isolated transport/native tests do not prove public release behavior. |

The seven CI runs have no failures or reruns. Hosted CI E2E is nonvisual and skips
the website case; local signed Mac verification performs visual comparisons.
Minimum supported consumer OS versions are not hosted-runner execution targets.
The actual OS/image/architecture, checkout source and counts are recorded per job.
Passing tests do not establish that native/npm security defects are absent.

### Artifact identities and mutable draft

Mac ZIP SHA-256: `111b20b898ff21231d564d5de98879472bcfc46ebb8b4e16533cedb5c7259bca`.
DMG SHA-256: `c4c1740374cb707d29c65073b3ba657cad32c65de5ebc7bb38f3ea890a231a66`.
Full sizes, SHA-512, blockmaps, source fingerprint and exact observations are in
the Mac checkpoint. No manual Mac artifact upload occurred.

The source-c0 Windows draft EXE observation is asset 705454543, SHA-256
`1593def6c08e9f48b9e3441beba9be3581e12b7cb3f2c3616192cd1880cd1bd5`.
The draft is unpublished and mutable. Each later branch push may replace its
assets; this is a dated byte observation, not a promise about later latest-draft
hashes. Revalidate selected source/artifacts before a separately authorized release.

## Approved follow-up and remaining owner-dependent items

The approved HEIC implementation and independent verification are complete.
The HEIC output and confirmed-folder chooser choices are resolved and must not
be asked again. Merge/publication can be reviewed separately with the concrete
source/artifact evidence; neither compatibility choice authorizes release.

### 1. HEIC output and decoder security

**Output change approved and revalidated.** On 2026-11-02 the owner
selected the newer pixel output and authorized updating and revalidating it,
without authorizing publication. The current manifest uses `heic-decode` 2.1.0
and resolves `libheif-js` 1.23.5; the old parent-scoped override is removed.
Actual follow-up results and exact evidence are linked from
[HEIC_APPROVED_UPDATE.md](./evidence/HEIC_APPROVED_UPDATE.md).

The pre-follow-up `f1f0ee5` checkpoint preserved the original thumbnail pixels
with `heic-decode` 2.0.0 and pinned `libheif-js` 1.18.2. That historical pin was
not publication-approved. Its native source is in
the affected ranges of the heap-pixel disclosure and memory-corruption
advisories documented in [EXCEPTIONS.md](./EXCEPTIONS.md#decoder-security-review-2026-11-02).
A host escape against this exact WASM build was not established or tested.

The approved `heic-decode` 2.1.0 / `libheif-js` 1.23.5 selection includes the
reviewed fixes and changes the decoded pixels. In the earlier comparison, the
public 300×400 sample has a
mean absolute RGB-channel difference of approximately 0.135/255 and a maximum
of 12/255. This is one sample, not a bound over all HEIC files. Decoder isolation
and exact hashes are in
[HEIC_DECODER_COMPARISON.json](./evidence/HEIC_DECODER_COMPARISON.json).
The previews below come from that same public fixture; provenance is in the
[fixture README](../../../test/e2e/fixtures/README.md), and dimensions/pixel/file
hashes are in [DECODER_PREVIEWS.json](./evidence/DECODER_PREVIEWS.json).
These previews and comparison hashes preserve the decision's historical
evidence. Fresh worker assertions now match the separately approved reference
and actual shipped decoder versions; original references remain unchanged.

| Historical pixel-preserving decoder 1.18.2 | Approved decoder 1.23.5 comparison |
| --- | --- |
| ![Existing thumbnail](./evidence/decoder-before.jpg) | ![Candidate thumbnail](./evidence/decoder-candidate.jpg) |

The owner accepted the measured output difference, and implementation,
regression checks and fresh packaging are complete. This approval and the
passing tests do not establish that 1.23.5 is security-clean: the latest npm
codec still predates native 1.23.7's
HEVC CPU-exhaustion fix, and current per-file worker restarts impose no decode
timeout. The remaining defect stays disclosed for the later publication decision.
Holding publication while awaiting a suitable upstream fix remains an option;
no unsupported decoder fork or unreviewed timeout policy is included.

The signed artifacts recorded for `f1f0ee5` remain the historical
pixel-preserving checkpoint. The `79d547f` records remain the historical first approved-decoder checkpoint.
The current review records identify freshly verified source `c0f0dc9`; old
records must not be relabeled as evidence for new bytes.

### 2. Native folder-chooser history

**Accepted on 2026-11-03.** After clarification, the owner explicitly selected
the confirmed-folder policy and accepted its starting-location differences.
The earlier clarification question alone was not approval. This subsequent
choice resolves the policy decision, without authorizing merge/publication or
claiming exact native MRU restoration.

The original app let the OS choose the picker's starting location, typically
its last **viewed or navigated** directory. The adapter instead requests the
last **folder itself confirmed in this picker**, saved across app restarts.
CLI and drag-and-drop loads do not update that value. This does not delete OS
history or photo files, reset existing settings, or introduce automatic
photo restoration at startup.

Examples of the policy difference include:

- On first upgrade, the new history value is absent. The picker normally starts
  in Downloads/Home until the user confirms a folder once.
- After confirming A, navigating to B and canceling leaves A as the next
  requested location; Electron does not return B on cancellation.
- Selecting child A while viewing parent P can also differ from the old native
  viewed-location history. The adapter records A; the old OS/backend result is
  not guaranteed to equal A. First-upgrade and cancellation are examples, not
  the complete set of differences.

There is no reliable exact cross-platform migration API. macOS's documented
`NSNavRecentPlaces` read could support a best-effort policy, but its ordering
does not guarantee the last picker/cancel location. Linux portal backends below
version 4 can ignore `defaultPath`, so actual native behavior depends on the
backend. The E2E checks a stubbed dialog's options, real storage and restart;
it does not establish the actual native panel's MRU behavior.

**Selected policy:** retain the confirmed-folder implementation as explicitly
accepted by the owner. No preference heuristic, custom native dialog
or Electron fork is included.
See [NATIVE_CHOOSER_COMPATIBILITY.md](./evidence/NATIVE_CHOOSER_COMPATIBILITY.md)
for the original behavior change, adapter contract and verification scope.

### 3. Google Maps credentials or owner-run confirmation

The Google Maps menu is explicitly experimental and visible only in Dev mode;
the normal packaged Prod application does not expose it. The task environment
has no usable Google Maps API key, so this additional key-backed developer
coverage has not been verified. It is not an unverified packaged-Prod feature
or an automatic publication blocker. If this coverage is desired,
owner-dependent input is a valid test key in a
secure local test configuration. The agent should then perform the remaining
verification. If that access cannot be provided, record an owner-run check of
the existing Google Maps mode and its exact result instead. Do not place a key
in this public decision record. Other independent checks must finish first.

### 4. Coordinated required-check rename

The owner completed the stable `test (ubuntu)` replacement in main's branch
protection; API verification confirms the new context and preserved strict mode
and GitHub Actions bindings. That migration is complete.

The stable macOS rename is also complete. The owner saved main's required
`test (macos-arm64)` context; read-only API verification confirms the GitHub
Actions binding, strict mode and Ubuntu/Windows requirements are preserved.
Manual `test (macos-x64)` is not required. All six f8d9b4c automatic runs pass,
and the related review conversation is resolved. No owner protection action remains.

The owner also explicitly accepted the older-macOS auto-update risk in
[4454038799](https://github.com/TomoyukiAota/photo-location-map/pull/630#discussion_r4454038799).
Minimum macOS remains 13.0 without an auto-update guard. Do not reopen that choice.

### 5. Merge and public release

Merge/public release remains a separate authorization gate under
[PLAN.md](./PLAN.md) and [CLAUDE.md](../../../CLAUDE.md). A later concrete
publication request must identify the final source, artifact checksums and
release/tag treatment, including the existing prerelease updater guard. No
stable-version bump is inferred from this implementation.

The existing v1.12.2-alpha draft is still unpublished and has prerelease=false;
review that channel/tag treatment explicitly before any publication. The
Windows workflow's deliberate draft uploads are already authorized and are
not a new approval item. Angular 22, macOS 13+, the matching Node/bundled-npm
pair and implementation with Sol are settled choices, not questions to reopen.

## Disclosed changes and residual risks

Time-zone data changes from 2022g to 2026f correct converted date/time values
without changing application formatting or selection algorithms. In the 12
recorded samples, Almaty changes from UTC+6 to UTC+5 and Cairo from UTC+2 to
UTC+3 for the sampled July 2026 instant. This is not an exhaustive list of
affected regions/dates. Include this correction in the final change summary;
do not claim every displayed date/time remains numerically identical. See
[TIMEZONE_CHANGES.json](./evidence/TIMEZONE_CHANGES.json).

The refreshed clean npm graph reports 75 propagated advisory entries across
five leaf packages: 30 high, 44 moderate and one low. Supported parent ranges
have no remaining compatible fix identified. Parent constraints and investigated
runtime reachability are recorded in
[AUDIT_DISPOSITION.json](./evidence/AUDIT_DISPOSITION.json). Its zero npm-critical
count does not describe the separate native codec advisories or prove an
absence of exploitable defects. These findings accompany the publication
decision; they are not 75 separate owner approvals. The audit record identifies
the approved decoder's current lockfile hash and the removed historical pin.

## Resume and completion rule

1. Reconcile the actual app source, workflow head and artifact identities with
   this record and STATUS before continuing. Classify failures before reruns.
2. The approved `heic-decode` 2.1.0 / `libheif-js` 1.23.5 follow-up is verified
   at `c0f0dc9` with fresh review/platform/artifact evidence. Do not repeat the approved output question or redo completed
   gates without a new change or unresolved concern. Any later application
   change requires fresh affected tests and artifact identities.
3. The confirmed-folder chooser policy was explicitly accepted on 2026-11-03
   after clarification; do not reopen it. Optional Dev-only credentials remain
   separate from packaged-Prod validation. Independent work and implementation
   compatibility decisions are complete.
4. Keep merge and publication pending; the HEIC implementation approval does
   not authorize them; neither does chooser acceptance. After explicit
   publication authorization, complete the
   public-download/feed checks and record their actual results and limits.
