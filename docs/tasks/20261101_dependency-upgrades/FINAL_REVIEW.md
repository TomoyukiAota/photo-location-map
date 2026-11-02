# Final pre-publication review

Updated: 2026-11-02 (Asia/Tokyo).

**The approved HEIC follow-up is in progress.** On 2026-11-02 the owner approved
adopting the newer decoder's pixel output and proceeding with the update and
fresh verification. This did **not** authorize publication. The chooser policy
still awaits acceptance; the owner's clarification question was not approval.
The completed gates and artifacts below are historical pre-follow-up evidence,
not verification of the newly selected decoder or publication-approved releases.

## Candidate and scope

| Item | Selected candidate |
| --- | --- |
| Application version | `1.12.2-alpha`; no release-version bump is included. |
| Pre-follow-up verified application source | [`f1f0ee575f1890948a31d815f8d8bf85e464e4a7`](https://github.com/TomoyukiAota/photo-location-map/commit/f1f0ee575f1890948a31d815f8d8bf85e464e4a7), with the pixel-preserving decoder. |
| Pre-follow-up code/test workflow head | [`f1f0ee575f1890948a31d815f8d8bf85e464e4a7`](https://github.com/TomoyukiAota/photo-location-map/commit/f1f0ee575f1890948a31d815f8d8bf85e464e4a7) |
| Approved HEIC follow-up | Current manifest: `heic-decode` 2.1.0; resolved `libheif-js` 1.23.5; old parent-scoped pin removed. New verified source/artifact identities are pending. |
| Review | [Draft PR #630](https://github.com/TomoyukiAota/photo-location-map/pull/630) |
| Framework | Angular core 22.2.4; CLI/Material 22.2.5; TypeScript 6.0.3. |
| Development runtime | Node 26.13.0 with its bundled npm 11.20.0, matching Photo Data Viewer. |
| Application runtime | Electron 45.2.1, embedded Node 24.22.1 and Chromium 156.0.8078.75. |
| Minimum macOS | 13, already accepted by the owner. |

The recorded package inventory is in
[IMPLEMENTED_VERSIONS.json](./evidence/IMPLEMENTED_VERSIONS.json), with retained
versions explained in [EXCEPTIONS.md](./EXCEPTIONS.md). The approved decoder
change and its verification progress belong in
[HEIC_APPROVED_UPDATE.md](./evidence/HEIC_APPROVED_UPDATE.md); refresh the final
inventory and identities after that work passes. Each evidence record
identifies its verified source/checkpoint; an earlier checkpoint must not be
presented as proof of a later artifact. The workflow head and application source
are recorded separately so CI-only changes do not obscure artifact provenance.

The work preserves the app's existing architecture, controls and interactions,
with original screenshot references retained. It does **not** claim that every
output or native-dialog detail is identical: the approved HEIC output change,
pending chooser policy and time-zone corrections below remain material. The
optional experimental Dev-only Google Maps check lacks a valid key.

## Verification gates

The recorded passes below precede the approved HEIC update and describe only
their exact sources. They do not establish that `heic-decode` 2.1.0 /
`libheif-js` 1.23.5 passes these gates. Fresh affected verification and artifacts
remain required. The native Intel record is additionally an earlier checkpoint.

| Gate | Recorded status | Evidence and limit |
| --- | --- | --- |
| Approved HEIC follow-up | **IN PROGRESS — fresh passes not yet recorded here** | [Approved update record](./evidence/HEIC_APPROVED_UPDATE.md); continue implementation, regression and distribution verification. |
| Dependency/framework local checkpoint | **PASS at its recorded checkpoint** | [LOCAL_FINAL_CHECKPOINT.json](./evidence/LOCAL_FINAL_CHECKPOINT.json): clean installation, valid graph, build/lint, 194 unit assertions, 15 visual/functional cases and watcher/development checks. It identifies its own application commit. |
| Final universal Mac build and real notarization | **PASS for f1f0ee5** | Deep strict codesign, stapler and Gatekeeper pass; [artifact identity/checksums](./evidence/FINAL_MAC_CHECKPOINT.json). Both [extracted distributions](./evidence/FINAL_DISTRIBUTION_BUNDLES.json) match all 4,754 source-bundle files and symlinks and retain valid signatures/tickets. |
| Actual final packaged Mac app | **PASS for f1f0ee5** | 14 visual/functional cases pass; the website-only case is skipped. Packaged/Prod mode, executable/resources, dependencies, runtime and isolated profile are verified in the [Mac checkpoint](./evidence/FINAL_MAC_CHECKPOINT.json). |
| Final signed ZIP updater transport | **PASS for f1f0ee5** | [Final ZIP report](./evidence/FINAL_ZIP_TRANSPORT_CHECKPOINT.json): download/cache/checksum handling; see the [harness limits](../../../test/updater/README.md). |
| Final DMG launch, smoke and cleanup | **PASS for f1f0ee5** | Main/renderer log through 60 seconds, followed by normal quit and detach; [report](./evidence/FINAL_MAC_CHECKPOINT.json). |
| Isolated native updater fixture | **PASS for f1f0ee5 candidate runtime** | [Actual signed native install/relaunch/rollback and settings](./evidence/NATIVE_UPDATE_FIXTURE_CHECKPOINT.json). Separate test identity and 99.0.1/99.0.2 versions; production bundle unchanged. Exact native caches/jobs/preferences cleaned. |
| Windows installed NSIS application | **PASS at f1f0ee5** | [CI](./evidence/FINAL_WINDOWS_CI.json): both triggers pass 194 units, install smoke and 14 E2E cases. Actual push draft upload and [downloaded bytes](./evidence/FINAL_WINDOWS_DRAFT_BYTES.json) are verified. |
| Ubuntu created AppImage | **PASS at f1f0ee5** | [Both CI runs](./evidence/FINAL_UBUNTU_CI.json) pass 194 units, AppImage smoke and 14 packaged E2E cases. Required-check name remains test (ubuntu-24.04); runner is 26.04. |
| macOS arm64 created universal app | **PASS at f1f0ee5** | [Push and PR](./evidence/FINAL_MAC_CI.json) pass 194 units, universal smoke and 14 actual packaged cases. |
| Native macOS Intel created universal app | **PASS at 872699e** | [Explicit native Intel run](./evidence/FINAL_MAC_CI.json) passes the same gates. The only later app-source change is guarded to win32; no exact-f1 Intel execution is claimed. Local Rosetta is unavailable. |
| Experimental Dev-only Google Maps with a valid key | **OPTIONAL ADDITIONAL DEVELOPER COVERAGE — key unavailable** | Hidden in packaged Prod mode; see the owner-dependent item below. |
| Production public-feed upgrade and post-release downloads | **NOT RUN — publication not authorized** | Perform the controlled post-publication checks after authorization; isolated transport/native fixtures do not prove this gate. |

CI targets actual created/installed applications, while checkout/development
verification is recorded separately. Cross-OS CI does not compare macOS pixel
references. Local signed/notarized verification is separate from CI package tests
that deliberately skip notarization. Consult [STATUS.md](./STATUS.md) and the
[PR checks](https://github.com/TomoyukiAota/photo-location-map/pull/630/checks)
for progress; do not infer success from a running or superseded job.

### Pre-follow-up artifact inventory

These artifacts contain the old decoder. Their identities remain evidence for
that checkpoint; they must not be relabeled as artifacts of the approved update.

| Artifact/evidence | State |
| --- | --- |
| `Photo Location Map-1.12.2-alpha-universal.dmg` | [Final checksums/signature/smoke](./evidence/FINAL_MAC_CHECKPOINT.json). |
| `Photo Location Map-1.12.2-alpha-universal-mac.zip` | [Final checksums](./evidence/FINAL_MAC_CHECKPOINT.json) and [transport](./evidence/FINAL_ZIP_TRANSPORT_CHECKPOINT.json). |
| Windows installer/draft artifact | [CI](./evidence/FINAL_WINDOWS_CI.json) and [observed draft asset/checksums/payload](./evidence/FINAL_WINDOWS_DRAFT_BYTES.json). Unpublished. |
| Linux AppImage | [Actual packaged CI results](./evidence/FINAL_UBUNTU_CI.json). No remote Linux artifact upload/download or persisted AppImage checksum is claimed. |
| Native fixture report and cleanup | [Passed; scope and cleanup](./evidence/NATIVE_UPDATE_FIXTURE_CHECKPOINT.json). |

Keep each built bundle unchanged while verifying it. The approved decoder
change requires a fresh build, affected tests, signing/notarization and new
artifact identities; an earlier signature/checksum record does not transfer.

## Approved follow-up and remaining owner-dependent items

Complete the approved HEIC implementation and independent verification before
presenting the remaining chooser/publication choices together. The HEIC output
choice is resolved and must not be asked again. Updated artifacts and their
actual results are still the agent's work.

### 1. HEIC output and decoder security

**Output change approved; fresh verification pending.** On 2026-11-02 the owner
selected the newer pixel output and authorized updating and revalidating it,
without authorizing publication. The current manifest uses `heic-decode` 2.1.0
and resolves `libheif-js` 1.23.5; the old parent-scoped override is removed.
Track the actual follow-up results in
[HEIC_APPROVED_UPDATE.md](./evidence/HEIC_APPROVED_UPDATE.md).

The pre-follow-up `f1f0ee5` checkpoint preserved the original thumbnail pixels
with `heic-decode` 2.0.0 and pinned `libheif-js` 1.18.2. That historical pin was
not publication-approved. Its native source is in
the affected ranges of the heap-pixel disclosure and memory-corruption
advisories documented in [EXCEPTIONS.md](./EXCEPTIONS.md#decoder-security-review-2026-11-02).
A host escape against this exact WASM build was not established or tested.

The earlier decoder comparison found that `heic-decode` 2.1.0 with
`libheif-js` 1.23.5 includes those fixes but changes the decoded pixels. The
public 300×400 sample has a
mean absolute RGB-channel difference of approximately 0.135/255 and a maximum
of 12/255. This is one sample, not a bound over all HEIC files. Decoder isolation
and exact hashes are in
[HEIC_DECODER_COMPARISON.json](./evidence/HEIC_DECODER_COMPARISON.json).
The previews below come from that same public fixture; provenance is in the
[fixture README](../../../test/e2e/fixtures/README.md), and dimensions/pixel/file
hashes are in [DECODER_PREVIEWS.json](./evidence/DECODER_PREVIEWS.json).
These previews and comparison hashes preserve the decision's historical
evidence. The approved output/reference update requires its own recorded
verification; the historical comparison is not a fresh application pass.

| Historical pixel-preserving decoder 1.18.2 | Approved decoder 1.23.5 comparison |
| --- | --- |
| ![Existing thumbnail](./evidence/decoder-before.jpg) | ![Candidate thumbnail](./evidence/decoder-candidate.jpg) |

The owner has accepted the measured output difference; implementation,
regression checks and fresh packaging should continue autonomously. This
approval does not establish that 1.23.5 is security-clean: the latest npm codec
still predates native 1.23.7's
HEVC CPU-exhaustion fix, and current per-file worker restarts impose no decode
timeout. The remaining defect stays disclosed for the later publication decision.
Holding publication while awaiting a suitable upstream fix remains an option;
no unsupported decoder fork or unreviewed timeout policy is included.

The signed artifacts recorded for `f1f0ee5` still contain the pixel-preserving
pin. They do not verify the newly approved decoder. New verification, signing
and artifact checksums are pending work for the agent, not a reason to reopen
the approved output choice.

### 2. Native folder-chooser history

**Pending, not approved.** The owner's response asked for clarification and
must not be recorded as acceptance.

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

**Recommendation:** retain the confirmed-folder policy subject to the owner's
acceptance of this distinction. No preference heuristic, custom native dialog
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

### 4. Merge and public release

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

The pre-follow-up clean npm graph reports 75 propagated advisory entries across five leaf
packages: 30 high, 44 moderate and one low. Supported parent ranges have no
remaining compatible fix identified. Parent constraints and investigated
runtime reachability are recorded in
[AUDIT_DISPOSITION.json](./evidence/AUDIT_DISPOSITION.json). Its zero npm-critical
count does not describe the separate native codec advisories or prove an
absence of exploitable defects. These findings accompany the publication
decision; they are not 75 separate owner approvals. Refresh the audit for the
approved decoder update rather than assuming the historical count is current.

## Resume and completion rule

1. Reconcile the actual app source, workflow head and artifact identities with
   this record and STATUS before continuing. Classify failures before reruns.
2. Continue the approved `heic-decode` 2.1.0 / `libheif-js` 1.23.5 update and
   affected local, platform and distribution verification autonomously. The
   owner approved its newer pixel output on 2026-11-02; do not ask that question
   again. Record new source/artifact identities only after actual verification.
3. Keep chooser acceptance pending: the owner's follow-up was a question, not
   approval. Optional Dev-only credentials are separate from packaged-Prod
   validation. Collect remaining owner-only choices after independent work.
4. Keep merge and publication pending; the HEIC implementation approval does
   not authorize them. After explicit publication authorization, complete the
   public-download/feed checks and record their actual results and limits.
