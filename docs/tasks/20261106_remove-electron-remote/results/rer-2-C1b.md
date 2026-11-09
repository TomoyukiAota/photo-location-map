# Series rer-2-C1b (protocol rer-2)

Builds: 0 (code e6a1d1e7c0b2), B (code c747f3e6fb52), C1 (code 04f667019c0f). Baseline: 0.
Host: Apple M5, 10 cores, 32 GB, darwin 27.0.0.
Viewer: 4be696704639 (unchanged).
Complete: yes. Trials: {"0":{"open-folder":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"settings":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"startup":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"view-data":{"ok":10,"failed":0,"interrupted":0,"warmup":1}},"B":{"open-folder":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"settings":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"startup":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"view-data":{"ok":10,"failed":0,"interrupted":0,"warmup":1}},"C1":{"open-folder":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"settings":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"startup":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"view-data":{"ok":10,"failed":0,"interrupted":0,"warmup":1}}}

| Metric | 0 median (n, MAD) | B median (n, MAD) | C1 median (n, MAD) | B vs 0 | C1 vs 0 |
| --- | ---: | ---: | ---: | --- | --- |
| open-folder.cold.click-to-complete-ms | 766 (10, 9.3) | 677 (10, 3.5) | 708 (10, 2.5) | -88.5 (-11.6 %) improvement | -58.1 (-7.6 %) within budget |
| open-folder.cold.click-to-dialog-ms | 29.3 (10, 3.4) | 32.3 (10, 4.0) | 28.5 (10, 2.8) | +3.0 (+10.4 %) within budget | -0.8 (-2.9 %) within budget |
| open-folder.cold.dialog-ms | 1.6 (10, 0.1) | 0.4 (10, 0.0) | 0.5 (10, 0.1) | -1.2 (-75.0 %) within budget | -1.1 (-71.9 %) within budget |
| open-folder.cold.dialog-to-start-ms | 0.8 (10, 0.1) | 0.1 (10, 0.0) | 0.1 (10, 0.0) | -0.6 (-86.7 %) within budget | -0.6 (-86.7 %) within budget |
| open-folder.cold.directory-tree-ms | 15.2 (10, 0.2) | 17.2 (10, 0.2) | 9.3 (10, 0.3) | +2.0 (+13.5 %) within budget | -5.9 (-38.9 %) improvement |
| open-folder.cold.exif-files | 314 (10, 0.0) | 314 (10, 0.0) | 314 (10, 0.0) | +0.0 (+0.0 %) same | +0.0 (+0.0 %) same |
| open-folder.cold.exif-max-file-ms | 44.9 (10, 0.3) | 23.8 (10, 0.4) | 29.7 (10, 0.6) | -21.1 (-46.9 %) | -15.2 (-33.9 %) |
| open-folder.cold.exif-parse-sum-ms | 238 (10, 7.7) | 79.3 (10, 1.4) | 86.2 (10, 11.4) | -159 (-66.7 %) | -152 (-63.8 %) |
| open-folder.cold.exif-read-sum-ms | 0.0 (10, 0.0) | 228 (10, 5.5) | 266 (10, 27.4) | +228 () | +266 () |
| open-folder.cold.exif-rotate-sum-ms | 5341 (10, 54.6) | 4782 (10, 13.0) | 4811 (10, 14.0) | -558 (-10.5 %) | -530 (-9.9 %) |
| open-folder.cold.exif-thumbnail-sum-ms | 227 (10, 5.5) | 50.9 (10, 2.5) | 55.0 (10, 3.7) | -176 (-77.5 %) | -172 (-75.8 %) |
| open-folder.cold.finish-ms | 111 (10, 0.8) | 111 (10, 0.5) | 145 (10, 1.2) | +0.6 (+0.5 %) within budget | +33.7 (+30.4 %) REGRESSION |
| open-folder.cold.main-event-loop-max-ms | 25.5 (10, 4.6) | 23.3 (10, 1.3) | 23.1 (10, 3.3) | -2.2 (-8.8 %) within budget | -2.5 (-9.6 %) within budget |
| open-folder.cold.main-event-loop-p99-ms | 19.7 (10, 1.9) | 18.6 (10, 1.4) | 19.0 (10, 1.5) | -1.2 (-6.0 %) within budget | -0.7 (-3.7 %) within budget |
| open-folder.cold.peak-tree-delta-kb | 2610600 (10, 237864) | 2820408 (10, 252160) | 2417600 (10, 177328) | +209808 (+8.0 %) within budget | -193000 (-7.4 %) within budget |
| open-folder.cold.peak-tree-rss-kb | 3350080 (10, 242880) | 3560072 (10, 253064) | 3133088 (10, 177176) | +209992 (+6.3 %) within budget | -216992 (-6.5 %) within budget |
| open-folder.cold.photo-data-ms | 611 (10, 7.7) | 517 (10, 0.6) | 525 (10, 0.5) | -94.2 (-15.4 %) improvement | -86.2 (-14.1 %) improvement |
| open-folder.cold.renderer-longtask-max-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget | +0.0 () within budget |
| open-folder.cold.renderer-longtask-total-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget | +0.0 () within budget |
| open-folder.cold.renderer-longtasks | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget | +0.0 () within budget |
| open-folder.cold.renderer-max-frame-gap-ms | 50.8 (10, 8.4) | 58.4 (10, 4.1) | 33.4 (10, 0.6) | +7.7 (+15.1 %) within budget | -17.4 (-34.4 %) within budget |
| open-folder.cold.settled-main-ws-kb | 186952 (10, 10696) | 239456 (10, 21144) | 188176 (10, 8896) | +52504 (+28.1 %) REGRESSION | +1224 (+0.7 %) within budget |
| open-folder.cold.settled-renderer-ws-kb | 258696 (10, 13896) | 286560 (10, 15472) | 232328 (10, 13080) | +27864 (+10.8 %) within budget | -26368 (-10.2 %) within budget |
| open-folder.cold.settled-tree-rss-kb | 593768 (10, 17680) | 687384 (10, 31592) | 573832 (10, 28120) | +93616 (+15.8 %) REGRESSION | -19936 (-3.4 %) within budget |
| open-folder.cold.start-to-complete-ms | 737 (10, 6.7) | 645 (10, 0.8) | 678 (10, 1.1) | -92.3 (-12.5 %) improvement | -59.3 (-8.0 %) within budget |
| open-folder.cold.start-to-markers-ms | 1751 (10, 5.4) | 1665 (10, 1.1) | 1649 (10, 1.9) | -86.3 (-4.9 %) within budget | -102 (-5.8 %) within budget |
| open-folder.cold.start-to-thumbnails-done-ms | 5736 (10, 6.3) | 5644 (10, 0.5) | 5677 (10, 1.0) | -91.4 (-1.6 %) within budget | -59.2 (-1.0 %) within budget |
| open-folder.cold.thumbnails-main-ms | 1975 (10, 21.4) | 2002 (10, 19.8) | 2001 (10, 44.9) | +27.8 (+1.4 %) within budget | +26.5 (+1.3 %) within budget |
| open-folder.warm.click-to-complete-ms | 766 (10, 5.3) | 686 (10, 4.5) | 680 (10, 4.3) | -79.8 (-10.4 %) improvement | -85.6 (-11.2 %) improvement |
| open-folder.warm.click-to-dialog-ms | 28.2 (10, 4.6) | 28.0 (10, 2.7) | 27.4 (10, 3.2) | -0.2 (-0.9 %) within budget | -0.8 (-2.8 %) within budget |
| open-folder.warm.dialog-ms | 1.5 (10, 0.1) | 0.4 (10, 0.0) | 0.6 (10, 0.1) | -1.1 (-74.2 %) within budget | -0.9 (-61.3 %) within budget |
| open-folder.warm.dialog-to-start-ms | 0.6 (10, 0.0) | 0.1 (10, 0.0) | 0.1 (10, 0.0) | -0.5 (-83.3 %) within budget | -0.5 (-83.3 %) within budget |
| open-folder.warm.directory-tree-ms | 16.3 (10, 0.3) | 18.0 (10, 0.1) | 8.8 (10, 0.7) | +1.8 (+11.1 %) within budget | -7.5 (-46.2 %) improvement |
| open-folder.warm.exif-files | 314 (10, 0.0) | 314 (10, 0.0) | 314 (10, 0.0) | +0.0 (+0.0 %) same | +0.0 (+0.0 %) same |
| open-folder.warm.exif-max-file-ms | 42.6 (10, 4.8) | 36.4 (10, 2.6) | 30.5 (10, 1.3) | -6.3 (-14.7 %) | -12.1 (-28.5 %) |
| open-folder.warm.exif-parse-sum-ms | 210 (10, 6.1) | 62.8 (10, 1.4) | 62.6 (10, 2.2) | -147 (-70.1 %) | -147 (-70.2 %) |
| open-folder.warm.exif-read-sum-ms | 0.0 (10, 0.0) | 203 (10, 4.1) | 209 (10, 9.4) | +203 () | +209 () |
| open-folder.warm.exif-rotate-sum-ms | 5397 (10, 41.8) | 4964 (10, 28.6) | 4956 (10, 34.7) | -433 (-8.0 %) | -441 (-8.2 %) |
| open-folder.warm.exif-thumbnail-sum-ms | 210 (10, 2.2) | 49.6 (10, 2.6) | 50.8 (10, 2.3) | -161 (-76.4 %) | -159 (-75.8 %) |
| open-folder.warm.finish-ms | 109 (10, 0.2) | 110 (10, 0.7) | 112 (10, 0.8) | +1.6 (+1.4 %) within budget | +3.5 (+3.2 %) within budget |
| open-folder.warm.main-event-loop-max-ms | 12.3 (10, 0.2) | 12.4 (10, 0.2) | 12.7 (10, 0.2) | +0.1 (+0.9 %) within budget | +0.4 (+3.5 %) within budget |
| open-folder.warm.main-event-loop-p99-ms | 12.1 (10, 0.0) | 12.3 (10, 0.1) | 12.4 (10, 0.1) | +0.1 (+1.1 %) within budget | +0.2 (+1.9 %) within budget |
| open-folder.warm.peak-tree-delta-kb | 142408 (10, 18544) | 111816 (10, 23048) | 127352 (10, 22168) | -30592 (-21.5 %) within budget | -15056 (-10.6 %) within budget |
| open-folder.warm.peak-tree-rss-kb | 750792 (10, 28448) | 811080 (10, 17392) | 720296 (10, 23328) | +60288 (+8.0 %) within budget | -30496 (-4.1 %) within budget |
| open-folder.warm.photo-data-ms | 609 (10, 3.6) | 532 (10, 0.8) | 528 (10, 1.4) | -76.5 (-12.6 %) improvement | -81.0 (-13.3 %) improvement |
| open-folder.warm.renderer-longtask-max-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget | +0.0 () within budget |
| open-folder.warm.renderer-longtask-total-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget | +0.0 () within budget |
| open-folder.warm.renderer-longtasks | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget | +0.0 () within budget |
| open-folder.warm.renderer-max-frame-gap-ms | 67.3 (10, 7.2) | 70.3 (10, 4.6) | 23.9 (10, 4.5) | +3.0 (+4.5 %) within budget | -43.4 (-64.5 %) improvement |
| open-folder.warm.settled-main-ws-kb | 233528 (10, 6768) | 257384 (10, 13288) | 226928 (10, 5264) | +23856 (+10.2 %) within budget | -6600 (-2.8 %) within budget |
| open-folder.warm.settled-renderer-ws-kb | 330464 (10, 10472) | 358736 (10, 8560) | 302016 (10, 10904) | +28272 (+8.6 %) within budget | -28448 (-8.6 %) within budget |
| open-folder.warm.settled-tree-rss-kb | 752448 (10, 28760) | 809624 (10, 17464) | 718328 (10, 23840) | +57176 (+7.6 %) within budget | -34120 (-4.5 %) within budget |
| open-folder.warm.start-to-complete-ms | 734 (10, 4.0) | 660 (10, 2.2) | 649 (10, 1.2) | -73.7 (-10.0 %) improvement | -85.0 (-11.6 %) improvement |
| settings.restart.click-to-exit-ms | 125 (10, 4.5) | 122 (10, 6.5) | 118 (10, 6.0) | -3.0 (-2.4 %) within budget | -7.0 (-5.6 %) within budget |
| settings.restart.click-to-home-rendered-ms | 485 (10, 5.2) | 478 (10, 4.3) | 425 (10, 7.0) | -7.0 (-1.4 %) within budget | -59.3 (-12.2 %) improvement |
| settings.restart.click-to-process-started-ms | 153 (10, 4.7) | 150 (10, 6.8) | 146 (10, 6.1) | -3.2 (-2.1 %) within budget | -7.3 (-4.8 %) within budget |
| settings.restart.process-to-home-rendered-ms | 333 (10, 5.3) | 325 (10, 3.9) | 280 (10, 3.5) | -7.4 (-2.2 %) within budget | -52.6 (-15.8 %) improvement |
| settings.save.click-to-closed-ms | 109 (10, 2.8) | 108 (10, 3.4) | 109 (10, 0.8) | -0.2 (-0.1 %) within budget | +0.8 (+0.7 %) within budget |
| settings.save.click-to-persisted-ms | 109 (10, 2.5) | 109 (10, 3.0) | 110 (10, 1.0) | +0.5 (+0.5 %) within budget | +1.0 (+0.9 %) within budget |
| startup.cold.bootstrap-done-ms | 390 (10, 3.5) | 385 (10, 6.8) | 360 (10, 5.8) | -5.0 (-1.3 %) within budget | -30.0 (-7.7 %) within budget |
| startup.cold.bootstrap-start-ms | 371 (10, 3.1) | 370 (10, 6.5) | 337 (10, 4.8) | -1.0 (-0.3 %) within budget | -34.0 (-9.2 %) within budget |
| startup.cold.close-ms | 44.5 (10, 4.0) | 38.5 (10, 1.5) | 44.0 (10, 5.0) | -6.0 (-13.5 %) within budget | -0.5 (-1.1 %) within budget |
| startup.cold.create-window-ms | 165 (10, 2.4) | 165 (10, 2.2) | 168 (10, 2.0) | -0.2 (-0.1 %) within budget | +2.2 (+1.3 %) within budget |
| startup.cold.did-finish-load-ms | 372 (10, 3.2) | 371 (10, 6.4) | 243 (10, 3.2) | -1.0 (-0.3 %) within budget | -129 (-34.7 %) improvement |
| startup.cold.home-rendered-ms | 402 (10, 4.1) | 398 (10, 6.4) | 372 (10, 5.8) | -4.7 (-1.2 %) within budget | -30.0 (-7.4 %) within budget |
| startup.cold.navigation-start-ms | 251 (10, 2.8) | 251 (10, 2.8) | 215 (10, 2.5) | -0.3 (-0.1 %) within budget | -36.0 (-14.3 %) improvement |
| startup.cold.process-started-ms | 30.4 (10, 1.4) | 29.4 (10, 0.4) | 30.5 (10, 0.7) | -1.0 (-3.2 %) within budget | +0.1 (+0.4 %) within budget |
| startup.cold.ready-to-show-ms | 404 (10, 4.0) | 398 (10, 11.2) | 253 (10, 2.8) | -5.9 (-1.5 %) within budget | -151 (-37.3 %) improvement |
| startup.cold.renderer-bootstrap-ms | 19.4 (10, 1.2) | 15.4 (10, 0.4) | 23.5 (10, 0.9) | -4.0 (-20.6 %) within budget | +4.0 (+20.9 %) within budget |
| startup.cold.renderer-modules-ms | 122 (10, 2.8) | 117 (10, 3.3) | 124 (10, 4.4) | -4.7 (-3.9 %) within budget | +2.1 (+1.7 %) within budget |
| startup.cold.settled-main-ws-kb | 200992 (10, 48.0) | 200768 (10, 56.0) | 210576 (10, 112) | -224 (-0.1 %) within budget | +9584 (+4.8 %) within budget |
| startup.cold.settled-renderer-ws-kb | 319216 (10, 320) | 318400 (10, 336) | 293616 (10, 384) | -816 (-0.3 %) within budget | -25600 (-8.0 %) within budget |
| startup.cold.settled-tree-rss-kb | 734584 (10, 1008) | 733128 (10, 5936) | 716216 (10, 992) | -1456 (-0.2 %) within budget | -18368 (-2.5 %) within budget |
| startup.cold.window-created-ms | 206 (10, 2.5) | 205 (10, 2.6) | 208 (10, 2.4) | -0.5 (-0.2 %) within budget | +1.8 (+0.9 %) within budget |
| startup.warm.bootstrap-done-ms | 361 (10, 3.9) | 351 (10, 4.8) | 324 (10, 4.0) | -9.3 (-2.6 %) within budget | -36.6 (-10.1 %) improvement |
| startup.warm.bootstrap-start-ms | 345 (10, 2.2) | 339 (10, 3.0) | 307 (10, 4.9) | -5.5 (-1.6 %) within budget | -38.0 (-11.0 %) improvement |
| startup.warm.close-ms | 37.5 (10, 2.5) | 39.0 (10, 2.5) | 45.0 (10, 2.5) | +1.5 (+4.0 %) within budget | +7.5 (+20.0 %) within budget |
| startup.warm.create-window-ms | 166 (10, 1.1) | 165 (10, 1.0) | 167 (10, 1.8) | -0.9 (-0.6 %) within budget | +0.2 (+0.1 %) within budget |
| startup.warm.did-finish-load-ms | 346 (10, 2.1) | 340 (10, 2.9) | 244 (10, 3.3) | -5.4 (-1.6 %) within budget | -101 (-29.3 %) improvement |
| startup.warm.home-rendered-ms | 375 (10, 4.5) | 366 (10, 4.5) | 337 (10, 4.2) | -9.0 (-2.4 %) within budget | -37.3 (-9.9 %) within budget |
| startup.warm.navigation-start-ms | 253 (10, 2.3) | 253 (10, 3.0) | 215 (10, 2.2) | -0.1 (-0.0 %) within budget | -37.9 (-15.0 %) improvement |
| startup.warm.process-started-ms | 30.4 (10, 0.5) | 30.1 (10, 0.2) | 30.4 (10, 1.2) | -0.3 (-1.1 %) within budget | +0.0 (+0.0 %) within budget |
| startup.warm.ready-to-show-ms | 373 (10, 3.3) | 361 (10, 13.2) | 248 (10, 2.4) | -12.3 (-3.3 %) within budget | -125 (-33.6 %) improvement |
| startup.warm.renderer-bootstrap-ms | 14.9 (10, 0.3) | 13.5 (10, 0.3) | 17.5 (10, 0.3) | -1.4 (-9.4 %) within budget | +2.6 (+17.1 %) within budget |
| startup.warm.renderer-modules-ms | 91.9 (10, 1.1) | 86.3 (10, 1.5) | 92.1 (10, 1.2) | -5.7 (-6.1 %) within budget | +0.2 (+0.2 %) within budget |
| startup.warm.settled-main-ws-kb | 205088 (10, 136) | 204704 (10, 144) | 214832 (10, 96.0) | -384 (-0.2 %) within budget | +9744 (+4.8 %) within budget |
| startup.warm.settled-renderer-ws-kb | 257976 (10, 768) | 255808 (10, 1736) | 225864 (10, 312) | -2168 (-0.8 %) within budget | -32112 (-12.4 %) improvement |
| startup.warm.settled-tree-rss-kb | 622432 (10, 952) | 620072 (10, 2400) | 595248 (10, 376) | -2360 (-0.4 %) within budget | -27184 (-4.4 %) within budget |
| startup.warm.window-created-ms | 207 (10, 1.6) | 207 (10, 1.1) | 207 (10, 1.9) | -0.6 (-0.3 %) within budget | +0.2 (+0.1 %) within budget |
| view-data.cycles.retained-tree-kb | -55256 (10, 1976) | -53960 (10, 888) | -54272 (10, 1256) | +1296 (-2.3 %) within budget | +984 (-1.8 %) within budget |
| view-data.heic.after-close-tree-delta-kb | -59640 (10, 2560) | -56416 (10, 584) | -46912 (10, 2512) | +3224 (-5.4 %) within budget | +12728 (-21.3 %) within budget |
| view-data.heic.launch-to-window-created-ms | 9.5 (10, 0.3) | 9.2 (10, 0.1) | 9.1 (10, 0.1) | -0.3 (-3.3 %) within budget | -0.4 (-3.8 %) within budget |
| view-data.heic.menu-to-request-ms | 35.3 (10, 2.8) | 36.9 (10, 1.9) | 37.8 (10, 1.9) | +1.6 (+4.5 %) within budget | +2.6 (+7.4 %) within budget |
| view-data.heic.open-tree-delta-kb | 487480 (10, 1152) | 488832 (10, 688) | 487856 (10, 2824) | +1352 (+0.3 %) within budget | +376 (+0.1 %) within budget |
| view-data.heic.peak-tree-delta-kb | 489000 (10, 1160) | 490224 (10, 648) | 489832 (10, 2840) | +1224 (+0.3 %) within budget | +832 (+0.2 %) within budget |
| view-data.heic.request-to-image-ms | 564 (10, 1.0) | 557 (10, 8.2) | 564 (10, 0.3) | -7.5 (-1.3 %) within budget | -0.0 (-0.0 %) within budget |
| view-data.heic.request-to-launch-ms | 0.3 (10, 0.1) | 0.2 (10, 0.0) | 0.2 (10, 0.0) | -0.1 (-29.6 %) within budget | -0.0 (-13.5 %) within budget |
| view-data.heic.request-to-metadata-ms | 565 (10, 1.1) | 558 (10, 7.7) | 565 (10, 0.2) | -7.0 (-1.2 %) within budget | +0.1 (+0.0 %) within budget |
| view-data.heic.request-to-page-loaded-ms | 86.8 (10, 0.7) | 86.2 (10, 0.6) | 87.3 (10, 1.4) | -0.6 (-0.7 %) within budget | +0.5 (+0.6 %) within budget |
| view-data.heic.window-created-to-page-loaded-ms | 77.1 (10, 0.4) | 76.7 (10, 0.5) | 77.9 (10, 1.0) | -0.4 (-0.5 %) within budget | +0.8 (+1.1 %) within budget |
| view-data.jpeg-first.after-close-tree-delta-kb | -113400 (10, 976) | -115352 (10, 936) | -112760 (10, 928) | -1952 (+1.7 %) within budget | +640 (-0.6 %) within budget |
| view-data.jpeg-first.launch-to-window-created-ms | 18.9 (10, 0.3) | 18.4 (10, 0.5) | 18.7 (10, 0.4) | -0.4 (-2.3 %) within budget | -0.2 (-0.9 %) within budget |
| view-data.jpeg-first.menu-to-request-ms | 28.8 (10, 4.2) | 31.7 (10, 2.4) | 36.4 (10, 2.5) | +2.9 (+10.1 %) within budget | +7.6 (+26.4 %) within budget |
| view-data.jpeg-first.open-tree-delta-kb | 234776 (10, 3096) | 233832 (10, 1512) | 236320 (10, 2016) | -944 (-0.4 %) within budget | +1544 (+0.7 %) within budget |
| view-data.jpeg-first.peak-tree-delta-kb | 250896 (10, 1280) | 250776 (10, 1592) | 251720 (10, 2616) | -120 (-0.0 %) within budget | +824 (+0.3 %) within budget |
| view-data.jpeg-first.request-to-image-ms | 650 (10, 0.8) | 663 (10, 2.3) | 664 (10, 1.2) | +13.1 (+2.0 %) within budget | +14.1 (+2.2 %) within budget |
| view-data.jpeg-first.request-to-launch-ms | 0.3 (10, 0.1) | 0.2 (10, 0.0) | 0.3 (10, 0.1) | -0.1 (-21.3 %) within budget | +0.0 (+5.0 %) within budget |
| view-data.jpeg-first.request-to-metadata-ms | 654 (10, 1.9) | 665 (10, 2.2) | 665 (10, 1.3) | +10.8 (+1.7 %) within budget | +11.7 (+1.8 %) within budget |
| view-data.jpeg-first.request-to-page-loaded-ms | 118 (10, 3.7) | 119 (10, 1.7) | 124 (10, 2.4) | +1.4 (+1.2 %) within budget | +6.3 (+5.3 %) within budget |
| view-data.jpeg-first.window-created-to-page-loaded-ms | 98.5 (10, 3.6) | 102 (10, 2.4) | 106 (10, 1.1) | +3.4 (+3.5 %) within budget | +7.9 (+8.0 %) within budget |
| view-data.jpeg.after-close-tree-delta-kb | -45800 (10, 1088) | -45928 (10, 1440) | -45392 (10, 1216) | -128 (+0.3 %) within budget | +408 (-0.9 %) within budget |
| view-data.jpeg.launch-to-window-created-ms | 9.4 (10, 0.2) | 9.3 (10, 0.2) | 9.1 (10, 0.1) | -0.1 (-0.8 %) within budget | -0.3 (-3.2 %) within budget |
| view-data.jpeg.menu-to-request-ms | 24.8 (10, 0.4) | 24.9 (10, 0.8) | 24.4 (10, 0.4) | +0.2 (+0.6 %) within budget | -0.4 (-1.4 %) within budget |
| view-data.jpeg.open-tree-delta-kb | 292352 (10, 640) | 292408 (10, 624) | 292496 (10, 1440) | +56.0 (+0.0 %) within budget | +144 (+0.0 %) within budget |
| view-data.jpeg.peak-tree-delta-kb | 291536 (10, 656) | 291576 (10, 752) | 291608 (10, 1448) | +40.0 (+0.0 %) within budget | +72.0 (+0.0 %) within budget |
| view-data.jpeg.request-to-image-ms | 632 (10, 0.9) | 631 (10, 0.3) | 631 (10, 0.4) | -0.8 (-0.1 %) within budget | -0.2 (-0.0 %) within budget |
| view-data.jpeg.request-to-launch-ms | 0.2 (10, 0.1) | 0.2 (10, 0.1) | 0.2 (10, 0.1) | +0.0 (+14.9 %) within budget | +0.0 (+19.0 %) within budget |
| view-data.jpeg.request-to-metadata-ms | 633 (10, 1.0) | 632 (10, 0.4) | 632 (10, 0.4) | -0.5 (-0.1 %) within budget | -0.2 (-0.0 %) within budget |
| view-data.jpeg.request-to-page-loaded-ms | 95.7 (10, 1.1) | 95.4 (10, 0.2) | 95.5 (10, 0.9) | -0.3 (-0.3 %) within budget | -0.2 (-0.2 %) within budget |
| view-data.jpeg.window-created-to-page-loaded-ms | 86.4 (10, 0.7) | 85.8 (10, 0.3) | 86.3 (10, 0.9) | -0.6 (-0.7 %) within budget | -0.1 (-0.1 %) within budget |

C1 here is f3cabca8. Its folder opening was measured again, after 0aefe3fc, in series rer-2-C1c.

## C1 against B

The same trials, with B as the baseline.

| Metric | B median (n, MAD) | C1 median (n, MAD) | C1 vs B |
| --- | ---: | ---: | --- |
| open-folder.cold.click-to-complete-ms | 677 (10, 3.5) | 708 (10, 2.5) | +30.4 (+4.5 %) within budget |
| open-folder.cold.click-to-dialog-ms | 32.3 (10, 4.0) | 28.5 (10, 2.8) | -3.9 (-12.1 %) within budget |
| open-folder.cold.dialog-ms | 0.4 (10, 0.0) | 0.5 (10, 0.1) | +0.1 (+12.5 %) within budget |
| open-folder.cold.dialog-to-start-ms | 0.1 (10, 0.0) | 0.1 (10, 0.0) | +0.0 (+0.0 %) within budget |
| open-folder.cold.directory-tree-ms | 17.2 (10, 0.2) | 9.3 (10, 0.3) | -7.9 (-46.2 %) improvement |
| open-folder.cold.exif-files | 314 (10, 0.0) | 314 (10, 0.0) | +0.0 (+0.0 %) same |
| open-folder.cold.exif-max-file-ms | 23.8 (10, 0.4) | 29.7 (10, 0.6) | +5.9 (+24.6 %) |
| open-folder.cold.exif-parse-sum-ms | 79.3 (10, 1.4) | 86.2 (10, 11.4) | +6.9 (+8.7 %) |
| open-folder.cold.exif-read-sum-ms | 228 (10, 5.5) | 266 (10, 27.4) | +37.9 (+16.6 %) |
| open-folder.cold.exif-rotate-sum-ms | 4782 (10, 13.0) | 4811 (10, 14.0) | +28.2 (+0.6 %) |
| open-folder.cold.exif-thumbnail-sum-ms | 50.9 (10, 2.5) | 55.0 (10, 3.7) | +4.0 (+7.9 %) |
| open-folder.cold.finish-ms | 111 (10, 0.5) | 145 (10, 1.2) | +33.2 (+29.8 %) REGRESSION |
| open-folder.cold.main-event-loop-max-ms | 23.3 (10, 1.3) | 23.1 (10, 3.3) | -0.2 (-0.9 %) within budget |
| open-folder.cold.main-event-loop-p99-ms | 18.6 (10, 1.4) | 19.0 (10, 1.5) | +0.4 (+2.4 %) within budget |
| open-folder.cold.peak-tree-delta-kb | 2820408 (10, 252160) | 2417600 (10, 177328) | -402808 (-14.3 %) within budget |
| open-folder.cold.peak-tree-rss-kb | 3560072 (10, 253064) | 3133088 (10, 177176) | -426984 (-12.0 %) within budget |
| open-folder.cold.photo-data-ms | 517 (10, 0.6) | 525 (10, 0.5) | +8.0 (+1.5 %) within budget |
| open-folder.cold.renderer-longtask-max-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.cold.renderer-longtask-total-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.cold.renderer-longtasks | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.cold.renderer-max-frame-gap-ms | 58.4 (10, 4.1) | 33.4 (10, 0.6) | -25.1 (-42.9 %) improvement |
| open-folder.cold.settled-main-ws-kb | 239456 (10, 21144) | 188176 (10, 8896) | -51280 (-21.4 %) within budget |
| open-folder.cold.settled-renderer-ws-kb | 286560 (10, 15472) | 232328 (10, 13080) | -54232 (-18.9 %) within budget |
| open-folder.cold.settled-tree-rss-kb | 687384 (10, 31592) | 573832 (10, 28120) | -113552 (-16.5 %) within budget |
| open-folder.cold.start-to-complete-ms | 645 (10, 0.8) | 678 (10, 1.1) | +33.0 (+5.1 %) within budget |
| open-folder.cold.start-to-markers-ms | 1665 (10, 1.1) | 1649 (10, 1.9) | -15.4 (-0.9 %) within budget |
| open-folder.cold.start-to-thumbnails-done-ms | 5644 (10, 0.5) | 5677 (10, 1.0) | +32.2 (+0.6 %) within budget |
| open-folder.cold.thumbnails-main-ms | 2002 (10, 19.8) | 2001 (10, 44.9) | -1.2 (-0.1 %) within budget |
| open-folder.warm.click-to-complete-ms | 686 (10, 4.5) | 680 (10, 4.3) | -5.8 (-0.8 %) within budget |
| open-folder.warm.click-to-dialog-ms | 28.0 (10, 2.7) | 27.4 (10, 3.2) | -0.6 (-2.0 %) within budget |
| open-folder.warm.dialog-ms | 0.4 (10, 0.0) | 0.6 (10, 0.1) | +0.2 (+50.0 %) within budget |
| open-folder.warm.dialog-to-start-ms | 0.1 (10, 0.0) | 0.1 (10, 0.0) | +0.0 (+0.1 %) within budget |
| open-folder.warm.directory-tree-ms | 18.0 (10, 0.1) | 8.8 (10, 0.7) | -9.3 (-51.5 %) improvement |
| open-folder.warm.exif-files | 314 (10, 0.0) | 314 (10, 0.0) | +0.0 (+0.0 %) same |
| open-folder.warm.exif-max-file-ms | 36.4 (10, 2.6) | 30.5 (10, 1.3) | -5.9 (-16.2 %) |
| open-folder.warm.exif-parse-sum-ms | 62.8 (10, 1.4) | 62.6 (10, 2.2) | -0.2 (-0.4 %) |
| open-folder.warm.exif-read-sum-ms | 203 (10, 4.1) | 209 (10, 9.4) | +6.2 (+3.0 %) |
| open-folder.warm.exif-rotate-sum-ms | 4964 (10, 28.6) | 4956 (10, 34.7) | -7.6 (-0.2 %) |
| open-folder.warm.exif-thumbnail-sum-ms | 49.6 (10, 2.6) | 50.8 (10, 2.3) | +1.2 (+2.4 %) |
| open-folder.warm.finish-ms | 110 (10, 0.7) | 112 (10, 0.8) | +1.9 (+1.7 %) within budget |
| open-folder.warm.main-event-loop-max-ms | 12.4 (10, 0.2) | 12.7 (10, 0.2) | +0.3 (+2.6 %) within budget |
| open-folder.warm.main-event-loop-p99-ms | 12.3 (10, 0.1) | 12.4 (10, 0.1) | +0.1 (+0.8 %) within budget |
| open-folder.warm.peak-tree-delta-kb | 111816 (10, 23048) | 127352 (10, 22168) | +15536 (+13.9 %) within budget |
| open-folder.warm.peak-tree-rss-kb | 811080 (10, 17392) | 720296 (10, 23328) | -90784 (-11.2 %) improvement |
| open-folder.warm.photo-data-ms | 532 (10, 0.8) | 528 (10, 1.4) | -4.5 (-0.8 %) within budget |
| open-folder.warm.renderer-longtask-max-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.warm.renderer-longtask-total-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.warm.renderer-longtasks | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.warm.renderer-max-frame-gap-ms | 70.3 (10, 4.6) | 23.9 (10, 4.5) | -46.4 (-66.0 %) improvement |
| open-folder.warm.settled-main-ws-kb | 257384 (10, 13288) | 226928 (10, 5264) | -30456 (-11.8 %) within budget |
| open-folder.warm.settled-renderer-ws-kb | 358736 (10, 8560) | 302016 (10, 10904) | -56720 (-15.8 %) improvement |
| open-folder.warm.settled-tree-rss-kb | 809624 (10, 17464) | 718328 (10, 23840) | -91296 (-11.3 %) improvement |
| open-folder.warm.start-to-complete-ms | 660 (10, 2.2) | 649 (10, 1.2) | -11.4 (-1.7 %) within budget |
| settings.restart.click-to-exit-ms | 122 (10, 6.5) | 118 (10, 6.0) | -4.0 (-3.3 %) within budget |
| settings.restart.click-to-home-rendered-ms | 478 (10, 4.3) | 425 (10, 7.0) | -52.3 (-11.0 %) improvement |
| settings.restart.click-to-process-started-ms | 150 (10, 6.8) | 146 (10, 6.1) | -4.1 (-2.8 %) within budget |
| settings.restart.process-to-home-rendered-ms | 325 (10, 3.9) | 280 (10, 3.5) | -45.2 (-13.9 %) improvement |
| settings.save.click-to-closed-ms | 108 (10, 3.4) | 109 (10, 0.8) | +0.9 (+0.8 %) within budget |
| settings.save.click-to-persisted-ms | 109 (10, 3.0) | 110 (10, 1.0) | +0.5 (+0.5 %) within budget |
| startup.cold.bootstrap-done-ms | 385 (10, 6.8) | 360 (10, 5.8) | -25.0 (-6.5 %) within budget |
| startup.cold.bootstrap-start-ms | 370 (10, 6.5) | 337 (10, 4.8) | -33.1 (-8.9 %) within budget |
| startup.cold.close-ms | 38.5 (10, 1.5) | 44.0 (10, 5.0) | +5.5 (+14.3 %) within budget |
| startup.cold.create-window-ms | 165 (10, 2.2) | 168 (10, 2.0) | +2.3 (+1.4 %) within budget |
| startup.cold.did-finish-load-ms | 371 (10, 6.4) | 243 (10, 3.2) | -128 (-34.6 %) improvement |
| startup.cold.home-rendered-ms | 398 (10, 6.4) | 372 (10, 5.8) | -25.3 (-6.4 %) within budget |
| startup.cold.navigation-start-ms | 251 (10, 2.8) | 215 (10, 2.5) | -35.7 (-14.2 %) improvement |
| startup.cold.process-started-ms | 29.4 (10, 0.4) | 30.5 (10, 0.7) | +1.1 (+3.8 %) within budget |
| startup.cold.ready-to-show-ms | 398 (10, 11.2) | 253 (10, 2.8) | -145 (-36.4 %) improvement |
| startup.cold.renderer-bootstrap-ms | 15.4 (10, 0.4) | 23.5 (10, 0.9) | +8.0 (+52.3 %) REGRESSION |
| startup.cold.renderer-modules-ms | 117 (10, 3.3) | 124 (10, 4.4) | +6.8 (+5.9 %) within budget |
| startup.cold.settled-main-ws-kb | 200768 (10, 56.0) | 210576 (10, 112) | +9808 (+4.9 %) within budget |
| startup.cold.settled-renderer-ws-kb | 318400 (10, 336) | 293616 (10, 384) | -24784 (-7.8 %) within budget |
| startup.cold.settled-tree-rss-kb | 733128 (10, 5936) | 716216 (10, 992) | -16912 (-2.3 %) within budget |
| startup.cold.window-created-ms | 205 (10, 2.6) | 208 (10, 2.4) | +2.3 (+1.1 %) within budget |
| startup.warm.bootstrap-done-ms | 351 (10, 4.8) | 324 (10, 4.0) | -27.3 (-7.8 %) within budget |
| startup.warm.bootstrap-start-ms | 339 (10, 3.0) | 307 (10, 4.9) | -32.5 (-9.6 %) within budget |
| startup.warm.close-ms | 39.0 (10, 2.5) | 45.0 (10, 2.5) | +6.0 (+15.4 %) within budget |
| startup.warm.create-window-ms | 165 (10, 1.0) | 167 (10, 1.8) | +1.2 (+0.7 %) within budget |
| startup.warm.did-finish-load-ms | 340 (10, 2.9) | 244 (10, 3.3) | -95.9 (-28.2 %) improvement |
| startup.warm.home-rendered-ms | 366 (10, 4.5) | 337 (10, 4.2) | -28.3 (-7.7 %) within budget |
| startup.warm.navigation-start-ms | 253 (10, 3.0) | 215 (10, 2.2) | -37.8 (-15.0 %) improvement |
| startup.warm.process-started-ms | 30.1 (10, 0.2) | 30.4 (10, 1.2) | +0.3 (+1.1 %) within budget |
| startup.warm.ready-to-show-ms | 361 (10, 13.2) | 248 (10, 2.4) | -113 (-31.3 %) improvement |
| startup.warm.renderer-bootstrap-ms | 13.5 (10, 0.3) | 17.5 (10, 0.3) | +4.0 (+29.3 %) within budget |
| startup.warm.renderer-modules-ms | 86.3 (10, 1.5) | 92.1 (10, 1.2) | +5.8 (+6.7 %) within budget |
| startup.warm.settled-main-ws-kb | 204704 (10, 144) | 214832 (10, 96.0) | +10128 (+4.9 %) within budget |
| startup.warm.settled-renderer-ws-kb | 255808 (10, 1736) | 225864 (10, 312) | -29944 (-11.7 %) improvement |
| startup.warm.settled-tree-rss-kb | 620072 (10, 2400) | 595248 (10, 376) | -24824 (-4.0 %) within budget |
| startup.warm.window-created-ms | 207 (10, 1.1) | 207 (10, 1.9) | +0.8 (+0.4 %) within budget |
| view-data.cycles.retained-tree-kb | -53960 (10, 888) | -54272 (10, 1256) | -312 (+0.6 %) within budget |
| view-data.heic.after-close-tree-delta-kb | -56416 (10, 584) | -46912 (10, 2512) | +9504 (-16.8 %) within budget |
| view-data.heic.launch-to-window-created-ms | 9.2 (10, 0.1) | 9.1 (10, 0.1) | -0.0 (-0.5 %) within budget |
| view-data.heic.menu-to-request-ms | 36.9 (10, 1.9) | 37.8 (10, 1.9) | +1.0 (+2.7 %) within budget |
| view-data.heic.open-tree-delta-kb | 488832 (10, 688) | 487856 (10, 2824) | -976 (-0.2 %) within budget |
| view-data.heic.peak-tree-delta-kb | 490224 (10, 648) | 489832 (10, 2840) | -392 (-0.1 %) within budget |
| view-data.heic.request-to-image-ms | 557 (10, 8.2) | 564 (10, 0.3) | +7.4 (+1.3 %) within budget |
| view-data.heic.request-to-launch-ms | 0.2 (10, 0.0) | 0.2 (10, 0.0) | +0.0 (+22.8 %) within budget |
| view-data.heic.request-to-metadata-ms | 558 (10, 7.7) | 565 (10, 0.2) | +7.2 (+1.3 %) within budget |
| view-data.heic.request-to-page-loaded-ms | 86.2 (10, 0.6) | 87.3 (10, 1.4) | +1.1 (+1.3 %) within budget |
| view-data.heic.window-created-to-page-loaded-ms | 76.7 (10, 0.5) | 77.9 (10, 1.0) | +1.2 (+1.6 %) within budget |
| view-data.jpeg-first.after-close-tree-delta-kb | -115352 (10, 936) | -112760 (10, 928) | +2592 (-2.2 %) within budget |
| view-data.jpeg-first.launch-to-window-created-ms | 18.4 (10, 0.5) | 18.7 (10, 0.4) | +0.3 (+1.4 %) within budget |
| view-data.jpeg-first.menu-to-request-ms | 31.7 (10, 2.4) | 36.4 (10, 2.5) | +4.7 (+14.8 %) within budget |
| view-data.jpeg-first.open-tree-delta-kb | 233832 (10, 1512) | 236320 (10, 2016) | +2488 (+1.1 %) within budget |
| view-data.jpeg-first.peak-tree-delta-kb | 250776 (10, 1592) | 251720 (10, 2616) | +944 (+0.4 %) within budget |
| view-data.jpeg-first.request-to-image-ms | 663 (10, 2.3) | 664 (10, 1.2) | +1.0 (+0.2 %) within budget |
| view-data.jpeg-first.request-to-launch-ms | 0.2 (10, 0.0) | 0.3 (10, 0.1) | +0.1 (+33.4 %) within budget |
| view-data.jpeg-first.request-to-metadata-ms | 665 (10, 2.2) | 665 (10, 1.3) | +0.9 (+0.1 %) within budget |
| view-data.jpeg-first.request-to-page-loaded-ms | 119 (10, 1.7) | 124 (10, 2.4) | +4.8 (+4.0 %) within budget |
| view-data.jpeg-first.window-created-to-page-loaded-ms | 102 (10, 2.4) | 106 (10, 1.1) | +4.5 (+4.4 %) within budget |
| view-data.jpeg.after-close-tree-delta-kb | -45928 (10, 1440) | -45392 (10, 1216) | +536 (-1.2 %) within budget |
| view-data.jpeg.launch-to-window-created-ms | 9.3 (10, 0.2) | 9.1 (10, 0.1) | -0.2 (-2.4 %) within budget |
| view-data.jpeg.menu-to-request-ms | 24.9 (10, 0.8) | 24.4 (10, 0.4) | -0.5 (-2.0 %) within budget |
| view-data.jpeg.open-tree-delta-kb | 292408 (10, 624) | 292496 (10, 1440) | +88.0 (+0.0 %) within budget |
| view-data.jpeg.peak-tree-delta-kb | 291576 (10, 752) | 291608 (10, 1448) | +32.0 (+0.0 %) within budget |
| view-data.jpeg.request-to-image-ms | 631 (10, 0.3) | 631 (10, 0.4) | +0.6 (+0.1 %) within budget |
| view-data.jpeg.request-to-launch-ms | 0.2 (10, 0.1) | 0.2 (10, 0.1) | +0.0 (+3.6 %) within budget |
| view-data.jpeg.request-to-metadata-ms | 632 (10, 0.4) | 632 (10, 0.4) | +0.3 (+0.1 %) within budget |
| view-data.jpeg.request-to-page-loaded-ms | 95.4 (10, 0.2) | 95.5 (10, 0.9) | +0.1 (+0.1 %) within budget |
| view-data.jpeg.window-created-to-page-loaded-ms | 85.8 (10, 0.3) | 86.3 (10, 0.9) | +0.5 (+0.6 %) within budget |
