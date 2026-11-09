# Series rer-2-C1 (protocol rer-2)

Builds: 0 (code e6a1d1e7c0b2), B (code c747f3e6fb52), C1 (code 159a667f0dc9). Baseline: 0.
Host: Apple M5, 10 cores, 32 GB, darwin 27.0.0.
Viewer: 4be696704639 (unchanged).
Complete: yes. Trials: {"0":{"open-folder":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"settings":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"startup":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"view-data":{"ok":10,"failed":0,"interrupted":0,"warmup":1}},"B":{"open-folder":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"settings":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"startup":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"view-data":{"ok":10,"failed":0,"interrupted":0,"warmup":1}},"C1":{"open-folder":{"ok":9,"failed":1,"interrupted":0,"warmup":1},"settings":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"startup":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"view-data":{"ok":10,"failed":0,"interrupted":0,"warmup":1}}}

| Metric | 0 median (n, MAD) | B median (n, MAD) | C1 median (n, MAD) | B vs 0 | C1 vs 0 |
| --- | ---: | ---: | ---: | --- | --- |
| open-folder.cold.click-to-complete-ms | 775 (10, 9.5) | 680 (10, 6.5) | 709 (9, 0.8) | -94.7 (-12.2 %) improvement | -66.0 (-8.5 %) within budget |
| open-folder.cold.click-to-dialog-ms | 32.4 (10, 3.7) | 33.8 (10, 6.3) | 31.9 (9, 1.6) | +1.4 (+4.3 %) within budget | -0.5 (-1.7 %) within budget |
| open-folder.cold.dialog-ms | 1.6 (10, 0.1) | 0.4 (10, 0.0) | 0.4 (9, 0.0) | -1.2 (-75.0 %) within budget | -1.2 (-75.0 %) within budget |
| open-folder.cold.dialog-to-start-ms | 0.8 (10, 0.0) | 0.1 (10, 0.0) | 0.1 (9, 0.0) | -0.7 (-87.5 %) within budget | -0.7 (-87.5 %) within budget |
| open-folder.cold.directory-tree-ms | 15.0 (10, 0.3) | 18.2 (10, 0.8) | 8.9 (9, 0.5) | +3.2 (+21.3 %) within budget | -6.1 (-40.7 %) improvement |
| open-folder.cold.exif-files | 314 (10, 0.0) | 314 (10, 0.0) | 314 (9, 0.0) | +0.0 (+0.0 %) same | +0.0 (+0.0 %) same |
| open-folder.cold.exif-max-file-ms | 44.8 (10, 0.4) | 23.3 (10, 0.4) | 29.7 (9, 0.6) | -21.5 (-47.9 %) | -15.1 (-33.7 %) |
| open-folder.cold.exif-parse-sum-ms | 239 (10, 10.7) | 83.9 (10, 3.5) | 84.5 (9, 4.1) | -155 (-64.9 %) | -155 (-64.7 %) |
| open-folder.cold.exif-read-sum-ms | 0.0 (10, 0.0) | 236 (10, 11.2) | 258 (9, 23.3) | +236 () | +258 () |
| open-folder.cold.exif-rotate-sum-ms | 5296 (10, 75.9) | 4771 (10, 15.2) | 4820 (9, 18.4) | -525 (-9.9 %) | -476 (-9.0 %) |
| open-folder.cold.exif-thumbnail-sum-ms | 226 (10, 5.9) | 54.3 (10, 3.0) | 55.1 (9, 2.7) | -172 (-76.0 %) | -171 (-75.6 %) |
| open-folder.cold.finish-ms | 110 (10, 0.6) | 111 (10, 0.5) | 144 (9, 1.4) | +0.6 (+0.5 %) within budget | +34.0 (+30.9 %) REGRESSION |
| open-folder.cold.main-event-loop-max-ms | 23.9 (10, 3.2) | 23.7 (10, 1.0) | 20.9 (9, 1.4) | -0.1 (-0.5 %) within budget | -3.0 (-12.5 %) within budget |
| open-folder.cold.main-event-loop-p99-ms | 19.7 (10, 2.0) | 19.6 (10, 1.0) | 17.6 (9, 1.2) | -0.2 (-0.8 %) within budget | -2.1 (-10.7 %) within budget |
| open-folder.cold.peak-tree-delta-kb | 2574376 (10, 105096) | 2710912 (10, 417272) | 2623664 (9, 365504) | +136536 (+5.3 %) within budget | +49288 (+1.9 %) within budget |
| open-folder.cold.peak-tree-rss-kb | 3314872 (10, 104336) | 3456456 (10, 411008) | 3351040 (9, 377568) | +141584 (+4.3 %) within budget | +36168 (+1.1 %) within budget |
| open-folder.cold.photo-data-ms | 606 (10, 9.5) | 515 (10, 0.7) | 524 (9, 0.5) | -91.0 (-15.0 %) improvement | -82.4 (-13.6 %) improvement |
| open-folder.cold.renderer-longtask-max-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (9, 0.0) | +0.0 () within budget | +0.0 () within budget |
| open-folder.cold.renderer-longtask-total-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (9, 0.0) | +0.0 () within budget | +0.0 () within budget |
| open-folder.cold.renderer-longtasks | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (9, 0.0) | +0.0 () within budget | +0.0 () within budget |
| open-folder.cold.renderer-max-frame-gap-ms | 48.5 (10, 7.8) | 56.7 (10, 3.8) | 33.4 (9, 0.2) | +8.2 (+16.9 %) within budget | -15.1 (-31.1 %) within budget |
| open-folder.cold.settled-main-ws-kb | 193568 (10, 18928) | 217176 (10, 43112) | 215248 (9, 35600) | +23608 (+12.2 %) within budget | +21680 (+11.2 %) within budget |
| open-folder.cold.settled-renderer-ws-kb | 257704 (10, 8728) | 276288 (10, 28080) | 257696 (9, 26544) | +18584 (+7.2 %) within budget | -8.0 (-0.0 %) within budget |
| open-folder.cold.settled-tree-rss-kb | 608912 (10, 29504) | 662680 (10, 69656) | 652208 (9, 94848) | +53768 (+8.8 %) within budget | +43296 (+7.1 %) within budget |
| open-folder.cold.start-to-complete-ms | 732 (10, 9.4) | 644 (10, 0.4) | 678 (9, 1.0) | -87.2 (-11.9 %) improvement | -54.1 (-7.4 %) within budget |
| open-folder.cold.start-to-markers-ms | 1750 (10, 10.3) | 1664 (10, 0.8) | 1650 (9, 1.5) | -86.2 (-4.9 %) within budget | -100 (-5.7 %) within budget |
| open-folder.cold.start-to-thumbnails-done-ms | 5730 (10, 8.9) | 5644 (10, 1.1) | 5677 (9, 1.9) | -86.7 (-1.5 %) within budget | -54.0 (-0.9 %) within budget |
| open-folder.cold.thumbnails-main-ms | 2023 (10, 52.7) | 2019 (10, 58.6) | 1974 (9, 44.9) | -4.1 (-0.2 %) within budget | -49.9 (-2.5 %) within budget |
| open-folder.warm.click-to-complete-ms | 774 (10, 9.6) | 685 (10, 3.7) | 678 (9, 3.6) | -89.0 (-11.5 %) improvement | -96.1 (-12.4 %) improvement |
| open-folder.warm.click-to-dialog-ms | 36.5 (10, 2.3) | 33.9 (10, 4.9) | 28.2 (9, 4.3) | -2.7 (-7.3 %) within budget | -8.3 (-22.8 %) within budget |
| open-folder.warm.dialog-ms | 1.4 (10, 0.0) | 0.5 (10, 0.0) | 0.7 (9, 0.0) | -1.0 (-67.9 %) within budget | -0.7 (-50.0 %) within budget |
| open-folder.warm.dialog-to-start-ms | 0.7 (10, 0.0) | 0.1 (10, 0.0) | 0.1 (9, 0.0) | -0.6 (-85.7 %) within budget | -0.6 (-85.7 %) within budget |
| open-folder.warm.directory-tree-ms | 16.1 (10, 0.5) | 17.8 (10, 0.3) | 9.0 (9, 1.8) | +1.7 (+10.2 %) within budget | -7.1 (-44.1 %) improvement |
| open-folder.warm.exif-files | 314 (10, 0.0) | 314 (10, 0.0) | 314 (9, 0.0) | +0.0 (+0.0 %) same | +0.0 (+0.0 %) same |
| open-folder.warm.exif-max-file-ms | 40.6 (10, 1.7) | 34.7 (10, 5.7) | 30.9 (9, 2.2) | -6.0 (-14.8 %) | -9.7 (-24.0 %) |
| open-folder.warm.exif-parse-sum-ms | 219 (10, 7.2) | 62.6 (10, 2.7) | 63.2 (9, 2.0) | -156 (-71.4 %) | -156 (-71.1 %) |
| open-folder.warm.exif-read-sum-ms | 0.0 (10, 0.0) | 203 (10, 6.0) | 208 (9, 10.3) | +203 () | +208 () |
| open-folder.warm.exif-rotate-sum-ms | 5404 (10, 41.0) | 4888 (10, 57.3) | 4956 (9, 40.8) | -516 (-9.6 %) | -448 (-8.3 %) |
| open-folder.warm.exif-thumbnail-sum-ms | 212 (10, 5.4) | 49.0 (10, 3.0) | 48.2 (9, 1.8) | -163 (-76.9 %) | -164 (-77.3 %) |
| open-folder.warm.finish-ms | 109 (10, 0.8) | 110 (10, 0.3) | 113 (9, 1.2) | +1.3 (+1.2 %) within budget | +3.6 (+3.3 %) within budget |
| open-folder.warm.main-event-loop-max-ms | 12.4 (10, 0.3) | 12.4 (10, 0.1) | 12.4 (9, 0.1) | +0.0 (+0.1 %) within budget | -0.0 (-0.2 %) within budget |
| open-folder.warm.main-event-loop-p99-ms | 12.2 (10, 0.0) | 12.3 (10, 0.1) | 12.3 (9, 0.1) | +0.1 (+0.9 %) within budget | +0.1 (+0.7 %) within budget |
| open-folder.warm.peak-tree-delta-kb | 142728 (10, 18536) | 126304 (10, 31144) | 129088 (9, 20976) | -16424 (-11.5 %) within budget | -13640 (-9.6 %) within budget |
| open-folder.warm.peak-tree-rss-kb | 756176 (10, 18800) | 784352 (10, 40792) | 768560 (9, 54128) | +28176 (+3.7 %) within budget | +12384 (+1.6 %) within budget |
| open-folder.warm.photo-data-ms | 610 (10, 4.3) | 519 (10, 2.5) | 526 (9, 2.1) | -91.3 (-15.0 %) improvement | -84.1 (-13.8 %) improvement |
| open-folder.warm.renderer-longtask-max-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (9, 0.0) | +0.0 () within budget | +0.0 () within budget |
| open-folder.warm.renderer-longtask-total-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (9, 0.0) | +0.0 () within budget | +0.0 () within budget |
| open-folder.warm.renderer-longtasks | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (9, 0.0) | +0.0 () within budget | +0.0 () within budget |
| open-folder.warm.renderer-max-frame-gap-ms | 69.4 (10, 7.7) | 76.0 (10, 4.0) | 19.0 (9, 0.4) | +6.7 (+9.6 %) within budget | -50.4 (-72.6 %) improvement |
| open-folder.warm.settled-main-ws-kb | 234600 (10, 7560) | 241136 (10, 23384) | 246256 (9, 26112) | +6536 (+2.8 %) within budget | +11656 (+5.0 %) within budget |
| open-folder.warm.settled-renderer-ws-kb | 335616 (10, 10016) | 339288 (10, 19336) | 317376 (9, 18592) | +3672 (+1.1 %) within budget | -18240 (-5.4 %) within budget |
| open-folder.warm.settled-tree-rss-kb | 757800 (10, 18392) | 781104 (10, 40424) | 764032 (9, 55936) | +23304 (+3.1 %) within budget | +6232 (+0.8 %) within budget |
| open-folder.warm.start-to-complete-ms | 735 (10, 3.7) | 648 (10, 3.9) | 649 (9, 1.4) | -87.0 (-11.8 %) improvement | -86.0 (-11.7 %) improvement |
| settings.restart.click-to-exit-ms | 127 (10, 5.0) | 122 (10, 5.0) | 124 (10, 6.0) | -5.5 (-4.3 %) within budget | -3.5 (-2.8 %) within budget |
| settings.restart.click-to-home-rendered-ms | 490 (10, 7.7) | 477 (10, 3.8) | 439 (10, 8.6) | -13.1 (-2.7 %) within budget | -50.7 (-10.4 %) improvement |
| settings.restart.click-to-process-started-ms | 156 (10, 4.8) | 149 (10, 4.6) | 152 (10, 6.0) | -7.2 (-4.6 %) within budget | -3.9 (-2.5 %) within budget |
| settings.restart.process-to-home-rendered-ms | 334 (10, 6.9) | 328 (10, 4.6) | 287 (10, 2.6) | -6.1 (-1.8 %) within budget | -46.5 (-13.9 %) improvement |
| settings.save.click-to-closed-ms | 109 (10, 3.2) | 107 (10, 2.9) | 109 (10, 0.6) | -2.2 (-2.1 %) within budget | +0.5 (+0.4 %) within budget |
| settings.save.click-to-persisted-ms | 109 (10, 3.5) | 107 (10, 3.0) | 110 (10, 0.5) | -2.0 (-1.8 %) within budget | +0.5 (+0.5 %) within budget |
| startup.cold.bootstrap-done-ms | 392 (10, 2.9) | 386 (10, 5.6) | 376 (10, 5.7) | -6.5 (-1.6 %) within budget | -16.3 (-4.2 %) within budget |
| startup.cold.bootstrap-start-ms | 373 (10, 2.9) | 370 (10, 6.6) | 353 (10, 5.7) | -3.0 (-0.8 %) within budget | -20.3 (-5.4 %) within budget |
| startup.cold.close-ms | 43.5 (10, 3.5) | 41.0 (10, 3.5) | 39.0 (10, 1.0) | -2.5 (-5.7 %) within budget | -4.5 (-10.3 %) within budget |
| startup.cold.create-window-ms | 165 (10, 2.2) | 167 (10, 3.7) | 168 (10, 2.5) | +1.7 (+1.0 %) within budget | +3.1 (+1.9 %) within budget |
| startup.cold.did-finish-load-ms | 374 (10, 2.9) | 371 (10, 6.5) | 242 (10, 3.2) | -3.1 (-0.8 %) within budget | -132 (-35.2 %) improvement |
| startup.cold.home-rendered-ms | 404 (10, 4.3) | 398 (10, 5.3) | 387 (10, 6.4) | -5.9 (-1.5 %) within budget | -16.3 (-4.0 %) within budget |
| startup.cold.navigation-start-ms | 251 (10, 2.3) | 253 (10, 5.0) | 215 (10, 3.8) | +1.6 (+0.6 %) within budget | -36.0 (-14.3 %) improvement |
| startup.cold.process-started-ms | 30.7 (10, 2.3) | 30.2 (10, 0.6) | 30.9 (10, 0.7) | -0.5 (-1.7 %) within budget | +0.2 (+0.8 %) within budget |
| startup.cold.ready-to-show-ms | 404 (10, 3.4) | 397 (10, 8.1) | 247 (10, 3.8) | -6.6 (-1.6 %) within budget | -157 (-38.8 %) improvement |
| startup.cold.renderer-bootstrap-ms | 18.6 (10, 1.0) | 16.7 (10, 1.3) | 23.1 (10, 0.9) | -1.9 (-10.2 %) within budget | +4.5 (+24.5 %) within budget |
| startup.cold.renderer-modules-ms | 122 (10, 1.3) | 116 (10, 1.7) | 139 (10, 2.9) | -5.6 (-4.6 %) within budget | +17.5 (+14.4 %) REGRESSION |
| startup.cold.settled-main-ws-kb | 200968 (10, 128) | 200664 (10, 136) | 210680 (10, 112) | -304 (-0.2 %) within budget | +9712 (+4.8 %) within budget |
| startup.cold.settled-renderer-ws-kb | 319312 (10, 272) | 317888 (10, 1024) | 293568 (10, 240) | -1424 (-0.4 %) within budget | -25744 (-8.1 %) within budget |
| startup.cold.settled-tree-rss-kb | 734504 (10, 896) | 732712 (10, 2072) | 715768 (10, 504) | -1792 (-0.2 %) within budget | -18736 (-2.6 %) within budget |
| startup.cold.window-created-ms | 205 (10, 2.4) | 206 (10, 3.6) | 208 (10, 3.4) | +1.1 (+0.6 %) within budget | +3.4 (+1.6 %) within budget |
| startup.warm.bootstrap-done-ms | 356 (10, 3.3) | 349 (10, 3.8) | 341 (10, 4.2) | -7.8 (-2.2 %) within budget | -15.6 (-4.4 %) within budget |
| startup.warm.bootstrap-start-ms | 341 (10, 4.3) | 337 (10, 2.8) | 322 (10, 3.0) | -4.5 (-1.3 %) within budget | -19.6 (-5.7 %) within budget |
| startup.warm.close-ms | 42.0 (10, 3.0) | 40.0 (10, 3.0) | 43.0 (10, 2.0) | -2.0 (-4.8 %) within budget | +1.0 (+2.4 %) within budget |
| startup.warm.create-window-ms | 166 (10, 1.3) | 165 (10, 2.1) | 166 (10, 0.9) | -0.5 (-0.3 %) within budget | +0.4 (+0.3 %) within budget |
| startup.warm.did-finish-load-ms | 342 (10, 4.3) | 338 (10, 2.8) | 243 (10, 2.1) | -4.6 (-1.3 %) within budget | -99.8 (-29.2 %) improvement |
| startup.warm.home-rendered-ms | 370 (10, 3.4) | 362 (10, 3.3) | 354 (10, 3.9) | -8.2 (-2.2 %) within budget | -16.6 (-4.5 %) within budget |
| startup.warm.navigation-start-ms | 251 (10, 2.1) | 251 (10, 1.7) | 214 (10, 2.5) | +0.3 (+0.1 %) within budget | -36.6 (-14.6 %) improvement |
| startup.warm.process-started-ms | 30.3 (10, 0.4) | 30.5 (10, 0.2) | 29.9 (10, 0.9) | +0.2 (+0.6 %) within budget | -0.5 (-1.6 %) within budget |
| startup.warm.ready-to-show-ms | 371 (10, 3.5) | 363 (10, 6.5) | 247 (10, 1.7) | -8.3 (-2.2 %) within budget | -125 (-33.5 %) improvement |
| startup.warm.renderer-bootstrap-ms | 14.8 (10, 0.8) | 11.0 (10, 0.6) | 17.9 (10, 0.5) | -3.8 (-26.0 %) within budget | +3.1 (+20.6 %) within budget |
| startup.warm.renderer-modules-ms | 91.2 (10, 1.4) | 86.2 (10, 1.1) | 106 (10, 0.9) | -5.0 (-5.5 %) within budget | +15.2 (+16.7 %) REGRESSION |
| startup.warm.settled-main-ws-kb | 205368 (10, 128) | 204880 (10, 200) | 214944 (10, 48.0) | -488 (-0.2 %) within budget | +9576 (+4.7 %) within budget |
| startup.warm.settled-renderer-ws-kb | 254944 (10, 1144) | 253920 (10, 2368) | 230216 (10, 992) | -1024 (-0.4 %) within budget | -24728 (-9.7 %) within budget |
| startup.warm.settled-tree-rss-kb | 620976 (10, 2248) | 620152 (10, 1784) | 604272 (10, 9088) | -824 (-0.1 %) within budget | -16704 (-2.7 %) within budget |
| startup.warm.window-created-ms | 206 (10, 1.1) | 206 (10, 1.8) | 207 (10, 1.1) | -0.2 (-0.1 %) within budget | +0.4 (+0.2 %) within budget |
| view-data.cycles.retained-tree-kb | -54584 (10, 1536) | -53576 (10, 2528) | -55176 (10, 1200) | +1008 (-1.8 %) within budget | -592 (+1.1 %) within budget |
| view-data.heic.after-close-tree-delta-kb | -62632 (10, 2312) | -58184 (10, 1576) | -50520 (10, 3416) | +4448 (-7.1 %) within budget | +12112 (-19.3 %) within budget |
| view-data.heic.launch-to-window-created-ms | 9.3 (10, 0.3) | 9.3 (10, 0.2) | 9.2 (10, 0.2) | +0.0 (+0.4 %) within budget | -0.1 (-0.9 %) within budget |
| view-data.heic.menu-to-request-ms | 37.6 (10, 1.0) | 37.2 (10, 1.9) | 36.1 (10, 1.5) | -0.4 (-0.9 %) within budget | -1.5 (-4.0 %) within budget |
| view-data.heic.open-tree-delta-kb | 483056 (10, 1432) | 488840 (10, 1208) | 488608 (10, 3688) | +5784 (+1.2 %) within budget | +5552 (+1.1 %) within budget |
| view-data.heic.peak-tree-delta-kb | 484568 (10, 1440) | 490272 (10, 1064) | 490608 (10, 3784) | +5704 (+1.2 %) within budget | +6040 (+1.2 %) within budget |
| view-data.heic.request-to-image-ms | 564 (10, 1.0) | 564 (10, 8.8) | 563 (10, 7.3) | +0.0 (+0.0 %) within budget | -0.9 (-0.2 %) within budget |
| view-data.heic.request-to-launch-ms | 0.2 (10, 0.1) | 0.2 (10, 0.1) | 0.2 (10, 0.1) | -0.0 (-13.6 %) within budget | -0.0 (-6.8 %) within budget |
| view-data.heic.request-to-metadata-ms | 565 (10, 1.2) | 566 (10, 8.5) | 565 (10, 7.3) | +0.2 (+0.0 %) within budget | -0.7 (-0.1 %) within budget |
| view-data.heic.request-to-page-loaded-ms | 86.8 (10, 1.4) | 86.5 (10, 0.8) | 87.5 (10, 2.0) | -0.3 (-0.4 %) within budget | +0.7 (+0.8 %) within budget |
| view-data.heic.window-created-to-page-loaded-ms | 77.4 (10, 1.4) | 77.2 (10, 1.2) | 77.8 (10, 2.0) | -0.2 (-0.3 %) within budget | +0.5 (+0.6 %) within budget |
| view-data.jpeg-first.after-close-tree-delta-kb | -113872 (10, 416) | -115144 (10, 1624) | -112248 (10, 2248) | -1272 (+1.1 %) within budget | +1624 (-1.4 %) within budget |
| view-data.jpeg-first.launch-to-window-created-ms | 19.0 (10, 0.4) | 18.7 (10, 0.3) | 18.7 (10, 1.5) | -0.3 (-1.6 %) within budget | -0.3 (-1.6 %) within budget |
| view-data.jpeg-first.menu-to-request-ms | 28.4 (10, 1.6) | 31.6 (10, 4.5) | 31.5 (10, 1.9) | +3.2 (+11.3 %) within budget | +3.1 (+10.9 %) within budget |
| view-data.jpeg-first.open-tree-delta-kb | 235216 (10, 2312) | 235752 (10, 6080) | 235944 (10, 3712) | +536 (+0.2 %) within budget | +728 (+0.3 %) within budget |
| view-data.jpeg-first.peak-tree-delta-kb | 248760 (10, 2848) | 251216 (10, 5120) | 250440 (10, 3136) | +2456 (+1.0 %) within budget | +1680 (+0.7 %) within budget |
| view-data.jpeg-first.request-to-image-ms | 650 (10, 2.3) | 657 (10, 7.0) | 664 (10, 1.5) | +6.9 (+1.1 %) within budget | +13.5 (+2.1 %) within budget |
| view-data.jpeg-first.request-to-launch-ms | 0.3 (10, 0.1) | 0.2 (10, 0.0) | 0.3 (10, 0.0) | -0.0 (-8.0 %) within budget | +0.0 (+10.5 %) within budget |
| view-data.jpeg-first.request-to-metadata-ms | 655 (10, 5.5) | 660 (10, 5.7) | 666 (10, 1.3) | +4.5 (+0.7 %) within budget | +10.6 (+1.6 %) within budget |
| view-data.jpeg-first.request-to-page-loaded-ms | 117 (10, 0.9) | 119 (10, 2.7) | 123 (10, 0.8) | +1.3 (+1.1 %) within budget | +5.5 (+4.7 %) within budget |
| view-data.jpeg-first.window-created-to-page-loaded-ms | 97.3 (10, 1.7) | 100 (10, 2.4) | 103 (10, 1.0) | +2.8 (+2.8 %) within budget | +5.9 (+6.1 %) within budget |
| view-data.jpeg.after-close-tree-delta-kb | -46640 (10, 176) | -44608 (10, 2072) | -46248 (10, 1432) | +2032 (-4.4 %) within budget | +392 (-0.8 %) within budget |
| view-data.jpeg.launch-to-window-created-ms | 9.1 (10, 0.4) | 9.3 (10, 0.3) | 9.2 (10, 0.2) | +0.2 (+1.8 %) within budget | +0.1 (+0.6 %) within budget |
| view-data.jpeg.menu-to-request-ms | 24.5 (10, 0.9) | 24.8 (10, 0.8) | 25.1 (10, 0.7) | +0.3 (+1.2 %) within budget | +0.5 (+2.0 %) within budget |
| view-data.jpeg.open-tree-delta-kb | 292680 (10, 608) | 291616 (10, 936) | 292960 (10, 1640) | -1064 (-0.4 %) within budget | +280 (+0.1 %) within budget |
| view-data.jpeg.peak-tree-delta-kb | 291880 (10, 600) | 290568 (10, 776) | 291992 (10, 1712) | -1312 (-0.4 %) within budget | +112 (+0.0 %) within budget |
| view-data.jpeg.request-to-image-ms | 631 (10, 0.8) | 631 (10, 1.4) | 631 (10, 0.9) | -0.1 (-0.0 %) within budget | -0.2 (-0.0 %) within budget |
| view-data.jpeg.request-to-launch-ms | 0.2 (10, 0.0) | 0.2 (10, 0.1) | 0.2 (10, 0.1) | +0.0 (+7.8 %) within budget | +0.0 (+0.7 %) within budget |
| view-data.jpeg.request-to-metadata-ms | 632 (10, 0.5) | 633 (10, 2.0) | 632 (10, 0.9) | +0.7 (+0.1 %) within budget | -0.2 (-0.0 %) within budget |
| view-data.jpeg.request-to-page-loaded-ms | 96.4 (10, 1.7) | 95.8 (10, 1.2) | 96.1 (10, 1.3) | -0.6 (-0.6 %) within budget | -0.3 (-0.3 %) within budget |
| view-data.jpeg.window-created-to-page-loaded-ms | 87.1 (10, 1.5) | 86.4 (10, 0.9) | 86.6 (10, 1.4) | -0.7 (-0.8 %) within budget | -0.5 (-0.5 %) within budget |

C1 here is ac6a51ad. Two of its three regressions were fixed before series rer-2-C1b; the third, `open-folder.cold.finish-ms`, was still one there, and was fixed in 0aefe3fc, which series rer-2-C1c measured (STATUS.md, "Stage C1 notes"). The first attempt of this series ended in its warm-up round on a harness error, and is not kept.

## C1 against B

The same trials, with B as the baseline.

| Metric | B median (n, MAD) | C1 median (n, MAD) | C1 vs B |
| --- | ---: | ---: | --- |
| open-folder.cold.click-to-complete-ms | 680 (10, 6.5) | 709 (9, 0.8) | +28.7 (+4.2 %) within budget |
| open-folder.cold.click-to-dialog-ms | 33.8 (10, 6.3) | 31.9 (9, 1.6) | -1.9 (-5.8 %) within budget |
| open-folder.cold.dialog-ms | 0.4 (10, 0.0) | 0.4 (9, 0.0) | +0.0 (+0.0 %) within budget |
| open-folder.cold.dialog-to-start-ms | 0.1 (10, 0.0) | 0.1 (9, 0.0) | +0.0 (+0.2 %) within budget |
| open-folder.cold.directory-tree-ms | 18.2 (10, 0.8) | 8.9 (9, 0.5) | -9.3 (-51.1 %) improvement |
| open-folder.cold.exif-files | 314 (10, 0.0) | 314 (9, 0.0) | +0.0 (+0.0 %) same |
| open-folder.cold.exif-max-file-ms | 23.3 (10, 0.4) | 29.7 (9, 0.6) | +6.4 (+27.2 %) |
| open-folder.cold.exif-parse-sum-ms | 83.9 (10, 3.5) | 84.5 (9, 4.1) | +0.7 (+0.8 %) |
| open-folder.cold.exif-read-sum-ms | 236 (10, 11.2) | 258 (9, 23.3) | +22.0 (+9.3 %) |
| open-folder.cold.exif-rotate-sum-ms | 4771 (10, 15.2) | 4820 (9, 18.4) | +49.2 (+1.0 %) |
| open-folder.cold.exif-thumbnail-sum-ms | 54.3 (10, 3.0) | 55.1 (9, 2.7) | +0.8 (+1.6 %) |
| open-folder.cold.finish-ms | 111 (10, 0.5) | 144 (9, 1.4) | +33.5 (+30.2 %) REGRESSION |
| open-folder.cold.main-event-loop-max-ms | 23.7 (10, 1.0) | 20.9 (9, 1.4) | -2.9 (-12.0 %) within budget |
| open-folder.cold.main-event-loop-p99-ms | 19.6 (10, 1.0) | 17.6 (9, 1.2) | -2.0 (-10.0 %) within budget |
| open-folder.cold.peak-tree-delta-kb | 2710912 (10, 417272) | 2623664 (9, 365504) | -87248 (-3.2 %) within budget |
| open-folder.cold.peak-tree-rss-kb | 3456456 (10, 411008) | 3351040 (9, 377568) | -105416 (-3.0 %) within budget |
| open-folder.cold.photo-data-ms | 515 (10, 0.7) | 524 (9, 0.5) | +8.6 (+1.7 %) within budget |
| open-folder.cold.renderer-longtask-max-ms | 0.0 (10, 0.0) | 0.0 (9, 0.0) | +0.0 () within budget |
| open-folder.cold.renderer-longtask-total-ms | 0.0 (10, 0.0) | 0.0 (9, 0.0) | +0.0 () within budget |
| open-folder.cold.renderer-longtasks | 0.0 (10, 0.0) | 0.0 (9, 0.0) | +0.0 () within budget |
| open-folder.cold.renderer-max-frame-gap-ms | 56.7 (10, 3.8) | 33.4 (9, 0.2) | -23.3 (-41.0 %) improvement |
| open-folder.cold.settled-main-ws-kb | 217176 (10, 43112) | 215248 (9, 35600) | -1928 (-0.9 %) within budget |
| open-folder.cold.settled-renderer-ws-kb | 276288 (10, 28080) | 257696 (9, 26544) | -18592 (-6.7 %) within budget |
| open-folder.cold.settled-tree-rss-kb | 662680 (10, 69656) | 652208 (9, 94848) | -10472 (-1.6 %) within budget |
| open-folder.cold.start-to-complete-ms | 644 (10, 0.4) | 678 (9, 1.0) | +33.1 (+5.1 %) within budget |
| open-folder.cold.start-to-markers-ms | 1664 (10, 0.8) | 1650 (9, 1.5) | -14.0 (-0.8 %) within budget |
| open-folder.cold.start-to-thumbnails-done-ms | 5644 (10, 1.1) | 5677 (9, 1.9) | +32.8 (+0.6 %) within budget |
| open-folder.cold.thumbnails-main-ms | 2019 (10, 58.6) | 1974 (9, 44.9) | -45.8 (-2.3 %) within budget |
| open-folder.warm.click-to-complete-ms | 685 (10, 3.7) | 678 (9, 3.6) | -7.1 (-1.0 %) within budget |
| open-folder.warm.click-to-dialog-ms | 33.9 (10, 4.9) | 28.2 (9, 4.3) | -5.7 (-16.8 %) within budget |
| open-folder.warm.dialog-ms | 0.5 (10, 0.0) | 0.7 (9, 0.0) | +0.2 (+55.5 %) within budget |
| open-folder.warm.dialog-to-start-ms | 0.1 (10, 0.0) | 0.1 (9, 0.0) | +0.0 (+0.2 %) within budget |
| open-folder.warm.directory-tree-ms | 17.8 (10, 0.3) | 9.0 (9, 1.8) | -8.8 (-49.3 %) improvement |
| open-folder.warm.exif-files | 314 (10, 0.0) | 314 (9, 0.0) | +0.0 (+0.0 %) same |
| open-folder.warm.exif-max-file-ms | 34.7 (10, 5.7) | 30.9 (9, 2.2) | -3.7 (-10.8 %) |
| open-folder.warm.exif-parse-sum-ms | 62.6 (10, 2.7) | 63.2 (9, 2.0) | +0.6 (+1.0 %) |
| open-folder.warm.exif-read-sum-ms | 203 (10, 6.0) | 208 (9, 10.3) | +5.0 (+2.5 %) |
| open-folder.warm.exif-rotate-sum-ms | 4888 (10, 57.3) | 4956 (9, 40.8) | +68.2 (+1.4 %) |
| open-folder.warm.exif-thumbnail-sum-ms | 49.0 (10, 3.0) | 48.2 (9, 1.8) | -0.8 (-1.6 %) |
| open-folder.warm.finish-ms | 110 (10, 0.3) | 113 (9, 1.2) | +2.3 (+2.1 %) within budget |
| open-folder.warm.main-event-loop-max-ms | 12.4 (10, 0.1) | 12.4 (9, 0.1) | -0.0 (-0.4 %) within budget |
| open-folder.warm.main-event-loop-p99-ms | 12.3 (10, 0.1) | 12.3 (9, 0.1) | -0.0 (-0.2 %) within budget |
| open-folder.warm.peak-tree-delta-kb | 126304 (10, 31144) | 129088 (9, 20976) | +2784 (+2.2 %) within budget |
| open-folder.warm.peak-tree-rss-kb | 784352 (10, 40792) | 768560 (9, 54128) | -15792 (-2.0 %) within budget |
| open-folder.warm.photo-data-ms | 519 (10, 2.5) | 526 (9, 2.1) | +7.3 (+1.4 %) within budget |
| open-folder.warm.renderer-longtask-max-ms | 0.0 (10, 0.0) | 0.0 (9, 0.0) | +0.0 () within budget |
| open-folder.warm.renderer-longtask-total-ms | 0.0 (10, 0.0) | 0.0 (9, 0.0) | +0.0 () within budget |
| open-folder.warm.renderer-longtasks | 0.0 (10, 0.0) | 0.0 (9, 0.0) | +0.0 () within budget |
| open-folder.warm.renderer-max-frame-gap-ms | 76.0 (10, 4.0) | 19.0 (9, 0.4) | -57.0 (-75.0 %) improvement |
| open-folder.warm.settled-main-ws-kb | 241136 (10, 23384) | 246256 (9, 26112) | +5120 (+2.1 %) within budget |
| open-folder.warm.settled-renderer-ws-kb | 339288 (10, 19336) | 317376 (9, 18592) | -21912 (-6.5 %) within budget |
| open-folder.warm.settled-tree-rss-kb | 781104 (10, 40424) | 764032 (9, 55936) | -17072 (-2.2 %) within budget |
| open-folder.warm.start-to-complete-ms | 648 (10, 3.9) | 649 (9, 1.4) | +1.0 (+0.2 %) within budget |
| settings.restart.click-to-exit-ms | 122 (10, 5.0) | 124 (10, 6.0) | +2.0 (+1.6 %) within budget |
| settings.restart.click-to-home-rendered-ms | 477 (10, 3.8) | 439 (10, 8.6) | -37.6 (-7.9 %) within budget |
| settings.restart.click-to-process-started-ms | 149 (10, 4.6) | 152 (10, 6.0) | +3.3 (+2.2 %) within budget |
| settings.restart.process-to-home-rendered-ms | 328 (10, 4.6) | 287 (10, 2.6) | -40.4 (-12.3 %) improvement |
| settings.save.click-to-closed-ms | 107 (10, 2.9) | 109 (10, 0.6) | +2.7 (+2.5 %) within budget |
| settings.save.click-to-persisted-ms | 107 (10, 3.0) | 110 (10, 0.5) | +2.5 (+2.3 %) within budget |
| startup.cold.bootstrap-done-ms | 386 (10, 5.6) | 376 (10, 5.7) | -9.9 (-2.6 %) within budget |
| startup.cold.bootstrap-start-ms | 370 (10, 6.6) | 353 (10, 5.7) | -17.3 (-4.7 %) within budget |
| startup.cold.close-ms | 41.0 (10, 3.5) | 39.0 (10, 1.0) | -2.0 (-4.9 %) within budget |
| startup.cold.create-window-ms | 167 (10, 3.7) | 168 (10, 2.5) | +1.4 (+0.9 %) within budget |
| startup.cold.did-finish-load-ms | 371 (10, 6.5) | 242 (10, 3.2) | -128 (-34.6 %) improvement |
| startup.cold.home-rendered-ms | 398 (10, 5.3) | 387 (10, 6.4) | -10.4 (-2.6 %) within budget |
| startup.cold.navigation-start-ms | 253 (10, 5.0) | 215 (10, 3.8) | -37.5 (-14.8 %) improvement |
| startup.cold.process-started-ms | 30.2 (10, 0.6) | 30.9 (10, 0.7) | +0.7 (+2.5 %) within budget |
| startup.cold.ready-to-show-ms | 397 (10, 8.1) | 247 (10, 3.8) | -150 (-37.8 %) improvement |
| startup.cold.renderer-bootstrap-ms | 16.7 (10, 1.3) | 23.1 (10, 0.9) | +6.4 (+38.6 %) REGRESSION |
| startup.cold.renderer-modules-ms | 116 (10, 1.7) | 139 (10, 2.9) | +23.1 (+19.9 %) REGRESSION |
| startup.cold.settled-main-ws-kb | 200664 (10, 136) | 210680 (10, 112) | +10016 (+5.0 %) within budget |
| startup.cold.settled-renderer-ws-kb | 317888 (10, 1024) | 293568 (10, 240) | -24320 (-7.7 %) within budget |
| startup.cold.settled-tree-rss-kb | 732712 (10, 2072) | 715768 (10, 504) | -16944 (-2.3 %) within budget |
| startup.cold.window-created-ms | 206 (10, 3.6) | 208 (10, 3.4) | +2.2 (+1.1 %) within budget |
| startup.warm.bootstrap-done-ms | 349 (10, 3.8) | 341 (10, 4.2) | -7.8 (-2.2 %) within budget |
| startup.warm.bootstrap-start-ms | 337 (10, 2.8) | 322 (10, 3.0) | -15.1 (-4.5 %) within budget |
| startup.warm.close-ms | 40.0 (10, 3.0) | 43.0 (10, 2.0) | +3.0 (+7.5 %) within budget |
| startup.warm.create-window-ms | 165 (10, 2.1) | 166 (10, 0.9) | +0.9 (+0.5 %) within budget |
| startup.warm.did-finish-load-ms | 338 (10, 2.8) | 243 (10, 2.1) | -95.2 (-28.2 %) improvement |
| startup.warm.home-rendered-ms | 362 (10, 3.3) | 354 (10, 3.9) | -8.4 (-2.3 %) within budget |
| startup.warm.navigation-start-ms | 251 (10, 1.7) | 214 (10, 2.5) | -36.8 (-14.7 %) improvement |
| startup.warm.process-started-ms | 30.5 (10, 0.2) | 29.9 (10, 0.9) | -0.7 (-2.2 %) within budget |
| startup.warm.ready-to-show-ms | 363 (10, 6.5) | 247 (10, 1.7) | -116 (-32.0 %) improvement |
| startup.warm.renderer-bootstrap-ms | 11.0 (10, 0.6) | 17.9 (10, 0.5) | +6.9 (+63.0 %) REGRESSION |
| startup.warm.renderer-modules-ms | 86.2 (10, 1.1) | 106 (10, 0.9) | +20.2 (+23.4 %) REGRESSION |
| startup.warm.settled-main-ws-kb | 204880 (10, 200) | 214944 (10, 48.0) | +10064 (+4.9 %) within budget |
| startup.warm.settled-renderer-ws-kb | 253920 (10, 2368) | 230216 (10, 992) | -23704 (-9.3 %) within budget |
| startup.warm.settled-tree-rss-kb | 620152 (10, 1784) | 604272 (10, 9088) | -15880 (-2.6 %) within budget |
| startup.warm.window-created-ms | 206 (10, 1.8) | 207 (10, 1.1) | +0.6 (+0.3 %) within budget |
| view-data.cycles.retained-tree-kb | -53576 (10, 2528) | -55176 (10, 1200) | -1600 (+3.0 %) within budget |
| view-data.heic.after-close-tree-delta-kb | -58184 (10, 1576) | -50520 (10, 3416) | +7664 (-13.2 %) within budget |
| view-data.heic.launch-to-window-created-ms | 9.3 (10, 0.2) | 9.2 (10, 0.2) | -0.1 (-1.2 %) within budget |
| view-data.heic.menu-to-request-ms | 37.2 (10, 1.9) | 36.1 (10, 1.5) | -1.1 (-3.1 %) within budget |
| view-data.heic.open-tree-delta-kb | 488840 (10, 1208) | 488608 (10, 3688) | -232 (-0.0 %) within budget |
| view-data.heic.peak-tree-delta-kb | 490272 (10, 1064) | 490608 (10, 3784) | +336 (+0.1 %) within budget |
| view-data.heic.request-to-image-ms | 564 (10, 8.8) | 563 (10, 7.3) | -0.9 (-0.2 %) within budget |
| view-data.heic.request-to-launch-ms | 0.2 (10, 0.1) | 0.2 (10, 0.1) | +0.0 (+7.9 %) within budget |
| view-data.heic.request-to-metadata-ms | 566 (10, 8.5) | 565 (10, 7.3) | -0.9 (-0.2 %) within budget |
| view-data.heic.request-to-page-loaded-ms | 86.5 (10, 0.8) | 87.5 (10, 2.0) | +1.0 (+1.2 %) within budget |
| view-data.heic.window-created-to-page-loaded-ms | 77.2 (10, 1.2) | 77.8 (10, 2.0) | +0.7 (+0.9 %) within budget |
| view-data.jpeg-first.after-close-tree-delta-kb | -115144 (10, 1624) | -112248 (10, 2248) | +2896 (-2.5 %) within budget |
| view-data.jpeg-first.launch-to-window-created-ms | 18.7 (10, 0.3) | 18.7 (10, 1.5) | +0.0 (+0.0 %) within budget |
| view-data.jpeg-first.menu-to-request-ms | 31.6 (10, 4.5) | 31.5 (10, 1.9) | -0.1 (-0.3 %) within budget |
| view-data.jpeg-first.open-tree-delta-kb | 235752 (10, 6080) | 235944 (10, 3712) | +192 (+0.1 %) within budget |
| view-data.jpeg-first.peak-tree-delta-kb | 251216 (10, 5120) | 250440 (10, 3136) | -776 (-0.3 %) within budget |
| view-data.jpeg-first.request-to-image-ms | 657 (10, 7.0) | 664 (10, 1.5) | +6.6 (+1.0 %) within budget |
| view-data.jpeg-first.request-to-launch-ms | 0.2 (10, 0.0) | 0.3 (10, 0.0) | +0.0 (+20.1 %) within budget |
| view-data.jpeg-first.request-to-metadata-ms | 660 (10, 5.7) | 666 (10, 1.3) | +6.1 (+0.9 %) within budget |
| view-data.jpeg-first.request-to-page-loaded-ms | 119 (10, 2.7) | 123 (10, 0.8) | +4.2 (+3.5 %) within budget |
| view-data.jpeg-first.window-created-to-page-loaded-ms | 100 (10, 2.4) | 103 (10, 1.0) | +3.2 (+3.2 %) within budget |
| view-data.jpeg.after-close-tree-delta-kb | -44608 (10, 2072) | -46248 (10, 1432) | -1640 (+3.7 %) within budget |
| view-data.jpeg.launch-to-window-created-ms | 9.3 (10, 0.3) | 9.2 (10, 0.2) | -0.1 (-1.1 %) within budget |
| view-data.jpeg.menu-to-request-ms | 24.8 (10, 0.8) | 25.1 (10, 0.7) | +0.2 (+0.8 %) within budget |
| view-data.jpeg.open-tree-delta-kb | 291616 (10, 936) | 292960 (10, 1640) | +1344 (+0.5 %) within budget |
| view-data.jpeg.peak-tree-delta-kb | 290568 (10, 776) | 291992 (10, 1712) | +1424 (+0.5 %) within budget |
| view-data.jpeg.request-to-image-ms | 631 (10, 1.4) | 631 (10, 0.9) | -0.1 (-0.0 %) within budget |
| view-data.jpeg.request-to-launch-ms | 0.2 (10, 0.1) | 0.2 (10, 0.1) | -0.0 (-6.6 %) within budget |
| view-data.jpeg.request-to-metadata-ms | 633 (10, 2.0) | 632 (10, 0.9) | -0.8 (-0.1 %) within budget |
| view-data.jpeg.request-to-page-loaded-ms | 95.8 (10, 1.2) | 96.1 (10, 1.3) | +0.3 (+0.3 %) within budget |
| view-data.jpeg.window-created-to-page-loaded-ms | 86.4 (10, 0.9) | 86.6 (10, 1.4) | +0.2 (+0.3 %) within budget |
