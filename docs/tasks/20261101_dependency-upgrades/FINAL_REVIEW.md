# Final pre-publication review

Updated: 2026-11-02 (Asia/Tokyo).

**Draft decision record: verification is still in progress. This document does
not request or record publication approval.** Complete the pending gates and
attach their final evidence before presenting the remaining owner items
together. No public release has been published.

## Candidate and scope

| Item | Selected candidate |
| --- | --- |
| Application version | `1.12.2-alpha`; no release-version bump is included. |
| Application source | [`d24da891ebc6d8cef1b1f392e651c65df47689b4`](https://github.com/TomoyukiAota/photo-location-map/commit/d24da891ebc6d8cef1b1f392e651c65df47689b4) |
| Code/test workflow head | [`872699eab2b7c80c6cdf3c33e036923eb6f71bf0`](https://github.com/TomoyukiAota/photo-location-map/commit/872699eab2b7c80c6cdf3c33e036923eb6f71bf0) |
| Review | [Draft PR #630](https://github.com/TomoyukiAota/photo-location-map/pull/630) |
| Framework | Angular core 22.2.4; CLI/Material 22.2.5; TypeScript 6.0.3. |
| Development runtime | Node 26.13.0 with its bundled npm 11.20.0, matching Photo Data Viewer. |
| Application runtime | Electron 45.2.1, embedded Node 24.22.1 and Chromium 156.0.8078.75. |
| Minimum macOS | 13, already accepted by the owner. |

The complete package inventory is in
[IMPLEMENTED_VERSIONS.json](./evidence/IMPLEMENTED_VERSIONS.json), with retained
versions explained in [EXCEPTIONS.md](./EXCEPTIONS.md). Each evidence record
identifies its verified source/checkpoint; an earlier checkpoint must not be
presented as proof of a later artifact. The workflow head and application source
are recorded separately so CI-only changes do not obscure artifact provenance.

The work preserves the app's existing architecture, controls and interactions,
with original screenshot references retained. It does **not** claim that every
output or native-dialog detail is identical: the chooser limits and time-zone
corrections below remain material, and live Google Maps validation is incomplete.

## Verification gates

Statuses below describe the recorded state, not an expected future result.
Replace pending evidence fields only after inspecting the actual result.

| Gate | Current status | Evidence and limit |
| --- | --- | --- |
| Dependency/framework local checkpoint | **PASS at its recorded checkpoint** | [LOCAL_FINAL_CHECKPOINT.json](./evidence/LOCAL_FINAL_CHECKPOINT.json): clean installation, valid graph, build/lint, 194 unit assertions, 15 visual/functional cases and watcher/development checks. It identifies its own application commit. |
| Final universal Mac build and real notarization | **PASS for d24da89** | Deep strict codesign, stapler and Gatekeeper pass; [artifact identity/checksums](./evidence/FINAL_MAC_CHECKPOINT.json). Both [extracted distributions](./evidence/FINAL_DISTRIBUTION_BUNDLES.json) match all 4,754 source-bundle files and symlinks and retain valid signatures/tickets. |
| Actual final packaged Mac app | **PASS for d24da89** | 14 visual/functional cases pass; the website-only case is skipped. Packaged/Prod mode, executable/resources, dependencies, runtime and isolated profile are verified in the [Mac checkpoint](./evidence/FINAL_MAC_CHECKPOINT.json). |
| Final signed ZIP updater transport | **PASS for d24da89** | [Final ZIP report](./evidence/FINAL_ZIP_TRANSPORT_CHECKPOINT.json): download/cache/checksum handling; see the [harness limits](../../../test/updater/README.md). |
| Final DMG launch, smoke and cleanup | **PASS for d24da89** | Main/renderer log through 60 seconds, followed by normal quit and detach; [report](./evidence/FINAL_MAC_CHECKPOINT.json). |
| Isolated native updater fixture | **PASS for d24da89 candidate runtime** | [Actual signed native install/relaunch/rollback and settings](./evidence/NATIVE_UPDATE_FIXTURE_CHECKPOINT.json). Separate test identity and 99.0.1/99.0.2 versions; production bundle unchanged. Exact native caches/jobs/preferences cleaned. |
| Windows installed NSIS application | **RUNNING at 872699e** | Package/install smoke passes; corrected installed-app E2E and draft publishing remain. |
| Ubuntu created AppImage | **PASS at 872699e** | [Push](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41403158101) and [PR](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41403166901) pass 194 units and 14 packaged E2E cases. Required-check name remains `test (ubuntu-24.04)`; the runner is 26.04. |
| macOS arm64 created universal app | **RUNNING at 872699e** | Install/unit/watcher gates pass; package and corrected actual-app E2E remain. |
| Native macOS Intel created universal app | **RUNNING at 872699e** | Fresh [manual run](https://github.com/TomoyukiAota/photo-location-map/actions/runs/41403163570) passes install/units/watcher and is packaging. Rosetta is unavailable locally. |
| Experimental Dev-only Google Maps with a valid key | **OPTIONAL ADDITIONAL DEVELOPER COVERAGE — key unavailable** | Hidden in packaged Prod mode; see the owner-dependent item below. |
| Production public-feed upgrade and post-release downloads | **NOT RUN — publication not authorized** | Perform the controlled post-publication checks after authorization; isolated transport/native fixtures do not prove this gate. |

CI targets actual created/installed applications, while checkout/development
verification is recorded separately. Cross-OS CI does not compare macOS pixel
references. Local signed/notarized verification is separate from CI package tests
that deliberately skip notarization. Consult [STATUS.md](./STATUS.md) and the
[PR checks](https://github.com/TomoyukiAota/photo-location-map/pull/630/checks)
for progress; do not infer success from a running or superseded job.

### Final artifact inventory to complete

| Artifact/evidence | State |
| --- | --- |
| `Photo Location Map-1.12.2-alpha-universal.dmg` | [Final checksums/signature/smoke](./evidence/FINAL_MAC_CHECKPOINT.json). |
| `Photo Location Map-1.12.2-alpha-universal-mac.zip` | [Final checksums](./evidence/FINAL_MAC_CHECKPOINT.json) and [transport](./evidence/FINAL_ZIP_TRANSPORT_CHECKPOINT.json). |
| Windows installer/draft artifact | Final CI result, exact artifact identity and evidence link pending. |
| Linux AppImage | Final CI result, exact artifact identity and available evidence link pending. |
| Native fixture report and cleanup | [Passed; scope and cleanup](./evidence/NATIVE_UPDATE_FIXTURE_CHECKPOINT.json). |

Keep the final production bundle unchanged during verification. Any later
runtime/source change requires the affected tests and artifacts to be rebuilt
and reverified; an earlier signature/checksum record does not transfer to it.

## Remaining owner-dependent items

These are the items to present together **after independent verification**.
They are recorded now so work can stop and resume without losing the decisions.

### 1. HEIC output and decoder security

The current candidate preserves the original thumbnail pixels with
`heic-decode` 2.0.0 and a parent-scoped `libheif-js` 1.18.2 pin. That pin is
**not publication-approved by this investigation**. The native source is in
the affected ranges of the heap-pixel disclosure and memory-corruption
advisories documented in [EXCEPTIONS.md](./EXCEPTIONS.md#decoder-security-review-2026-11-02).
A host escape against this exact WASM build was not established or tested.

The tested alternative, `heic-decode` 2.1.0 with `libheif-js` 1.23.5, includes
those fixes but changes the decoded pixels. The public 300×400 sample has a
mean absolute RGB-channel difference of approximately 0.135/255 and a maximum
of 12/255. This is one sample, not a bound over all HEIC files. Decoder isolation
and exact hashes are in
[HEIC_DECODER_COMPARISON.json](./evidence/HEIC_DECODER_COMPARISON.json).
The previews below come from that same public fixture; provenance is in the
[fixture README](../../../test/e2e/fixtures/README.md), and dimensions/pixel/file
hashes are in [DECODER_PREVIEWS.json](./evidence/DECODER_PREVIEWS.json).
Original test references are unchanged.

| Pixel-preserving decoder 1.18.2 | Candidate decoder 1.23.5 |
| --- | --- |
| ![Existing thumbnail](./evidence/decoder-before.jpg) | ![Candidate thumbnail](./evidence/decoder-candidate.jpg) |

**Recommended direction:** accept the measured newer-decoder output difference
and its security improvements, then let the agent perform the corresponding
update, regression checks and fresh packaging. This does not establish that
1.23.5 is security-clean: the latest npm codec still predates native 1.23.7's
HEVC CPU-exhaustion fix, and current per-file worker restarts impose no decode
timeout. The remaining defect and publication timing need an explicit decision.
Holding publication while awaiting a suitable upstream fix remains an option;
no unsupported decoder fork or unreviewed timeout policy is included.

The currently signed artifact still contains the pixel-preserving pin. Choosing
the newer decoder therefore requires new verification, signing and artifact
checksums. Those follow-up tasks belong to the agent, not the owner.

### 2. Native folder-chooser history

The compatibility adapter restores the last **confirmed folder** as the next
picker's starting directory, without changing the picker controls or
automatically restoring photos at app startup. Two supported-API limits remain:

- On first upgrade, application-managed history does not exist and the old OS
  history cannot be reliably migrated; the picker can start in Downloads/Home.
- Moving elsewhere and canceling does not expose that directory to the app;
  next time, the last confirmed folder is restored instead.

**Recommendation:** accept these two limits to retain the current supported
Electron runtime. No private-preference heuristic or Electron fork is included.
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

### 4. Merge and public release

Merge/public release remains a separate authorization gate under
[PLAN.md](./PLAN.md) and [CLAUDE.md](../../../CLAUDE.md). A later concrete
publication request must identify the final source, artifact checksums and
release/tag treatment, including the existing prerelease updater guard. No
stable-version bump is inferred from this implementation.

The Windows workflow's deliberate draft uploads are already authorized and are
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

The clean npm graph reports 75 propagated advisory entries across five leaf
packages: 30 high, 44 moderate and one low. Supported parent ranges have no
remaining compatible fix identified. Parent constraints and investigated
runtime reachability are recorded in
[AUDIT_DISPOSITION.json](./evidence/AUDIT_DISPOSITION.json). Its zero npm-critical
count does not describe the separate native codec advisories or prove an
absence of exploitable defects. These findings accompany the publication
decision; they are not 75 separate owner approvals.

## Resume and completion rule

1. Reconcile the actual app source, workflow head and artifact identities with
   this record and STATUS before continuing. Classify failures before reruns.
2. Finish the running independent gates, insert sanitized final evidence and
   checksum links, and provide the public-fixture image comparison.
3. Present the four owner-dependent items together only when that result is
   concrete and reviewable. Keep dependent publication actions pending while
   continuing any independent work; silence is not approval.
4. Apply an accepted codec choice and repeat its affected verification/artifact
   gates autonomously. After explicit publication authorization, complete the
   public-download/feed checks and record their actual results and limits.
