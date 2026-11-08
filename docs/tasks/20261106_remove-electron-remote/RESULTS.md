# Measured results

The comparisons of [PERFORMANCE.md](PERFORMANCE.md), made with the harness in
[`test/performance/`](../../../test/performance/README.md). Each series' full summary is in
[`results/`](results/); the raw trials stay in the ignored
`.upgrade-artifacts/remove-electron-remote/series/` (STATUS.md, "Artifacts").

## Environment

| | |
| --- | --- |
| Host | Apple M5, 10 cores, 32 GB, macOS 27.0.1 (build 26A434), arm64, the owner's Mac, in use by other sessions (load average 2.5 to 3.9) |
| Builds | Packaged arm64 directory builds, signed with the keychain certificate and not notarized, each kept outside `release/` |
| Runtime | Electron 45.2.1 (Node 24.22.1, Chromium 156.0.8078.75); harness on Node 26.13.0, Playwright 1.64.1 |
| Windows | Hidden (`PLM_TEST_HEADLESS=1`); on macOS they paint as shown ones do |
| Network | Cut off (`PLM_TEST_OFFLINE=1`): the map's base layers come from the built-in list, tiles stay blank |
| Photo Data Viewer | Its main commit 1ff7a50, built for this app and served on 127.0.0.1:3130 |
| Workloads | large 3b8be5ead9724e0e (324 files), view-jpeg e54629e8bbf5aa31, view-heic 2b4ad7584c246aad |
| Linux | Not measured: Photo Location Map does not support Linux officially (owner, 2026-11-09) |
| Windows (OS) | Not measured: the series need the owner's Windows PC (STATUS.md, question 1) |

## Series

| Series | Protocol | Builds | Trials | Notes |
| --- | --- | --- | --- | --- |
| [pilot](results/pilot.md) | none | 0 (code e6a1d1e7c0b2) | 3 + 1 warm-up each, all ok | Set the rules of rer-1. |
| [rer-1-0](results/rer-1-0.md) | rer-1 | 0 | 10 + 1 each, all ok | The stage 0 baseline under rer-1. A Time Machine backup started at round 2; the settings dialog's closing, timed with Playwright's polls, then read about 210 ms instead of 110. Superseded by rer-2 for that and the viewer's metadata; the other times are kept as the record of stage 0. |

### Stage 0 (rer-1-0), the main metrics

Medians of ten trials, with the median absolute deviation; times in milliseconds, memory in megabytes.

| Scenario | Metric | Median | MAD |
| --- | --- | ---: | ---: |
| Startup, new profile | Spawn to the home view | 426.8 | 7.1 |
| | Navigation to `src/main.ts` (the renderer's modules) | 123.0 | 2.1 |
| | Process tree, settled | 717 | 2.8 |
| Startup, used profile | Spawn to the home view | 395.2 | 8.0 |
| Open the large folder, first | Start to complete | 736.4 | 8.2 |
| | Reading the photos' data | 612.6 | 8.4 |
| | Start to the markers on the map | 1749.3 | 8.7 |
| | Start to the HEIC thumbnails done (polled every 5 s) | 5733.6 | 7.2 |
| | Process tree, peak (with the HEIC workers) | 3036 | 55 |
| | Longest gap between frames | 44.9 | 2.2 |
| | Longest delay of the main process's event loop | 21.6 | 2.2 |
| Open it again | Start to complete | 735.0 | 9.7 |
| View Data, JPEG, first | Request to the photo shown | 649.7 | 2.5 |
| View Data, JPEG | Request to the photo shown | 639.6 | 7.9 |
| View Data, HEIC | Request to the photo shown | 573.4 | 7.4 |
| | Process tree, peak increase | 492 | 4.5 |
| Settings | Save to the restarted app's home view | 518.2 | 6.7 |
