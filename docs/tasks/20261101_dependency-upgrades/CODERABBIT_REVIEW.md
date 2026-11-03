# CodeRabbit review follow-up

Updated: 2026-11-03 (Asia/Tokyo).

The owner authorized marking PR #630 ready for review and addressing CodeRabbit
findings. The PR is ready, with no automerge label or native auto-merge request.
Merge and application release remain unauthorized. The accepted HEIC output
and confirmed-folder policy are unchanged.

Current verified application source is **c0f0dc9**. All seven workflow runs/eight
actual jobs, including native Intel, pass. Fresh local/signed/distribution/updater
and Windows-byte evidence is complete in the three REVIEW checkpoint records.
All thirteen known CodeRabbit findings are addressed. The f37956c documentation
head passes six automatic runs and its latest review has no new actionable comments.
The current follow-up changes macOS check names only, as described below. Earlier
sections describe the sequence of source checkpoints, not pending implementation.

The initial [review](https://github.com/TomoyukiAota/photo-location-map/pull/630#pullrequestreview-5746382588)
covered the diff from 911dd91 to 7e2722d and posted six actionable findings.
CodeRabbit selected 171 files, filtered 15 paths and reported three unavailable
historical JSON diffs. Its separate docstring check was inconclusive because of
coverage/file limits; this is not recorded as a passing check or a request to
generate unrelated comments. The full review body contained no additional
out-of-diff or nitpick findings.

## Initial findings

All six findings were verified, implemented in a059f34 and replied to with
concrete validation. All seven workflow runs/eight actual test jobs pass at that
source, including native Intel. CodeRabbit explicitly resolved all six threads.
The separate [review CI checkpoint](./evidence/REVIEW_HISTORICAL_CI.json)
records the actual a059f34 and f7afae2 runs and job identities. The older
HEIC_CI_CHECKPOINT.json remains evidence only for source 79d547f.
Later findings/preferences below require a new final artifact checkpoint.

| Comment | Change | Local verification |
| --- | --- | --- |
| [4450217554](https://github.com/TomoyukiAota/photo-location-map/pull/630#discussion_r4450217554) | Correct both Ubuntu requested runner labels to ubuntu-26.04; preserve the ubuntu-24.04 required-check name and historical run identities. | Workflow label checked; JSON parses; correction annotated. |
| [4450217560](https://github.com/TomoyukiAota/photo-location-map/pull/630#discussion_r4450217560) | Require the complete macOS minimum value 13.0. | Actual signed bundle passes; a controlled 13.3 plist response is rejected without modifying the bundle. |
| [4450217592](https://github.com/TomoyukiAota/photo-location-map/pull/630#discussion_r4450217592) | Relaunch for compiled main-process JS/CJS/MJS changes, once per compilation burst; retain arguments and non-code renderer reload. | Four real Electron lifecycle cases pass, including a loaded sibling module changing from before to after in the new process; a controlled pending-quit burst queues one relaunch. |
| [4450217600](https://github.com/TomoyukiAota/photo-location-map/pull/630#discussion_r4450217600) | Bound saved-directory inspection to one second and reuse the same pending per-path check until underlying I/O settles. | Fourteen history cases pass in both main and renderer, including never-resolving lookup, no concurrent/repeated fan-out, late success/rejection and another selection. |
| [4450217607](https://github.com/TomoyukiAota/photo-location-map/pull/630#discussion_r4450217607) | Derive the welcome-dialog expected version from manifest.version. | All 15 real visual/functional cases pass with original snapshots and tolerances. |
| [4450217611](https://github.com/TomoyukiAota/photo-location-map/pull/630#discussion_r4450217611) | Reject report/artifact identity collisions before launching the updater test. | Same path, symlink, hard link and case alias are rejected with input bytes intact; a distinct report passes preflight. No Electron app is launched by these negative controls. Full transport with the retained source-79d signed ZIP and a distinct report also passes; this does not verify a new artifact. |

## Validation and limits

Production build and lint pass. All 204 unit assertions pass: 57 Angular,
92 main and 55 renderer. The full 15-case checkout visual/functional suite
passes. Original image references, tolerances, dependencies and lockfile are
unchanged. Local raw logs use the ignored `coderabbit-` prefix.

Node cannot cancel a stalled fs.stat operation. The folder fix bounds picker
waiting and prevents more pending I/O for that same path; it does not claim to
cancel the OS request. A late result releases the entry for a later retry.
The one-second availability fallback preserves confirmed history and its normal
successful-directory behavior.

The existing source-79d547f signed artifacts remain historical. Before presenting
new artifacts as verified, rebuild and repeat affected package/visual, signature,
distribution-content, updater transport and native-fixture gates. Preserve exact
source/checksum and CI provenance; no earlier identity transfers to changed code.
Known npm/native decoder security limitations remain disclosed.

## Resume

Inspect the actual branch/diff, STATUS and the ignored review inbox
`.upgrade-artifacts/coderabbit-review-inbox.json`. Batch the implemented fixes,
reply to each thread with the committed change and actual validation, and collect
the incremental review. Resolve discussions only after their findings have been
addressed; do not enable CodeRabbit autofix, request blanket resolution/approval,
merge or publish the application as part of this review cycle.

## Additional CodeRabbit findings

| Comment | Change and verification |
| --- | --- |
| [4450334838](https://github.com/TomoyukiAota/photo-location-map/pull/630#discussion_r4450334838) | Describe seven workflow runs across three workflow definitions, preserving the actual eight test jobs and all recorded identities/results. |
| [4450334855](https://github.com/TomoyukiAota/photo-location-map/pull/630#discussion_r4450334855) | Load the public ECharts CommonJS build used by the official v5 theme, so ngx-echarts and the theme share one registry. An actual-loader-namespace probe failed before the fix with #5070dd, then passed with #5470c6 and all nine v5 palette entries. Namespace methods are directly available. Build and two focused visual/interaction cases pass; source maps show one core rather than duplicate ESM/CJS cores. |

The palette finding exposed a gap in earlier screenshot-only verification:
small palette differences fit inside the existing tolerance. The new direct
resolved-option assertion closes that gap without changing references/tolerances.
The read-only probe is gated to E2E mode and uses the exact namespace returned
to ngx-echarts, not another installed ECharts instance or Webpack internals.

## Owner review comments

| Comment | Disposition |
| --- | --- |
| [4450638829](https://github.com/TomoyukiAota/photo-location-map/pull/630#discussion_r4450638829) | Group all test scripts and place test:all last; all command values and parsed manifest values remain unchanged. |
| [4450672707](https://github.com/TomoyukiAota/photo-location-map/pull/630#discussion_r4450672707) | Follow Amplitude v2's ordinary additive default event set. Preserve manual action/category/label/value and per-device IDs; pass deviceId at initialization. Keep remote configuration and separate SDK diagnostics disabled; do not opt into autocapture:true's extra features. Real-SDK positive and foreign-identity negative checks pass. |
| [4450683481](https://github.com/TomoyukiAota/photo-location-map/pull/630#discussion_r4450683481) | Explained that the three Mixpanel flags explicitly preserve behavior and already equal installed 2.84 defaults. This question does not enable capture/replay or require changing their values. |
| [4451043354](https://github.com/TomoyukiAota/photo-location-map/pull/630#discussion_r4451043354) | Restore the original multiline attribute alignment. The Angular control-flow migration introduced formatting changes; its explicit generator supports format:false but no alignment-style setting. Existing template lint does not enforce this indentation and no formatter is configured. DOM expressions/control flow and non-whitespace template content remain unchanged. |
| [4451183542](https://github.com/TomoyukiAota/photo-location-map/pull/630#discussion_r4451183542) | Explained the current required-check key and a coordinated stable-name migration. Read-only inspection confirmed strict, admin-enforced protection with GitHub Actions bindings; no branch-protection or required-check setting was changed. This optional rename is separate from implementation correctness. |
| [4451203663](https://github.com/TomoyukiAota/photo-location-map/pull/630#discussion_r4451203663) | Confirmed this static landing page uses Bootstrap CSS styling, regular links and its retained download.js. Bootstrap JS is still needed for its interactive plugin components, which this page does not use. |

Amplitude v2 is not a literal superset of every SDK-generated metadata property.
Its [documented attribution/UA enrichment](https://amplitude.com/docs/sdks/analytics/browser/migrate-from-marketing-analytics-to-browser-sdk-2-0)
differs from v1; the preserved contract
is PLM's manual events and identity, with additional default events as requested.
The ordinary default set includes page views, sessions, forms, downloads and URL
enrichment. The explicit autocapture:true option would additionally enable
element/frustration/network/web-vitals capture; that option is not selected.
See the [SDK default-feature documentation](https://amplitude.com/docs/sdks/analytics/browser/browser-sdk-2/instrument-and-configure#autocapture).
Current source/identity test evidence is retained
under the ignored owner-amplitude-defaults prefix. Mixpanel collection is unchanged.

Full validation and a fresh signed/distribution/native-update checkpoint are
required for the combined production changes before this review is complete.

The combined local production build, lint, 204 unit assertions and all 15
visual/functional cases now pass. Original snapshots/tolerances and dependency
versions/lockfile are unchanged; the manifest change only reorders scripts.
The second source checkpoint will be pushed for incremental review, full
platform CI and rebuilt signed artifacts before closing this cycle.

## Subsequent owner review (2026-11-03)

The preceding additive-default description records the earlier preference.
The owner subsequently excluded the newly introduced Amplitude local-URL
behavior after its privacy implications were identified. Published 1.6.7 source
installs Context, IdentityEventSender and Destination; it installs neither page
views nor page URL enrichment. Installed 2.49.0 enables both when unset.
Disable only `autocapture.pageViews` and `autocapture.pageUrlEnrichment`, without
adding a replacement page-view event. Preserve other ordinary defaults and the
existing manual events/identity. The real-SDK regression now examines captured
payloads for the URL-bearing property keys and file URLs, as well as requiring
session_start and unchanged manual fields. A separate opt-in negative control
initializes an unprotected SDK instance to prove the URL regression is detected.
Sources: [Amplitude configuration](https://amplitude.com/docs/sdks/analytics/browser/browser-sdk-2/instrument-and-configure),
published [1.6.7 package](https://registry.npmjs.org/@amplitude/analytics-browser/-/analytics-browser-1.6.7.tgz)
and [2.49.0 package](https://registry.npmjs.org/@amplitude/analytics-browser/-/analytics-browser-2.49.0.tgz).

| Comment | Disposition / remaining gate |
| --- | --- |
| [4452060880](https://github.com/TomoyukiAota/photo-location-map/pull/630#discussion_r4452060880) | Added separate exact-source CI evidence for a059f34 and f7afae2; retain the earlier HEIC evidence as historical. |
| [4452060887](https://github.com/TomoyukiAota/photo-location-map/pull/630#discussion_r4452060887), owner 4452354099 | Remove the newly introduced automatic page views and page URL enrichment; no replacement page-view event. Real-SDK positive check passes; independent page-view and enrichment-only negative controls fail as intended. Manual fields/IDs and session_start pass; intercepted payload parse errors are zero. |
| [4452093473](https://github.com/TomoyukiAota/photo-location-map/pull/630#discussion_r4452093473) | Omit the three redundant Mixpanel options as requested. Installed 2.84 defaults remain autocapture=false, track_pageview=false and record_sessions_percent=0; existing explicit-event regression still applies. |
| [4452279175](https://github.com/TomoyukiAota/photo-location-map/pull/630#discussion_r4452279175) | Prepare the stable literal test (ubuntu) job name and matching Mergify conditions. The owner will replace the protected context after the new check succeeds and readiness is reported in the Codex chat. Do not modify remote protection settings. |
| [4452321488](https://github.com/TomoyukiAota/photo-location-map/pull/630#discussion_r4452321488) | Configure VS Code HTML preserve-aligned. Actual vscode-html-languageservice 5.6.2 restores deliberately misindented continuation attributes to the original column 17; aligned-multiple repacks lines. Document opening-tag Format Selection because whole-document formatting changes Angular block indentation. No template, forced formatter or format-on-save change. |
| [4453834855](https://github.com/TomoyukiAota/photo-location-map/pull/630#discussion_r4453834855) | Accept the specific hidden NSIS --updated option; keep unrelated unknown options rejected. Five real-parser checks and an actual --updated/--open launch pass; unrelated unknown options and hidden help are checked. Installed Windows E2E now supplies and asserts --updated. |
| [4453835285](https://github.com/TomoyukiAota/photo-location-map/pull/630#discussion_r4453835285) | Ignore hidden/node_modules components only below the watched directory; hidden ancestors must not disable live reload. Five actual lifecycle cases pass, including hidden checkout ancestors, ignored descendants and fresh sibling-module values. |
| [4453835453](https://github.com/TomoyukiAota/photo-location-map/pull/630#discussion_r4453835453) | Make the original-stack snapshot guard explicitly opt-in for the migration, allowing intentional future UI changes to update references. Do not update references in this PR. |
| [4453835632](https://github.com/TomoyukiAota/photo-location-map/pull/630#discussion_r4453835632) | Clean up only the package runner's own newly created temporary profile after it settles; never remove a caller-supplied profile. Five durable success/failure/ownership/cleanup-error checks pass and run before every CI package test. |

The owner explicitly accepted the older-macOS auto-update risk in
[4454038799](https://github.com/TomoyukiAota/photo-location-map/pull/630#discussion_r4454038799).
Keep minimumSystemVersion at 13.0 without an auto-update guard. This resolves
that compatibility decision; it does not authorize application publication.

The f7afae2 source passes all seven CI runs/eight actual jobs, including native
Intel. Its signed/notarized bundle and 14 packaged cases pass; native fixture
upgrade/relaunch/downgrade/settings also pass, followed by exact native cleanup
and unchanged production fingerprint/signature. These dated results do not
transfer to the new production changes above. New source requires fresh affected
gates before reporting final readiness.

Third-batch local validation passes: production build/lint, 209 unit assertions
(57 Angular, 97 main, 55 renderer), five separate package-runner cases, five
real watcher lifecycle cases, all 15 checkout visual/functional cases, and the
final focused analytics check after asserting zero payload-parse errors. The
page-view and enrichment-only negative controls each fail at their intended
assertion. Default future snapshot updates succeed on a nonvisual case; the
opt-in original-stack guard rejects updates before launch and permits comparison.
All 15 original/approved reference files remain byte-identical. No dependency
version or lockfile change is included in this batch. Platform/signed-artifact
checks must still be repeated for the committed third source checkpoint.


## Final documentation findings and verified handoff

| Comment | Correction and verification |
| --- | --- |
| [4454360799](https://github.com/TomoyukiAota/photo-location-map/pull/630#discussion_r4454360799) | Freshly fetched all sixteen exact a059/f7 test-job logs. Record checkedOutCommit and checkoutLogUrl per job separately from head_sha. Observed PR merge SHAs are bab4304dae5595cf9e186e315dabb094c402b5e3 and 84262a909fcd8086b8d3de20cd2f42fbee21d0ea; push/manual jobs check out their heads. Original identities/counts remain unchanged. |
| [4454360814](https://github.com/TomoyukiAota/photo-location-map/pull/630#discussion_r4454360814) | STATUS now identifies committed/pushed c0f0dc9, completed platform/artifact gates, and the remaining documentation-head review plus owner-reserved required-check replacement. Pre-push paragraphs are explicitly historical. |

Exact-c0 CodeRabbit check 125899564703 succeeded. CodeRabbit explicitly resolved
the earlier CI-evidence and Amplitude threads (acknowledgments 4454426380 and
4454424366); it reported no new runtime finding. All seven CI runs/eight test
jobs pass with no failure/rerun, each with 209 units, five runner cases, five
watcher modes and 14 packaged E2E passes/one website skip. Native Intel is exact
source c0. The signed Mac, all local visual/functional checks, archive identity,
DMG smoke, final ZIP transport, isolated native install/relaunch/downgrade/settings
and exact cleanup pass. Current Mac and dated Windows byte records identify c0;
older identities remain historical. Original references/tolerances and lockfile
are unchanged. No merge, application publication or protection edit occurred.

After this documentation-only push, reply to the two findings and inspect the
new review/checks rather than treating the old c0 result as their result. Tell
the owner in the Codex chat when the stable Ubuntu protected-check replacement
is ready. The owner reserved that setting; no other implementation decision
needs reopening. Revalidate mutable selected release artifacts before any
separately authorized publication.


### Final CI-record consistency correction

[4455204139](https://github.com/TomoyukiAota/photo-location-map/pull/630#discussion_r4455204139)
identified three stale provisional fields for completed Intel job 125899705853.
Its final logs had already been read and its exact source, 209 units, five runner
cases, five watcher modes and 14 packaged E2E passes were recorded correctly.
Set logsVerified=true and clear activeStep in both detailed job and run summary.
A complete consistency check now confirms all eight detailed jobs and every run
summary are completed, with no active step and the expected verified counts.
The original run/checkout/artifact identities and observation time remain intact.
This correction changes documentation only; current-head checks/review must still
be inspected separately. No new application build or artifact identity is implied.


## Stable macOS check-name follow-up

After the owner confirmed saving Ubuntu's required-context replacement, read-only
API verification confirms main requires test (ubuntu) with GitHub Actions binding
and strict mode retained. Ubuntu conversation 4451183542 is now resolved.

The owner approved test (macos-arm64) and manual test (macos-x64). Both workflow
names remain literal and the regular Mergify success/skipped contexts match.
Parsed workflow comparison confirms only the two name values change: runner
labels, events, conditions, test commands, timeouts and anchors are identical.
Parsed Mergify comparison confirms only the two arm64 context strings change;
x64 is still manual and not required. An independent read-only review agrees.

Application source, dependencies, original references and artifact identities
remain c0f0dc9. Preserve all historical job names in earlier CI evidence. Inspect
the new automatic checks and incremental CodeRabbit review before reporting
readiness for the owner's test (macos-26) → test (macos-arm64) protection edit.
No remote protection change, merge or public release is delegated to the agent.
