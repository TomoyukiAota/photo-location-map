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
| Photo Data Viewer | Its main commit 1ff7a50, built for this app and served on 127.0.0.1:3130 (build QjvCHsLYaL3PVXm214N5S). From rer-2-C2 on, its commit 568b8ab, which knows the bridge of stage C2 ([its pull request](https://github.com/TomoyukiAota/photo-data-viewer/pull/72)), built alike and served on 127.0.0.1:3131 (build kiytqYrbcsLHxY4Dju6bp); rer-2-C2v and rer-2-C2s, its 6fe8814, which adds an error message and comments (build 2VJOG_nWG_NWbGWXRSpPe). Each series records the hash of what its server serves |
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
| [rer-2-C1](results/rer-2-C1.md) | rer-2 | 0, B, C1 (ac6a51ad) | 10 + 1 each; C1's open-folder 9 ok, 1 failed | Its first attempt ended in the warm-up round on a harness error (fixed, not kept). Found three regressions and one launch that never rendered; all fixed before rer-2-C1b (STATUS.md, "Stage C1 notes"). |
| [rer-2-C1b](results/rer-2-C1b.md) | rer-2 | 0, B, C1 (f3cabca8) | 10 + 1 each, all 132 ok | Every launch of C1 rendered its home view. |
| [rer-2-C1c](results/rer-2-C1c.md) | rer-2 | 0, B, C1 (0aefe3fc) | open-folder only, 10 + 1 each, all 33 ok | After the last fix, which touches folder opening only. |
| [rer-2-C2](results/rer-2-C2.md) | rer-2 | 0, C1 (0aefe3fc), C2 (b6a4bfa3) by URL and by bytes | 10 + 1 each, all 176 ok | One package of C2, measured twice: `PLM_TEST_PHOTO_TRANSPORT=url` and `=ipc` (`--app-env`). The viewer at 568b8ab for every build. A Time Machine backup and another session's repeated tool runs put the load average between 3.5 and 11.7 in rounds 3 to 5, from 2.6 at the start. |
| rer-2-C2v, first attempt | rer-2 | 0 with the viewer 1ff7a50, and with 568b8ab | View Data only; INCOMPLETE, stopped in round 4 | iOS Simulator runtimes and Spotlight's indexing, which an install of Xcode started, put the load average at 260 to 390 from 10:10 (Asia/Tokyo), and a trial's click timed out. Kept in the ignored series folder as `rer-2-C2v-interrupted`, not used. |
| [rer-2-C2v](results/rer-2-C2v.md) | rer-2 | 0 with the viewer 1ff7a50, and with 6fe8814 | View Data only, 10 + 1 each, all 22 ok | Stage 0's package, a window with Node.js as 1.12.1's, with the viewer that production serves and with stage C2's. A Time Machine backup ran; the load average was between 2.4 and 5.7 at the trials' starts. |
| [rer-2-C2s](results/rer-2-C2s.md) | rer-2 | 0, C1, C2 | startup only, 10 + 1 each, all 33 ok | Startup again, after rer-2-C2's was disturbed; the load average was between 2.2 and 3.1 at the trials' starts. |

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

### Stage C1 against 0 and B (rer-2-C1b, rer-2-C1c)

Medians in milliseconds, of 10 trials each, 0 and B measured again beside C1. Series rer-2-C1b, with C1 at f3cabca8:

| Scenario | Metric | 0 | B | C1 | C1 vs 0 | C1 vs B |
| --- | --- | ---: | ---: | ---: | --- | --- |
| Startup, new profile | Spawn to the home view | 402.3 | 397.7 | 372.3 | -7.4 %, within budget | -6.4 %, within budget |
|  | Navigation to the app's bootstrap (the renderer's modules) | 121.7 | 117.0 | 123.8 | +1.7 %, within budget | +5.9 %, within budget |
| Startup, used profile | Spawn to the home view | 374.6 | 365.6 | 337.3 | -9.9 %, within budget | -7.7 %, within budget |
|  | Navigation to the app's bootstrap | 91.9 | 86.3 | 92.1 | +0.2 %, within budget | +6.7 %, within budget |
| Open the large folder, first | Start to complete | 737.2 | 644.9 | 677.9 | -8.0 %, within budget | +5.1 %, within budget |
|  | Reading the folder's tree | 15.2 | 17.2 | 9.2 | -38.9 %, improvement | -46.2 %, improvement |
|  | Reading the photos' data | 610.8 | 516.6 | 524.5 | -14.1 %, improvement | +1.5 %, within budget |
|  | Photo data to complete | 110.8 | 111.3 | 144.5 | +30.4 %, REGRESSION | +29.8 %, REGRESSION |
|  | Start to the markers on the map | 1750.8 | 1664.5 | 1649.1 | -5.8 %, within budget | -0.9 %, within budget |
|  | Start to the HEIC thumbnails done | 5735.7 | 5644.3 | 5676.5 | -1.0 %, within budget | +0.6 %, within budget |
|  | Longest gap between frames | 50.8 | 58.4 | 33.4 | -34.4 %, within budget | -42.9 %, improvement |
|  | Process tree, peak (MB) | 3271.6 | 3476.6 | 3059.7 | -6.5 %, within budget | -12.0 %, within budget |
| Open it again | Start to complete | 733.7 | 660.0 | 648.6 | -11.6 %, improvement | -1.7 %, within budget |
| View Data, JPEG, first | Request to the photo shown | 650.2 | 663.3 | 664.3 | +2.2 %, within budget | +0.2 %, within budget |
| View Data, JPEG | Request to the photo shown | 631.5 | 630.8 | 631.3 | -0.0 %, within budget | +0.1 %, within budget |
| View Data, HEIC | Request to the photo shown | 564.1 | 556.7 | 564.1 | -0.0 %, within budget | +1.3 %, within budget |
| Settings | Save to the dialog closed | 108.5 | 108.3 | 109.3 | +0.7 %, within budget | +0.8 %, within budget |
|  | Save to the restarted app's home view | 484.5 | 477.6 | 425.2 | -12.2 %, improvement | -11.0 %, improvement |

Folder opening after 0aefe3fc, which checks the thumbnail cache while the photos' data load (series rer-2-C1c):

| Scenario | Metric | 0 | B | C1 | C1 vs 0 | C1 vs B |
| --- | --- | ---: | ---: | ---: | --- | --- |
| Open the large folder, first | Start to complete | 733.8 | 643.7 | 644.0 | -12.2 %, improvement | +0.0 %, within budget |
|  | Reading the folder's tree | 15.1 | 17.0 | 9.0 | -39.9 %, improvement | -46.8 %, improvement |
|  | Reading the photos' data | 608.8 | 516.5 | 524.3 | -13.9 %, improvement | +1.5 %, within budget |
|  | Photo data to complete | 110.3 | 110.4 | 111.0 | +0.5 %, within budget | +0.5 %, within budget |
|  | Start to the markers on the map | 1745.7 | 1664.3 | 1660.6 | -4.9 %, within budget | -0.2 %, within budget |
|  | Start to the HEIC thumbnails done | 5730.2 | 5643.6 | 5642.1 | -1.5 %, within budget | -0.0 %, within budget |
|  | Longest gap between frames | 48.8 | 61.1 | 33.4 | -31.7 %, within budget | -45.4 %, improvement |
|  | Process tree, peak (MB) | 3749.1 | 3712.1 | 3703.9 | -1.2 %, within budget | -0.2 %, within budget |
| Open it again | Start to complete | 733.3 | 659.8 | 644.9 | -12.1 %, improvement | -2.2 %, within budget |

The isolated main window starts sooner and opens folders as fast as B: the home view renders 6 to 8 % earlier
than in B (7 to 10 % than in 0), the folder's tree, now read in a worker thread of the main process, takes 9 ms
instead of 17, and the longest gap between frames while a folder opens falls by about 45 %. Restarting after a
setting is saved takes 11 % less.

Two verdicts against B remain regressions, both moves of work that the design makes, and neither is worse for
the user:

- `startup.cold.renderer-bootstrap-ms`, 15.4 to 23.5 ms: the renderer's start, from navigation to the bootstrap's
  end, takes longer, as the page asks for its startup metadata through the preload and loads the app once it has its
  bridge; the window navigates 36 ms earlier, so the home view renders 25 ms earlier than in B. Starting the main
  process's tree worker later did not change it (23.1 ms either way in six startups each). Against 0, within budget.
- `open-folder.warm.settled-main-ws-kb`, +33 MB (rer-2-C1c): the tree's worker moved from the renderer, as a Web
  Worker, to the main process, as a worker thread (PLAN.md, C1 step 4). The renderer's settled working set fell by
  21 MB, and the process tree's total is within 1.1 % of B's and 4 % below 0's.

`open-folder.cold.finish-ms` (+30 % in rer-2-C1b) was a regression, and is fixed: the cache check, asked after the
tree was shown, let the page render the tree before the folder completed, which kept the loading dialog open 34 ms
longer. Started with the tree's reading, it ends with the photos' data, and the span is B's again (111 ms).


### Stage C2 against 0 and C1 (rer-2-C2)

Medians in milliseconds, of 10 trials each, 0 and C1 measured again beside C2. C2 is one package, measured with
each way of giving the viewer its photo (PERFORMANCE.md, "C2 file-transport experiment"): C2 (URL) has the page
fetch it from a `plm-photo:` URL, which the main process answers with the file's stream; C2 (IPC) gives the page its
bytes. The viewer is 568b8ab for every build, so 0 and C1 read the photo by its path there, as 1.12.1's window does.

| Scenario | Metric | 0 | C1 | C2 (URL) | C2 vs 0 | C2 vs C1 |
| --- | --- | ---: | ---: | ---: | --- | --- |
| Startup, new profile | Spawn to the home view | 580.1 | 618.7 | 474.2 | -18.3 %, within budget | -23.4 %, within budget |
|  | Navigation to the app's bootstrap (the renderer's modules) | 146.2 | 146.8 | 134.2 | -8.2 %, within budget | -8.5 %, within budget |
| Startup, used profile | Spawn to the home view | 407.8 | 381.9 | 392.9 | -3.6 %, within budget | +2.9 %, within budget |
| Open the large folder, first | Start to complete | 750.8 | 642.9 | 643.9 | -14.2 %, improvement | +0.1 %, within budget |
|  | Reading the folder's tree | 15.1 | 8.6 | 8.7 | -42.7 %, improvement | +0.6 %, within budget |
|  | Reading the photos' data | 625.0 | 524.7 | 524.7 | -16.0 %, improvement | +0.0 %, within budget |
|  | Photo data to complete | 110.4 | 110.2 | 110.7 | +0.2 %, within budget | +0.4 %, within budget |
|  | Start to the markers on the map | 1768.5 | 1662.5 | 1662.3 | -6.0 %, within budget | -0.0 %, within budget |
|  | Start to the HEIC thumbnails done | 5748.7 | 5641.1 | 5641.1 | -1.9 %, within budget | +0.0 %, within budget |
|  | Longest gap between frames | 66.0 | 33.5 | 33.4 | -49.4 %, improvement | -0.1 %, within budget |
|  | Process tree, peak (MB) | 3180.8 | 3213.8 | 3194.6 | +0.4 %, within budget | -0.6 %, within budget |
| Open it again | Start to complete | 749.3 | 644.9 | 645.3 | -13.9 %, improvement | +0.1 %, within budget |
| View Data, JPEG, first | Request to the photo shown | 663.8 | 673.8 | 680.2 | +2.5 %, within budget | +0.9 %, within budget |
| View Data, JPEG | Request to the photo shown | 647.4 | 658.1 | 669.8 | +3.5 %, within budget | +1.8 %, within budget |
| View Data, HEIC | Request to the photo shown | 597.2 | 597.7 | 606.1 | +1.5 %, within budget | +1.4 %, within budget |
| Settings | Save to the dialog closed | 108.6 | 109.5 | 113.1 | +4.1 %, within budget | +3.3 %, within budget |
|  | Save to the restarted app's home view | 546.7 | 482.1 | 481.3 | -11.9 %, within budget | -0.1 %, within budget |

View Data, with each transport (memory in megabytes):

| View Data | Metric | 0 | C1 | C2 (URL) | C2 (IPC) | IPC vs URL |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| JPEG, first | Request to the page loaded | 125.1 | 134.9 | 116.5 | 113.8 | -2.3 %, within budget |
|  | Request to the photo shown | 663.8 | 673.8 | 680.2 | 664.3 | -2.3 %, within budget |
|  | Request to its data shown | 665.3 | 677.6 | 681.9 | 665.9 | -2.3 %, within budget |
|  | Process tree, peak increase (MB) | 256.3 | 260.5 | 249.6 | 238.9 | -4.3 %, within budget |
|  | Process tree, increase while open (MB) | 241.3 | 243.4 | 230.7 | 226.6 | -1.8 %, within budget |
|  | Process tree, increase after closing (MB) | -111.3 | -109.6 | -97.2 | -106.1 | +9.2 %, within budget |
| JPEG | Request to the page loaded | 110.2 | 121.6 | 100.9 | 97.3 | -3.5 %, within budget |
|  | Request to the photo shown | 647.4 | 658.1 | 669.8 | 649.4 | -3.1 %, within budget |
|  | Request to its data shown | 649.5 | 661.3 | 672.1 | 652.0 | -3.0 %, within budget |
|  | Process tree, peak increase (MB) | 284.2 | 287.0 | 286.6 | 280.8 | -2.0 %, within budget |
|  | Process tree, increase while open (MB) | 285.4 | 288.1 | 288.4 | 281.8 | -2.3 %, within budget |
|  | Process tree, increase after closing (MB) | -45.3 | -44.5 | -35.7 | -40.1 | +12.5 %, within budget |
| HEIC | Request to the page loaded | 101.1 | 103.4 | 93.6 | 88.3 | -5.6 %, within budget |
|  | Request to the photo shown | 597.2 | 597.7 | 606.1 | 589.3 | -2.8 %, within budget |
|  | Request to its data shown | 598.4 | 599.5 | 607.8 | 590.7 | -2.8 %, within budget |
|  | Process tree, peak increase (MB) | 478.8 | 475.9 | 461.2 | 463.0 | +0.4 %, within budget |
|  | Process tree, increase while open (MB) | 475.9 | 470.5 | 365.6 | 364.7 | -0.2 %, within budget |
|  | Process tree, increase after closing (MB) | -60.3 | -58.1 | -57.8 | -56.6 | -2.2 %, within budget |
| Three more HEIC | Process tree, left after the cycles (MB) | -50.5 | -53.4 | -51.9 | -52.3 | +0.9 %, within budget |

Stage C2 isolates Photo Data Viewer's window without making anything slower than C1. Against C1, 104 of the 110
compared metrics are within budget, 2 invariants are the same, and 4 are improvements, two of them in View Data:
while a HEIC is shown, the process tree holds 105 MB less (365.6 MB more than before the window opened, instead
of 470.5), and the first JPEG's page loads 14 % sooner (116.5 ms instead of 134.9). The photo itself shows 6 to 12 ms later
than in C1 (+0.9 to +1.8 %, within budget), as the page now fetches it from the main process instead of reading the
file. Against 0, C2 keeps stage A's folder-opening gains (13 improvements), and its one regression verdict,
`startup.warm.renderer-bootstrap-ms` (15 to 20 ms), is C1's as well: the page waits for its bridge
(stage C1 above); C2 against C1 is within budget there.

The transports: giving the page the photo's bytes over IPC showed it 16 to 20 ms sooner than the URL did (2.3 to
3.1 %), and all 108 compared metrics of IPC against the URL are within budget. By the rule written before the series
(STATUS.md, "Stage C2 notes"), the URL stays, as IPC made no improvement verdict; with the URL, the main process
streams the file rather than holding all of it.

Startup varied more than in the earlier series, in every build. A new profile's spawn to the home view ranged from
366 to 847 ms across the builds, and its medians from 414 to 619 ms, against about 400 before. The computer's load
was the cause rather than the code: C2-url and C2-ipc are the same package, whose View Data alone differs, and their
medians differ by 60 ms. A Time Machine backup ran, and another session ran a tool many times a second, which put
the load average between 3.5 and 11.7 in rounds 3 to 5, from 2.6 at the start. Stage C2 changes nothing in startup
but registering its scheme; measured again on a quiet computer (rer-2-C2s, below), it starts as C1 does.

### Stage C2's startup, measured again (rer-2-C2s)

Startup only, of 0, C1 and C2, on a quiet computer, as rer-2-C2's was disturbed; medians in milliseconds, of 10 trials
each, and the settled process tree in megabytes.

| Startup | Metric | 0 | C1 | C2 | C2 vs 0 | C2 vs C1 |
| --- | --- | ---: | ---: | ---: | --- | --- |
| New profile | Spawn to the home view | 415.8 | 375.8 | 382.4 | -8.0 %, within budget | +1.8 %, within budget |
|  | Navigation to the app's bootstrap | 122.0 | 119.1 | 123.1 | +0.9 %, within budget | +3.3 %, within budget |
|  | The bootstrap | 17.4 | 22.5 | 24.1 | +38.2 %, REGRESSION | +7.1 %, within budget |
|  | Spawn to ready-to-show | 408.3 | 254.6 | 256.5 | -37.2 %, within budget | +0.7 %, within budget |
|  | Process tree, settled (MB) | 727.4 | 699.8 | 699.9 | -3.8 %, within budget | +0.0 %, within budget |
| Used profile | Spawn to the home view | 368.3 | 335.8 | 335.2 | -9.0 %, within budget | -0.2 %, within budget |
|  | Navigation to the app's bootstrap | 90.6 | 91.3 | 91.3 | +0.8 %, within budget | +0.1 %, within budget |
|  | The bootstrap | 13.6 | 17.2 | 17.1 | +25.7 %, within budget | -0.6 %, within budget |
|  | Spawn to ready-to-show | 370.1 | 248.9 | 247.3 | -33.2 %, improvement | -0.7 %, within budget |
|  | Process tree, settled (MB) | 608.0 | 585.8 | 601.9 | -1.0 %, within budget | +2.7 %, within budget |

C2 starts as C1 does: all 30 compared metrics are within budget against C1, and the home view renders 8 to 9 %
earlier than in 0. Against 0, the one regression verdict is C1's, `startup.cold.renderer-bootstrap-ms`, 17.4 to
24.1 ms here (22.5 in C1): the page asks for its startup metadata through the preload and loads the app once it has
its bridge (stage C1 above). 6 metrics are improvements against 0, among them the spawn to `ready-to-show`, a third
sooner.

### Stage C2's viewer in a window with Node.js (rer-2-C2v)

What deploying stage C2's viewer changes for the installed app, whose window has Node.js: stage 0's package, with
the viewer that production serves (1ff7a50) and with stage C2's (6fe8814), alternated by round; medians in
milliseconds, of 10 trials each.

| View Data | Metric | Viewer 1ff7a50 | Viewer 6fe8814 | 6fe8814 vs 1ff7a50 |
| --- | --- | ---: | ---: | --- |
| JPEG, first | Request to the page loaded | 116.6 | 113.9 | -2.4 %, within budget |
|  | Request to the photo shown | 649.0 | 650.0 | +0.2 %, within budget |
|  | Request to its data shown | 652.0 | 652.0 | +0.0 %, within budget |
|  | Process tree, peak increase (MB) | 245.8 | 245.9 | +0.0 %, within budget |
|  | Process tree, increase while open (MB) | 231.8 | 228.7 | -1.3 %, within budget |
| JPEG | Request to the page loaded | 108.9 | 106.9 | -1.9 %, within budget |
|  | Request to the photo shown | 647.8 | 648.6 | +0.1 %, within budget |
|  | Request to its data shown | 650.1 | 649.8 | -0.1 %, within budget |
|  | Process tree, peak increase (MB) | 303.0 | 284.4 | -6.1 %, within budget |
|  | Process tree, increase while open (MB) | 304.1 | 285.5 | -6.1 %, within budget |
| HEIC | Request to the page loaded | 97.1 | 98.7 | +1.6 %, within budget |
|  | Request to the photo shown | 572.7 | 573.4 | +0.1 %, within budget |
|  | Request to its data shown | 573.9 | 575.1 | +0.2 %, within budget |
|  | Process tree, peak increase (MB) | 473.8 | 475.0 | +0.3 %, within budget |
|  | Process tree, increase while open (MB) | 472.1 | 469.7 | -0.5 %, within budget |
| Three more HEIC | Process tree, left after the cycles (MB) | -52.6 | -52.8 | +0.4 %, within budget |

Nothing changes: all 31 compared metrics are within budget, and the photo shows within 1 ms of the production
viewer's time. In that window, stage C2's viewer reads the photo by its path with Electron's own `require`, where
the production viewer used `get-file-object-from-local-path` through webpack's `electron-renderer` target.

A first attempt of this series was stopped in its fourth round, when iOS Simulator runtimes and Spotlight's indexing,
which an install of Xcode on the computer started, put the load average at 260 to 390; its trials are not used.
