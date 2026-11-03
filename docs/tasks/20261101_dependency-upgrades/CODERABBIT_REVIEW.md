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

All six findings were verified against the source and implemented locally.
Cross-platform CI, replies and fresh signed-artifact gates are pending.

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
