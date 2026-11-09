# Series rer-2-C2v (protocol rer-2)

Builds: 0-pdv1ff7a50 (code e6a1d1e7c0b2), 0-pdv6fe8814 (code e6a1d1e7c0b2). Baseline: 0-pdv1ff7a50.
Host: Apple M5, 10 cores, 32 GB, darwin 27.0.0.
Viewer: d7f2f4a3c1ee (unchanged).
Complete: yes. Trials: {"0-pdv1ff7a50":{"view-data":{"ok":10,"failed":0,"interrupted":0,"warmup":1}},"0-pdv6fe8814":{"view-data":{"ok":10,"failed":0,"interrupted":0,"warmup":1}}}

| Metric | 0-pdv1ff7a50 median (n, MAD) | 0-pdv6fe8814 median (n, MAD) | 0-pdv6fe8814 vs 0-pdv1ff7a50 |
| --- | ---: | ---: | --- |
| view-data.cycles.retained-tree-kb | -53840 (10, 14696) | -54072 (10, 7152) | -232 (+0.4 %) within budget |
| view-data.heic.after-close-tree-delta-kb | -60312 (10, 3816) | -59880 (10, 2800) | +432 (-0.7 %) within budget |
| view-data.heic.launch-to-window-created-ms | 9.3 (10, 0.2) | 9.0 (10, 0.3) | -0.3 (-3.5 %) within budget |
| view-data.heic.menu-to-request-ms | 34.5 (10, 0.9) | 36.3 (10, 1.6) | +1.8 (+5.4 %) within budget |
| view-data.heic.open-tree-delta-kb | 483384 (10, 584) | 481016 (10, 4448) | -2368 (-0.5 %) within budget |
| view-data.heic.peak-tree-delta-kb | 485152 (10, 832) | 486416 (10, 656) | +1264 (+0.3 %) within budget |
| view-data.heic.request-to-image-ms | 573 (10, 8.3) | 573 (10, 9.0) | +0.7 (+0.1 %) within budget |
| view-data.heic.request-to-launch-ms | 0.2 (10, 0.0) | 0.3 (10, 0.1) | +0.1 (+23.9 %) within budget |
| view-data.heic.request-to-metadata-ms | 574 (10, 8.4) | 575 (10, 9.2) | +1.2 (+0.2 %) within budget |
| view-data.heic.request-to-page-loaded-ms | 97.1 (10, 10.3) | 98.7 (10, 3.4) | +1.6 (+1.6 %) within budget |
| view-data.heic.window-created-to-page-loaded-ms | 87.5 (10, 7.7) | 89.2 (10, 3.3) | +1.6 (+1.8 %) within budget |
| view-data.jpeg-first.after-close-tree-delta-kb | -114496 (10, 1056) | -114392 (10, 616) | +104 (-0.1 %) within budget |
| view-data.jpeg-first.launch-to-window-created-ms | 14.1 (10, 0.9) | 13.9 (10, 0.3) | -0.2 (-1.1 %) within budget |
| view-data.jpeg-first.menu-to-request-ms | 28.2 (10, 2.3) | 27.3 (10, 1.2) | -0.8 (-3.0 %) within budget |
| view-data.jpeg-first.open-tree-delta-kb | 237376 (10, 4664) | 234224 (10, 1976) | -3152 (-1.3 %) within budget |
| view-data.jpeg-first.peak-tree-delta-kb | 251720 (10, 6408) | 251760 (10, 3328) | +40.0 (+0.0 %) within budget |
| view-data.jpeg-first.request-to-image-ms | 649 (10, 2.2) | 650 (10, 2.4) | +1.0 (+0.2 %) within budget |
| view-data.jpeg-first.request-to-launch-ms | 0.3 (10, 0.0) | 0.3 (10, 0.0) | -0.0 (-3.3 %) within budget |
| view-data.jpeg-first.request-to-metadata-ms | 652 (10, 3.8) | 652 (10, 3.5) | +0.1 (+0.0 %) within budget |
| view-data.jpeg-first.request-to-page-loaded-ms | 117 (10, 6.1) | 114 (10, 3.5) | -2.8 (-2.4 %) within budget |
| view-data.jpeg-first.window-created-to-page-loaded-ms | 98.2 (10, 2.7) | 99.6 (10, 2.2) | +1.5 (+1.5 %) within budget |
| view-data.jpeg.after-close-tree-delta-kb | -46824 (10, 1024) | -45112 (10, 4648) | +1712 (-3.7 %) within budget |
| view-data.jpeg.launch-to-window-created-ms | 9.5 (10, 0.5) | 9.0 (10, 0.3) | -0.5 (-5.1 %) within budget |
| view-data.jpeg.menu-to-request-ms | 37.4 (10, 1.3) | 38.1 (10, 0.8) | +0.6 (+1.6 %) within budget |
| view-data.jpeg.open-tree-delta-kb | 311368 (10, 1272) | 292360 (10, 6232) | -19008 (-6.1 %) within budget |
| view-data.jpeg.peak-tree-delta-kb | 310272 (10, 1384) | 291216 (10, 6152) | -19056 (-6.1 %) within budget |
| view-data.jpeg.request-to-image-ms | 648 (10, 1.4) | 649 (10, 8.7) | +0.8 (+0.1 %) within budget |
| view-data.jpeg.request-to-launch-ms | 0.3 (10, 0.1) | 0.2 (10, 0.0) | -0.1 (-26.9 %) within budget |
| view-data.jpeg.request-to-metadata-ms | 650 (10, 2.6) | 650 (10, 8.6) | -0.3 (-0.1 %) within budget |
| view-data.jpeg.request-to-page-loaded-ms | 109 (10, 4.2) | 107 (10, 8.1) | -2.0 (-1.9 %) within budget |
| view-data.jpeg.window-created-to-page-loaded-ms | 96.4 (10, 4.9) | 97.2 (10, 8.1) | +0.9 (+0.9 %) within budget |

Both builds are stage 0's package. 0-pdv1ff7a50 is served the viewer that production serves, 1ff7a50 (build QjvCHsLYaL3PVXm214N5S, hash 4be696704639 by run.mjs's method, the same before and after the series), on port 3130, through `--app-env`; 0-pdv6fe8814 is served stage C2's viewer, 6fe8814, on port 3131, whose hash the header gives.
