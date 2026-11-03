# CodeRabbit review follow-up

Updated: 2026-11-03 (Asia/Tokyo).

The owner authorized marking PR #630 ready for review and addressing CodeRabbit
findings. The PR is ready, with no automerge label or native auto-merge request.
Merge and application release remain unauthorized. The accepted HEIC output
and confirmed-folder policy are unchanged.

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
