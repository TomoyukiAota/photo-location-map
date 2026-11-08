# Reproducible performance comparisons

This protocol is a plan, revised on 2026-11-08 together with PLAN.md. No harness,
samples, budgets or performance result exists yet. Implement it only after the
owner starts the work in PLAN.md.

## Comparison series

Measure 0, A, B, C1 and C2. Compare every candidate against both original 0 and
its last accepted predecessor. C2 should additionally compare resource URL and
full-byte delivery variants before transport selection. Architectural milestones
change several things: use spans and targeted variants to attribute regressions,
not an unsupported claim that a stage label alone caused every observed delta.

Baseline 0 is measured on the zoneless application: main at or after 4ade1268
(2026-11-08). The owner sequenced this work after the signals and zoneless
migration because removing Zone.js changes the timings measured here, so no
build or figure from before that migration is a valid 0.

Freeze a protocol ID, harness source hash, input manifest, run counts, warm-up,
cache/profile definitions and regression rules before examining A results.
An instrumentation-only commit may be part of stage 0; retain remote-based
production behavior and check instrumentation overhead against a normal run.
Keep metrics independent of renderer Node availability and identical in meaning
across all stages. Prefer external launch timing plus explicit application events.

If measurement definitions, instrumentation overhead, workload, toolchain or
viewer build change materially, preserve the old series and create a new ID.
Rerun original 0, the accepted predecessor and the candidate with the revised
protocol. Do not splice incompatible samples or silently replace 0 with B.
Driver adapters may differ to reach the same UI/API; record and validate that
they do not move timing endpoints or count a stubbed operation as real work.

## Harness to implement in stage 0

Use a reusable controller under test/performance/ with a documented CLI and
structured results. This path is planned, not currently executable. It must:

- Launch a fresh app/process and owned absolute PLM_TEST_ROOT for each trial;
  preserve required profile state within that trial. No owner profile is used.
- Run headless by default (PLM_TEST_HEADLESS=1; AGENTS.md, "Keep windows off
  the owner's screen"). electron-util/e2e-test-hooks.js then creates hidden
  windows with backgroundThrottling disabled, or transparent click-through
  windows on Windows, which is not the configuration users see. Record the
  window mode of every series, keep it identical across the stages compared,
  and treat a visible-window series as its own protocol that needs the owner's
  go-ahead before it takes over the screen.
- Work in checkout and packaged builds, and across current/isolated renderers.
  Do not depend on production window.require remaining available under C.
- Start the startup clock externally BEFORE spawning the application. Async
  bootstrap must not hide its own initialization by starting a later clock.
- Record milestone durations, byte/request counts, process/PID identities,
  memory samples, long event-loop stalls, errors and functional assertions.
- Collect main, renderer, network/utility and worker-process memory where
  available. app.getAppMetrics may not cover every Node child; track spawned PIDs
  with an OS-appropriate collector. Do not present JS heap as total app memory.
  Describe shared-memory double counting when summing RSS; report per-process
  values and the sampling interval alongside any aggregate peak.
- Use normal initialized SDK/logging paths with controlled network/test profiles,
  as existing E2E does. Keep polling/trace overhead identical; separate detailed
  diagnostic profiling from the primary timing series.
- Save every valid, failed and interrupted trial with classification. A failure
  is not an outlier to drop; exclude only under the rule recorded before results.
- Clean up only owned windows/processes/profiles after collecting final samples;
  failed cleanup is recorded, not ignored or mixed into the next trial.

No new benchmark npm command is assumed in the current manifest. Document its
exact invocation and result schema when implemented; put that command in STATUS.

## Controlled inputs and environment

Use public repository fixtures and deterministic generated workloads, with file
count, byte count, formats and SHA-256 manifests. Do not publish personal photos,
EXIF GPS data or identifying paths. Existing zero-byte HEIF fixtures are only
extension tests; they are not decoder/performance inputs.

Choose representative small and large folders, mixed JPEG/HEIC, large individual
JPEG/HEIC, nested directories, orientation/corrupt-input cases and Unicode,
spaces, # and % paths. Preserve image/metadata output comparisons. Start with
pilot trials to establish runtime/variance, then freeze the workload and repetitions
before measuring A. Report sample count with all statistics; use p95 only with
adequate samples and disclose its precision. Do not repeatedly run until a
preferred result appears.

Record OS/build/architecture, CPU/RAM, storage/filesystem, power/thermal state,
display/locale/fonts/window size, runtime versions, app/source/build hashes,
viewer build and harness/protocol IDs. Same-machine paired/interleaved comparisons
are preferable. Analyze each platform independently; do not pool Windows, Linux,
ARM and Intel timings or use CI runner wall time as a local performance baseline.
Do not benchmark during builds, other tests, packaging/notarization or competing
task-owned processes. Record uncontrollable load/network variation.

Define caches precisely:

- Application-cold: fresh owned profile and thumbnail cache.
- Application-warm: a documented repeat using the same owned profile/cache.
- OS page-cache state: unknown/uncontrolled unless independently controlled and
  recorded. A fresh process/profile or renamed file is not proof of OS-cold I/O.
- Viewer/CDN/network caches: pin the viewer build and note network/cache state.
  Verify the build before and after a series; abort/restart the series if it changes.

Do not alter system caches or machine settings without appropriate authorization.

## Metrics and endpoint definitions

| Scenario | Required endpoints and observations |
| --- | --- |
| Startup | External spawn -> first usable main UI; snapshot/config preparation and renderer boot spans; no settings flash; main/renderer stalls. ready-to-show alone is not proof of usability. |
| Open folder | Request -> first usable photo; all metadata/markers/UI ready; separate all-required-thumbnails-ready milestone; queue depth/progress/errors and EXIF versus renderer rotation/DOM spans. |
| UI under load | Fixed UI interactions during loading, their response latency and long main/renderer tasks, in addition to total folder time. |
| View Data | Menu action -> window shown -> photo bytes/resource ready -> first decoded image -> metadata ready; large JPEG/HEIC peak and settled memory. |
| Repeated/multiple viewers | Open/close cycles, retained memory after a fixed settling interval, file handles, listeners/windows and capability cleanup. |
| Settings and restart | Save acknowledgement, persisted values, normal quit flush, renderer-triggered relaunch to usable UI, and failure behavior. |

Current OpenFolderRecorder.complete is not an all-HEIC-thumbnails-complete event.
Define the latter separately from the actual worker completion/display state.
Do not redefine completion after moving work between processes.

Current EXIF PQueue concurrency ten includes parse, thumbnail extraction,
renderer rotation and model construction. Maintain equivalent END-TO-END
backpressure in every stage. All stages keep EXIF reading/parsing in main
initially; none makes renderer-local EXIF parsing its default. Existing remote
results are proxies with primitive/Buffer transfers; a DTO removes proxy traffic
but is not zero-copy or automatically a faster parser.

Keep directory traversal off the UI/main event loops and preserve existing HEIC
pool recycling. Do not hide parsing/decoding/DOM time behind a shorter IPC span.
If execution placement/concurrency is deliberately changed for a targeted
variant, record it separately rather than attributing it solely to isolation.

## C2 file-transport experiment

Use the same compatible viewer build, metadata/decoding pipeline, selected-photo
authorization, session partition, caches and file inputs for both variants:

| Variant | Actual costs to observe |
| --- | --- |
| Full-byte IPC | main readFile/full-buffer lifetime, invoke serialization, preload/contextBridge copying, renderer File/Blob allocation and decode. |
| Authorized resource URL | Metadata/capability issuance, protocol request/response, native relay/stream buffers, renderer fetch/File/Blob and decode. |

The stable Electron 45.2.1 protocol.handle/net.fetch path can relay an untouched
Response or stream its body; application code need not aggregate a whole photo
in main. Already-buffered chunks or decoding may still materialize whole files.
Measure main AND total process memory; do not promise zero-copy, zero main RSS,
guaranteed streaming-through-decoding or better performance than direct fs.
Do not use experimental registerSource or deprecated protocol APIs for the trial.

protocol.handle does not receive an IPC senderFrame. Use a capability issued
through a validated viewer IPC handshake, a known session and explicit selected
file/lifetime rules. Check CORS/CSP/fetch behavior of the served viewer and revoke
on close/navigation/crash. If a session change is required, control it in BOTH
transport variants and document its cache impact.

Current View Data opening transfers only name/path, not whole Photo objects.
Host thumbnails already use resource URLs; EXIF already reads in main. Preserve
these distinctions when comparing the new design with 0.

## Results, regression decisions and artifact retention

Store raw output in an ignored task directory, e.g.
.upgrade-artifacts/remove-electron-remote/<series>/<stage>/<run-id>/.
Preserve a runnable build/package and its hash outside mutable dist/release
before moving on. Never edit a signed bundle after signing. Record the artifact
path/location and reconstruction instructions in STATUS; do not commit binaries.

Commit public-safe summaries in this task directory as results are produced.
Summaries must contain enough values, versions, protocol/input IDs, failures and
decisions to resume from another clone without the ignored raw files. Missing
raw data requires reconstruction/rerun if it is needed to validate a conclusion.

For each primary metric report n, median, tail statistic where justified,
absolute delta and percent versus 0 and predecessor. Record peak/retained memory,
sampling limits, error counts and correctness. Keep a table of NOT RUN or
INCOMPLETE cases; a cancelled run is not success and performance does not waive
functional failures.

Use stage-0 variability to set and record per-metric noise bands/practical
regression budgets BEFORE A results. Routine noise does not need owner approval.
Investigate repeatable adverse changes; do not choose a looser budget afterward.
If a material regression can only be accepted with a product tradeoff, present
the measured alternatives to the owner before accepting that stage. No numeric
performance target or fabricated result is established by this planning task.

Minimum summary fields:

| Stage | Source/artifact | Protocol/harness/input/viewer | Functionality | Startup/folder/viewer latency | UI stalls | Peak/retained memory | Delta vs 0/previous | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | NOT RUN | NOT FROZEN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | Baseline pending | Not started |
| A | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | Not started |
| B | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | Not started |
| C1 | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | Not started |
| C2 | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | Not started |
