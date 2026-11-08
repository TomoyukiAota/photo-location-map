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
| [rer-2-A](results/rer-2-A.md) | rer-2 | 0, A (235d6172) | 10 + 1 each, all 88 ok | Builds alternated by round; viewer unchanged; load average 3.0 at the start, 2.2 at the end. |
| [rer-2-B](results/rer-2-B.md) | rer-2 | 0, A, B (f5b5f7b1) | 10 + 1 each, all 132 ok | 0 and A rerun beside B, alternated by round; viewer unchanged; load average 1.9 at the end. |

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

### Stage A against 0 (rer-2-A)

Medians of ten trials of each build, run in alternating order; times in milliseconds.

| Scenario | Metric | 0 | A | A vs 0 |
| --- | --- | ---: | ---: | --- |
| Startup, new profile | Spawn to the home view | 403.0 | 397.6 | -1.4 %, within budget |
|  | Navigation to `src/main.ts` (the renderer's modules) | 120.5 | 115.8 | -3.9 %, within budget |
| Startup, used profile | Spawn to the home view | 365.9 | 368.3 | +0.7 %, within budget |
| Open the large folder, first | Start to complete | 735.2 | 644.5 | -12.3 %, improvement |
|  | Reading the photos' data | 610.4 | 516.1 | -15.5 %, improvement |
|  | Start to the markers on the map | 1751.5 | 1662.3 | -5.1 %, within budget |
|  | Start to the HEIC thumbnails done | 5733.6 | 5643.9 | -1.6 %, within budget |
|  | Longest gap between frames | 44.2 | 43.6 | -1.4 %, within budget |
|  | Process tree, peak (MB) | 3270.8 | 3157.9 | -3.5 %, within budget |
| Open it again | Start to complete | 735.5 | 648.1 | -11.9 %, improvement |
| View Data, JPEG, first | Request to the photo shown | 647.2 | 648.5 | +0.2 %, within budget |
| View Data, JPEG | Request to the photo shown | 631.2 | 631.9 | +0.1 %, within budget |
| View Data, HEIC | Request to the photo shown | 564.0 | 564.0 | +0.0 %, within budget |
| Settings | Save to the dialog closed | 113.5 | 113.5 | +0.0 %, within budget |
|  | Save to the restarted app's home view | 482.8 | 481.8 | -0.2 %, within budget |
Of 110 compared metrics, 101 are within budget, 2 invariants are the same (the files read), and 6 are improvements:
reading the photos' data of a folder takes 15 % less, as each photo is now one request to the main process
instead of the many synchronous calls that @electron/remote made for exifr's results, and opening the folder 12 %.
The EXIF sums (diagnostics) show where: the main process's parse sum fell from 236 to 81 ms, since stage 0 timed each
remote call with its IPC; the rotations in the renderer did not change.

One verdict is a regression: `view-data.jpeg.menu-to-request-ms`, 24.0 to 39.1 ms. Investigated, it is not the app.
In both builds, the time from the driver's click on View Data to the renderer's handling of it takes one of two values,
about 23 or 39 ms, one 60 Hz frame apart: the click lands on either side of a frame boundary (eight of ten trials of
0 at 23 ms, six of ten of A at 39). The other two View Data cases, `jpeg-first` and `heic`, did not move, and every
span of the app after the request, such as `request-to-launch-ms` (0.3 ms) and `request-to-image-ms`, is within
budget. The rule was frozen before stage A and is kept; the verdict is recorded as a frame-quantized driver latency.

### Stage B against 0 and A (rer-2-B)

Medians in milliseconds, of 10 trials each; 0 and A were measured again in the same series, beside B.

| Scenario | Metric | 0 | A | B | B vs 0 | B vs A |
| --- | --- | ---: | ---: | ---: | --- | --- |
| Startup, new profile | Spawn to the home view | 406.6 | 399.1 | 399.5 | -1.7 %, within budget | +0.1 %, within budget |
|  | Navigation to `src/main.ts` (the renderer's modules) | 121.3 | 116.5 | 114.4 | -5.7 %, within budget | -1.8 %, within budget |
| Startup, used profile | Spawn to the home view | 370.7 | 362.9 | 360.6 | -2.7 %, within budget | -0.6 %, within budget |
| Open the large folder, first | Start to complete | 728.8 | 643.7 | 644.2 | -11.6 %, improvement | +0.1 %, within budget |
|  | Reading the photos' data | 601.8 | 516.9 | 516.0 | -14.3 %, improvement | -0.2 %, within budget |
|  | Start to the markers on the map | 1746.3 | 1662.4 | 1664.4 | -4.7 %, within budget | +0.1 %, within budget |
|  | Start to the HEIC thumbnails done | 5729.8 | 5643.6 | 5644.6 | -1.5 %, within budget | +0.0 %, within budget |
|  | Longest gap between frames | 49.6 | 56.3 | 45.4 | -8.6 %, within budget | -19.5 %, within budget |
|  | Process tree, peak (MB) | 3161.2 | 3364.9 | 3123.5 | -1.2 %, within budget | -7.2 %, within budget |
| Open it again | Start to complete | 734.9 | 658.8 | 649.0 | -11.7 %, improvement | -1.5 %, within budget |
| View Data, JPEG, first | Request to the photo shown | 651.8 | 655.8 | 650.4 | -0.2 %, within budget | -0.8 %, within budget |
| View Data, JPEG | Request to the photo shown | 631.8 | 631.1 | 631.7 | -0.0 %, within budget | +0.1 %, within budget |
| View Data, HEIC | Request to the photo shown | 564.2 | 563.8 | 564.9 | +0.1 %, within budget | +0.2 %, within budget |
| Settings | Save to the dialog closed | 106.8 | 107.9 | 108.4 | +1.5 %, within budget | +0.5 %, within budget |
|  | Save to the setting written to its file | 107.0 | 108.0 | 109.0 | +1.9 %, within budget | +0.9 %, within budget |
|  | Save to the restarted app's home view | 486.2 | 482.3 | 481.8 | -0.9 %, within budget | -0.1 %, within budget |

Of 110 compared metrics, B against 0 has 102 within budget, 2 invariants the same and 6 improvements, the same
folder-opening gains as A; against A, 108 are within budget and the 2 invariants the same, with no improvement or
regression. Moving the settings to the main process, with the renderer's writes sent asynchronously, cost nothing
measurable: saving a setting and the restart that follows are unchanged, and so is reading the settings at startup.
A's one regression verdict, `view-data.jpeg.menu-to-request-ms`, did not recur: 24.4 ms for 0, 25.3 for A and 24.7
for B here, which bears out its reading as the frame quantization of the driver's click.

