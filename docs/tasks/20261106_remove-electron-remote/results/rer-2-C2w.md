# Series rer-2-C2w (protocol rer-2)

Builds: 0 (code d4dd643ba631), C1 (code bb9674dcb865), C2 (code a96a9d876f99). Baseline: 0.
Host: Intel(R) Core(TM) i7-8700 CPU @ 3.20GHz, 12 cores, 32 GB, win32 10.0.26300.
Viewer: ce59cc67a3ac (unchanged).
Complete: yes. Trials: {"0":{"open-folder":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"settings":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"startup":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"view-data":{"ok":10,"failed":0,"interrupted":0,"warmup":1}},"C1":{"open-folder":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"settings":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"startup":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"view-data":{"ok":9,"failed":1,"interrupted":0,"warmup":1}},"C2":{"open-folder":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"settings":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"startup":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"view-data":{"ok":9,"failed":1,"interrupted":0,"warmup":1}}}

| Metric | 0 median (n, MAD) | C1 median (n, MAD) | C2 median (n, MAD) | C1 vs 0 | C2 vs 0 |
| --- | ---: | ---: | ---: | --- | --- |
| open-folder.cold.click-to-complete-ms | 2119 (10, 20.8) | 1127 (10, 8.3) | 1125 (10, 5.1) | -992 (-46.8 %) improvement | -994 (-46.9 %) improvement |
| open-folder.cold.click-to-dialog-ms | 24.6 (10, 1.5) | 25.4 (10, 1.5) | 24.5 (10, 1.0) | +0.8 (+3.3 %) within budget | -0.1 (-0.2 %) within budget |
| open-folder.cold.dialog-ms | 4.5 (10, 0.2) | 1.6 (10, 0.2) | 1.6 (10, 0.2) | -2.9 (-64.8 %) within budget | -2.9 (-64.8 %) within budget |
| open-folder.cold.dialog-to-start-ms | 2.7 (10, 0.1) | 0.3 (10, 0.1) | 0.4 (10, 0.1) | -2.3 (-87.0 %) within budget | -2.3 (-85.2 %) within budget |
| open-folder.cold.directory-tree-ms | 46.5 (10, 0.8) | 51.8 (10, 0.5) | 51.6 (10, 0.8) | +5.3 (+11.3 %) REGRESSION | +5.0 (+10.7 %) REGRESSION |
| open-folder.cold.exif-files | 314 (10, 0.0) | 314 (10, 0.0) | 314 (10, 0.0) | +0.0 (+0.0 %) same | +0.0 (+0.0 %) same |
| open-folder.cold.exif-max-file-ms | 181 (10, 16.1) | 120 (10, 17.1) | 112 (10, 4.7) | -61.1 (-33.7 %) | -68.7 (-37.9 %) |
| open-folder.cold.exif-parse-sum-ms | 704 (10, 7.9) | 223 (10, 1.8) | 226 (10, 2.4) | -481 (-68.3 %) | -477 (-67.8 %) |
| open-folder.cold.exif-read-sum-ms | 0.0 (10, 0.0) | 664 (10, 3.5) | 673 (10, 5.9) | +664 () | +673 () |
| open-folder.cold.exif-rotate-sum-ms | 16791 (10, 210) | 8217 (10, 79.5) | 8240 (10, 48.9) | -8574 (-51.1 %) | -8552 (-50.9 %) |
| open-folder.cold.exif-thumbnail-sum-ms | 674 (10, 2.5) | 152 (10, 1.6) | 154 (10, 1.8) | -522 (-77.4 %) | -520 (-77.1 %) |
| open-folder.cold.finish-ms | 129 (10, 1.8) | 129 (10, 1.8) | 128 (10, 0.8) | +0.1 (+0.1 %) within budget | -1.2 (-0.9 %) within budget |
| open-folder.cold.main-event-loop-max-ms | 72.8 (10, 2.8) | 71.9 (10, 3.3) | 72.0 (10, 2.7) | -0.9 (-1.3 %) within budget | -0.9 (-1.2 %) within budget |
| open-folder.cold.main-event-loop-p99-ms | 21.5 (10, 0.8) | 21.7 (10, 1.4) | 21.8 (10, 0.5) | +0.2 (+1.1 %) within budget | +0.3 (+1.5 %) within budget |
| open-folder.cold.photo-data-ms | 1910 (10, 22.5) | 913 (10, 7.8) | 916 (10, 7.6) | -997 (-52.2 %) improvement | -994 (-52.0 %) improvement |
| open-folder.cold.renderer-longtask-max-ms | 97.0 (10, 3.5) | 105 (10, 3.5) | 100 (10, 3.0) | +7.5 (+7.7 %) within budget | +3.0 (+3.1 %) within budget |
| open-folder.cold.renderer-longtask-total-ms | 97.0 (10, 3.5) | 105 (10, 3.5) | 100 (10, 3.0) | +7.5 (+7.7 %) within budget | +3.0 (+3.1 %) within budget |
| open-folder.cold.renderer-longtasks | 1.0 (10, 0.0) | 1.0 (10, 0.0) | 1.0 (10, 0.0) | +0.0 (+0.0 %) within budget | +0.0 (+0.0 %) within budget |
| open-folder.cold.renderer-max-frame-gap-ms | 125 (10, 3.5) | 132 (10, 6.8) | 125 (10, 6.9) | +6.9 (+5.6 %) within budget | +0.0 (+0.0 %) within budget |
| open-folder.cold.settled-main-ws-kb | 177546 (10, 966) | 174948 (10, 968) | 176134 (10, 1520) | -2598 (-1.5 %) within budget | -1412 (-0.8 %) within budget |
| open-folder.cold.settled-renderer-ws-kb | 220510 (10, 1956) | 198966 (10, 3582) | 197342 (10, 4828) | -21544 (-9.8 %) within budget | -23168 (-10.5 %) improvement |
| open-folder.cold.start-to-complete-ms | 2088 (10, 21.5) | 1101 (10, 8.1) | 1099 (10, 6.4) | -987 (-47.3 %) improvement | -989 (-47.4 %) improvement |
| open-folder.cold.start-to-markers-ms | 3117 (10, 22.6) | 2127 (10, 11.1) | 2123 (10, 11.2) | -990 (-31.8 %) improvement | -994 (-31.9 %) improvement |
| open-folder.cold.start-to-thumbnails-done-ms | 12079 (10, 20.7) | 11090 (10, 9.7) | 11088 (10, 7.0) | -989 (-8.2 %) within budget | -991 (-8.2 %) within budget |
| open-folder.cold.thumbnails-main-ms | 5566 (10, 56.9) | 5561 (10, 15.7) | 5589 (10, 45.3) | -4.9 (-0.1 %) within budget | +23.7 (+0.4 %) within budget |
| open-folder.warm.click-to-complete-ms | 2155 (10, 17.5) | 1127 (10, 32.2) | 1123 (10, 36.1) | -1028 (-47.7 %) improvement | -1032 (-47.9 %) improvement |
| open-folder.warm.click-to-dialog-ms | 24.8 (10, 1.7) | 26.4 (10, 2.0) | 26.9 (10, 1.7) | +1.6 (+6.4 %) within budget | +2.1 (+8.5 %) within budget |
| open-folder.warm.dialog-ms | 4.4 (10, 0.1) | 2.4 (10, 0.3) | 2.2 (10, 0.6) | -2.0 (-46.6 %) within budget | -2.2 (-50.0 %) within budget |
| open-folder.warm.dialog-to-start-ms | 1.7 (10, 0.0) | 0.2 (10, 0.0) | 0.2 (10, 0.1) | -1.5 (-88.2 %) within budget | -1.5 (-88.2 %) within budget |
| open-folder.warm.directory-tree-ms | 44.8 (10, 0.9) | 51.0 (10, 1.5) | 51.1 (10, 1.0) | +6.3 (+14.1 %) REGRESSION | +6.4 (+14.3 %) REGRESSION |
| open-folder.warm.exif-files | 314 (10, 0.0) | 314 (10, 0.0) | 314 (10, 0.0) | +0.0 (+0.0 %) same | +0.0 (+0.0 %) same |
| open-folder.warm.exif-max-file-ms | 197 (10, 28.7) | 148 (10, 24.0) | 112 (10, 25.7) | -49.1 (-25.0 %) | -84.9 (-43.1 %) |
| open-folder.warm.exif-parse-sum-ms | 665 (10, 4.5) | 188 (10, 3.3) | 188 (10, 0.7) | -477 (-71.7 %) | -477 (-71.7 %) |
| open-folder.warm.exif-read-sum-ms | 0.0 (10, 0.0) | 647 (10, 6.9) | 651 (10, 6.5) | +647 () | +651 () |
| open-folder.warm.exif-rotate-sum-ms | 17327 (10, 172) | 8415 (10, 341) | 8336 (10, 370) | -8912 (-51.4 %) | -8991 (-51.9 %) |
| open-folder.warm.exif-thumbnail-sum-ms | 663 (10, 6.1) | 142 (10, 2.6) | 142 (10, 1.0) | -520 (-78.5 %) | -521 (-78.6 %) |
| open-folder.warm.finish-ms | 125 (10, 1.0) | 122 (10, 0.7) | 122 (10, 2.3) | -3.8 (-3.0 %) within budget | -3.4 (-2.7 %) within budget |
| open-folder.warm.main-event-loop-max-ms | 23.1 (10, 0.9) | 22.2 (10, 1.9) | 22.4 (10, 1.4) | -0.9 (-4.1 %) within budget | -0.7 (-3.1 %) within budget |
| open-folder.warm.main-event-loop-p99-ms | 20.5 (10, 1.0) | 21.4 (10, 2.0) | 20.3 (10, 1.0) | +0.9 (+4.2 %) within budget | -0.2 (-0.8 %) within budget |
| open-folder.warm.photo-data-ms | 1953 (10, 16.8) | 929 (10, 33.6) | 922 (10, 36.8) | -1024 (-52.4 %) improvement | -1031 (-52.8 %) improvement |
| open-folder.warm.renderer-longtask-max-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget | +0.0 () within budget |
| open-folder.warm.renderer-longtask-total-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget | +0.0 () within budget |
| open-folder.warm.renderer-longtasks | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget | +0.0 () within budget |
| open-folder.warm.renderer-max-frame-gap-ms | 74.9 (10, 2.4) | 42.2 (10, 3.3) | 40.2 (10, 0.9) | -32.7 (-43.7 %) improvement | -34.8 (-46.4 %) improvement |
| open-folder.warm.settled-main-ws-kb | 180126 (10, 976) | 181022 (10, 1426) | 179244 (10, 1542) | +896 (+0.5 %) within budget | -882 (-0.5 %) within budget |
| open-folder.warm.settled-renderer-ws-kb | 243818 (10, 1614) | 217196 (10, 10420) | 216234 (10, 7338) | -26622 (-10.9 %) improvement | -27584 (-11.3 %) improvement |
| open-folder.warm.start-to-complete-ms | 2127 (10, 17.3) | 1101 (10, 32.6) | 1094 (10, 35.8) | -1026 (-48.2 %) improvement | -1033 (-48.6 %) improvement |
| settings.restart.click-to-exit-ms | 151 (10, 1.5) | 151 (10, 2.5) | 151 (10, 2.0) | +0.0 (+0.0 %) within budget | +0.5 (+0.3 %) within budget |
| settings.restart.click-to-home-rendered-ms | 952 (10, 8.7) | 870 (10, 12.1) | 876 (10, 4.8) | -82.0 (-8.6 %) within budget | -76.4 (-8.0 %) within budget |
| settings.restart.click-to-process-started-ms | 178 (10, 2.0) | 178 (10, 2.6) | 178 (10, 1.6) | +0.1 (+0.0 %) within budget | +0.4 (+0.2 %) within budget |
| settings.restart.process-to-home-rendered-ms | 774 (10, 7.4) | 693 (10, 8.1) | 697 (10, 7.2) | -81.0 (-10.5 %) improvement | -77.6 (-10.0 %) improvement |
| settings.save.click-to-closed-ms | 120 (10, 1.8) | 114 (10, 0.8) | 116 (10, 1.1) | -5.4 (-4.5 %) within budget | -3.5 (-2.9 %) within budget |
| settings.save.click-to-persisted-ms | 120 (10, 2.5) | 115 (10, 1.0) | 117 (10, 1.0) | -5.0 (-4.2 %) within budget | -3.5 (-2.9 %) within budget |
| startup.cold.bootstrap-done-ms | 893 (10, 13.6) | 827 (10, 4.2) | 838 (10, 11.8) | -65.7 (-7.4 %) within budget | -54.5 (-6.1 %) within budget |
| startup.cold.bootstrap-start-ms | 816 (10, 7.0) | 750 (10, 1.7) | 767 (10, 8.4) | -66.5 (-8.1 %) within budget | -49.4 (-6.1 %) within budget |
| startup.cold.close-ms | 92.0 (10, 0.0) | 93.5 (10, 1.5) | 92.0 (10, 1.0) | +1.5 (+1.6 %) within budget | +0.0 (+0.0 %) within budget |
| startup.cold.create-window-ms | 413 (10, 2.7) | 422 (10, 1.1) | 428 (10, 2.5) | +9.2 (+2.2 %) within budget | +14.8 (+3.6 %) within budget |
| startup.cold.did-finish-load-ms | 818 (10, 7.1) | 578 (10, 6.3) | 590 (10, 4.8) | -239 (-29.3 %) improvement | -228 (-27.9 %) improvement |
| startup.cold.home-rendered-ms | 952 (10, 10.1) | 878 (10, 5.3) | 890 (10, 9.4) | -73.8 (-7.8 %) within budget | -62.6 (-6.6 %) within budget |
| startup.cold.navigation-start-ms | 511 (10, 5.3) | 489 (10, 1.3) | 495 (10, 2.6) | -22.2 (-4.3 %) within budget | -15.4 (-3.0 %) within budget |
| startup.cold.process-started-ms | 39.0 (10, 0.4) | 38.8 (10, 0.4) | 39.1 (10, 0.4) | -0.2 (-0.5 %) within budget | +0.1 (+0.2 %) within budget |
| startup.cold.ready-to-show-ms | 819 (10, 6.8) | 584 (10, 5.6) | 595 (10, 4.9) | -235 (-28.7 %) improvement | -224 (-27.4 %) improvement |
| startup.cold.renderer-bootstrap-ms | 76.6 (10, 19.9) | 75.5 (10, 3.0) | 73.1 (10, 2.1) | -1.1 (-1.5 %) within budget | -3.5 (-4.6 %) within budget |
| startup.cold.renderer-modules-ms | 299 (10, 3.8) | 261 (10, 2.3) | 269 (10, 9.3) | -37.8 (-12.6 %) improvement | -30.3 (-10.1 %) improvement |
| startup.cold.settled-main-ws-kb | 133654 (10, 620) | 145014 (10, 1106) | 144492 (10, 834) | +11360 (+8.5 %) within budget | +10838 (+8.1 %) within budget |
| startup.cold.settled-renderer-ws-kb | 193214 (10, 1608) | 169020 (10, 528) | 169116 (10, 704) | -24194 (-12.5 %) improvement | -24098 (-12.5 %) improvement |
| startup.cold.window-created-ms | 440 (10, 3.5) | 451 (10, 2.1) | 455 (10, 2.8) | +10.8 (+2.5 %) within budget | +15.0 (+3.4 %) within budget |
| startup.warm.bootstrap-done-ms | 804 (10, 15.0) | 777 (10, 5.5) | 775 (10, 4.8) | -26.6 (-3.3 %) within budget | -28.8 (-3.6 %) within budget |
| startup.warm.bootstrap-start-ms | 756 (10, 9.4) | 707 (10, 4.7) | 709 (10, 7.2) | -49.8 (-6.6 %) within budget | -47.7 (-6.3 %) within budget |
| startup.warm.close-ms | 80.0 (10, 1.0) | 80.0 (10, 1.0) | 80.5 (10, 1.0) | +0.0 (+0.0 %) within budget | +0.5 (+0.6 %) within budget |
| startup.warm.create-window-ms | 404 (10, 2.6) | 416 (10, 1.3) | 416 (10, 2.0) | +12.2 (+3.0 %) within budget | +12.7 (+3.1 %) within budget |
| startup.warm.did-finish-load-ms | 759 (10, 9.4) | 558 (10, 4.0) | 562 (10, 6.1) | -201 (-26.4 %) improvement | -197 (-25.9 %) improvement |
| startup.warm.home-rendered-ms | 859 (10, 16.7) | 829 (10, 7.4) | 827 (10, 5.0) | -29.8 (-3.5 %) within budget | -31.6 (-3.7 %) within budget |
| startup.warm.navigation-start-ms | 491 (10, 4.4) | 476 (10, 2.2) | 476 (10, 3.0) | -14.7 (-3.0 %) within budget | -14.6 (-3.0 %) within budget |
| startup.warm.process-started-ms | 38.1 (10, 0.3) | 38.0 (10, 0.7) | 38.0 (10, 0.5) | -0.1 (-0.3 %) within budget | -0.1 (-0.4 %) within budget |
| startup.warm.ready-to-show-ms | 764 (10, 8.0) | 566 (10, 3.6) | 564 (10, 6.0) | -198 (-26.0 %) improvement | -200 (-26.1 %) improvement |
| startup.warm.renderer-bootstrap-ms | 35.3 (10, 2.3) | 67.4 (10, 6.9) | 63.3 (10, 2.4) | +32.1 (+90.9 %) REGRESSION | +27.9 (+79.2 %) REGRESSION |
| startup.warm.renderer-modules-ms | 264 (10, 7.6) | 232 (10, 6.2) | 230 (10, 5.9) | -32.2 (-12.2 %) within budget | -33.8 (-12.8 %) within budget |
| startup.warm.settled-main-ws-kb | 133218 (10, 182) | 143652 (10, 298) | 144202 (10, 836) | +10434 (+7.8 %) within budget | +10984 (+8.2 %) within budget |
| startup.warm.settled-renderer-ws-kb | 176690 (10, 930) | 153240 (10, 1028) | 152990 (10, 152) | -23450 (-13.3 %) improvement | -23700 (-13.4 %) improvement |
| startup.warm.window-created-ms | 428 (10, 3.2) | 441 (10, 1.9) | 441 (10, 1.9) | +13.3 (+3.1 %) within budget | +13.3 (+3.1 %) within budget |
| view-data.heic.launch-to-window-created-ms | 11.8 (10, 0.1) | 12.1 (9, 0.2) | 12.1 (9, 0.5) | +0.3 (+2.5 %) within budget | +0.3 (+2.6 %) within budget |
| view-data.heic.menu-to-request-ms | 22.8 (10, 0.3) | 22.6 (9, 0.5) | 23.6 (9, 1.0) | -0.2 (-0.9 %) within budget | +0.8 (+3.5 %) within budget |
| view-data.heic.request-to-image-ms | 1276 (10, 10.6) | 1268 (9, 8.0) | 1283 (9, 10.3) | -8.3 (-0.7 %) within budget | +7.4 (+0.6 %) within budget |
| view-data.heic.request-to-launch-ms | -0.1 (10, 0.3) | 0.2 (9, 0.1) | 0.1 (9, 0.1) | +0.3 (-346.7 %) within budget | +0.2 (-199.5 %) within budget |
| view-data.heic.request-to-metadata-ms | 1279 (10, 10.6) | 1270 (9, 8.1) | 1288 (9, 11.4) | -9.3 (-0.7 %) within budget | +9.4 (+0.7 %) within budget |
| view-data.heic.request-to-page-loaded-ms | 160 (10, 2.1) | 157 (9, 1.5) | 130 (9, 4.9) | -2.3 (-1.4 %) within budget | -29.7 (-18.6 %) improvement |
| view-data.heic.window-created-to-page-loaded-ms | 148 (10, 2.3) | 146 (9, 1.1) | 117 (9, 3.6) | -1.8 (-1.2 %) within budget | -30.5 (-20.6 %) improvement |
| view-data.jpeg-first.launch-to-window-created-ms | 20.7 (10, 0.2) | 20.9 (9, 0.4) | 20.5 (9, 0.4) | +0.2 (+0.7 %) within budget | -0.2 (-1.0 %) within budget |
| view-data.jpeg-first.menu-to-request-ms | 22.8 (10, 1.0) | 22.8 (9, 1.1) | 22.5 (9, 1.3) | -0.0 (-0.0 %) within budget | -0.3 (-1.3 %) within budget |
| view-data.jpeg-first.request-to-image-ms | 758 (10, 5.2) | 760 (9, 1.7) | 828 (9, 11.6) | +1.7 (+0.2 %) within budget | +70.5 (+9.3 %) within budget |
| view-data.jpeg-first.request-to-launch-ms | 0.1 (10, 0.2) | 0.3 (9, 0.2) | 0.3 (9, 0.1) | +0.2 (+209.2 %) within budget | +0.2 (+178.2 %) within budget |
| view-data.jpeg-first.request-to-metadata-ms | 781 (10, 4.5) | 783 (9, 1.7) | 846 (9, 6.7) | +1.9 (+0.2 %) within budget | +64.6 (+8.3 %) within budget |
| view-data.jpeg-first.request-to-page-loaded-ms | 204 (10, 2.3) | 205 (9, 1.2) | 186 (9, 2.1) | +1.2 (+0.6 %) within budget | -18.0 (-8.8 %) within budget |
| view-data.jpeg-first.window-created-to-page-loaded-ms | 183 (10, 1.9) | 184 (9, 1.4) | 165 (9, 2.4) | +0.8 (+0.4 %) within budget | -18.3 (-10.0 %) within budget |
| view-data.jpeg.launch-to-window-created-ms | 11.9 (10, 0.4) | 11.6 (9, 0.1) | 11.6 (9, 0.3) | -0.3 (-2.2 %) within budget | -0.2 (-1.9 %) within budget |
| view-data.jpeg.menu-to-request-ms | 22.0 (10, 0.8) | 22.6 (9, 0.4) | 22.2 (9, 0.5) | +0.6 (+2.7 %) within budget | +0.2 (+0.9 %) within budget |
| view-data.jpeg.request-to-image-ms | 744 (10, 4.8) | 745 (9, 2.4) | 801 (9, 4.9) | +1.0 (+0.1 %) within budget | +57.0 (+7.7 %) within budget |
| view-data.jpeg.request-to-launch-ms | -0.1 (10, 0.3) | 0.1 (9, 0.3) | 0.1 (9, 0.1) | +0.2 (-250.6 %) within budget | +0.2 (-181.9 %) within budget |
| view-data.jpeg.request-to-metadata-ms | 765 (10, 3.5) | 767 (9, 3.0) | 825 (9, 3.0) | +1.6 (+0.2 %) within budget | +59.2 (+7.7 %) within budget |
| view-data.jpeg.request-to-page-loaded-ms | 185 (10, 3.4) | 182 (9, 3.0) | 165 (9, 6.3) | -3.4 (-1.8 %) within budget | -20.4 (-11.0 %) improvement |
| view-data.jpeg.window-created-to-page-loaded-ms | 174 (10, 3.3) | 171 (9, 3.2) | 153 (9, 5.5) | -3.1 (-1.8 %) within budget | -20.3 (-11.7 %) improvement |

Measured on the owner's Windows PC (RESULTS.md, "Stages C1 and C2 on Windows"). 0 is fb581a26, C1 2fc31672 and C2 080a8217, the heads of their branches; C2 gives the viewer its photo by its default transport, the URL. The viewer is 6fe8814 for every build. Three View Data trials failed, all in its three extra HEIC cycles: C2's in the warm-up round, and C1's and C2's in round 2.

## C2 against C1

The same trials, with C1 as the baseline.

| Metric | C1 median (n, MAD) | C2 median (n, MAD) | C2 vs C1 |
| --- | ---: | ---: | --- |
| open-folder.cold.click-to-complete-ms | 1127 (10, 8.3) | 1125 (10, 5.1) | -2.0 (-0.2 %) within budget |
| open-folder.cold.click-to-dialog-ms | 25.4 (10, 1.5) | 24.5 (10, 1.0) | -0.9 (-3.3 %) within budget |
| open-folder.cold.dialog-ms | 1.6 (10, 0.2) | 1.6 (10, 0.2) | +0.0 (+0.0 %) within budget |
| open-folder.cold.dialog-to-start-ms | 0.3 (10, 0.1) | 0.4 (10, 0.1) | +0.0 (+14.3 %) within budget |
| open-folder.cold.directory-tree-ms | 51.8 (10, 0.5) | 51.6 (10, 0.8) | -0.2 (-0.5 %) within budget |
| open-folder.cold.exif-files | 314 (10, 0.0) | 314 (10, 0.0) | +0.0 (+0.0 %) same |
| open-folder.cold.exif-max-file-ms | 120 (10, 17.1) | 112 (10, 4.7) | -7.5 (-6.3 %) |
| open-folder.cold.exif-parse-sum-ms | 223 (10, 1.8) | 226 (10, 2.4) | +3.4 (+1.5 %) |
| open-folder.cold.exif-read-sum-ms | 664 (10, 3.5) | 673 (10, 5.9) | +8.9 (+1.3 %) |
| open-folder.cold.exif-rotate-sum-ms | 8217 (10, 79.5) | 8240 (10, 48.9) | +22.7 (+0.3 %) |
| open-folder.cold.exif-thumbnail-sum-ms | 152 (10, 1.6) | 154 (10, 1.8) | +2.3 (+1.5 %) |
| open-folder.cold.finish-ms | 129 (10, 1.8) | 128 (10, 0.8) | -1.3 (-1.0 %) within budget |
| open-folder.cold.main-event-loop-max-ms | 71.9 (10, 3.3) | 72.0 (10, 2.7) | +0.1 (+0.1 %) within budget |
| open-folder.cold.main-event-loop-p99-ms | 21.7 (10, 1.4) | 21.8 (10, 0.5) | +0.1 (+0.4 %) within budget |
| open-folder.cold.photo-data-ms | 913 (10, 7.8) | 916 (10, 7.6) | +2.8 (+0.3 %) within budget |
| open-folder.cold.renderer-longtask-max-ms | 105 (10, 3.5) | 100 (10, 3.0) | -4.5 (-4.3 %) within budget |
| open-folder.cold.renderer-longtask-total-ms | 105 (10, 3.5) | 100 (10, 3.0) | -4.5 (-4.3 %) within budget |
| open-folder.cold.renderer-longtasks | 1.0 (10, 0.0) | 1.0 (10, 0.0) | +0.0 (+0.0 %) within budget |
| open-folder.cold.renderer-max-frame-gap-ms | 132 (10, 6.8) | 125 (10, 6.9) | -6.9 (-5.2 %) within budget |
| open-folder.cold.settled-main-ws-kb | 174948 (10, 968) | 176134 (10, 1520) | +1186 (+0.7 %) within budget |
| open-folder.cold.settled-renderer-ws-kb | 198966 (10, 3582) | 197342 (10, 4828) | -1624 (-0.8 %) within budget |
| open-folder.cold.start-to-complete-ms | 1101 (10, 8.1) | 1099 (10, 6.4) | -1.9 (-0.2 %) within budget |
| open-folder.cold.start-to-markers-ms | 2127 (10, 11.1) | 2123 (10, 11.2) | -4.1 (-0.2 %) within budget |
| open-folder.cold.start-to-thumbnails-done-ms | 11090 (10, 9.7) | 11088 (10, 7.0) | -1.9 (-0.0 %) within budget |
| open-folder.cold.thumbnails-main-ms | 5561 (10, 15.7) | 5589 (10, 45.3) | +28.6 (+0.5 %) within budget |
| open-folder.warm.click-to-complete-ms | 1127 (10, 32.2) | 1123 (10, 36.1) | -4.3 (-0.4 %) within budget |
| open-folder.warm.click-to-dialog-ms | 26.4 (10, 2.0) | 26.9 (10, 1.7) | +0.5 (+1.9 %) within budget |
| open-folder.warm.dialog-ms | 2.4 (10, 0.3) | 2.2 (10, 0.6) | -0.2 (-6.4 %) within budget |
| open-folder.warm.dialog-to-start-ms | 0.2 (10, 0.0) | 0.2 (10, 0.1) | +0.0 (+0.0 %) within budget |
| open-folder.warm.directory-tree-ms | 51.0 (10, 1.5) | 51.1 (10, 1.0) | +0.1 (+0.2 %) within budget |
| open-folder.warm.exif-files | 314 (10, 0.0) | 314 (10, 0.0) | +0.0 (+0.0 %) same |
| open-folder.warm.exif-max-file-ms | 148 (10, 24.0) | 112 (10, 25.7) | -35.8 (-24.2 %) |
| open-folder.warm.exif-parse-sum-ms | 188 (10, 3.3) | 188 (10, 0.7) | -0.3 (-0.2 %) |
| open-folder.warm.exif-read-sum-ms | 647 (10, 6.9) | 651 (10, 6.5) | +4.1 (+0.6 %) |
| open-folder.warm.exif-rotate-sum-ms | 8415 (10, 341) | 8336 (10, 370) | -79.2 (-0.9 %) |
| open-folder.warm.exif-thumbnail-sum-ms | 142 (10, 2.6) | 142 (10, 1.0) | -0.3 (-0.2 %) |
| open-folder.warm.finish-ms | 122 (10, 0.7) | 122 (10, 2.3) | +0.4 (+0.3 %) within budget |
| open-folder.warm.main-event-loop-max-ms | 22.2 (10, 1.9) | 22.4 (10, 1.4) | +0.2 (+1.0 %) within budget |
| open-folder.warm.main-event-loop-p99-ms | 21.4 (10, 2.0) | 20.3 (10, 1.0) | -1.0 (-4.8 %) within budget |
| open-folder.warm.photo-data-ms | 929 (10, 33.6) | 922 (10, 36.8) | -7.4 (-0.8 %) within budget |
| open-folder.warm.renderer-longtask-max-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.warm.renderer-longtask-total-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.warm.renderer-longtasks | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.warm.renderer-max-frame-gap-ms | 42.2 (10, 3.3) | 40.2 (10, 0.9) | -2.0 (-4.9 %) within budget |
| open-folder.warm.settled-main-ws-kb | 181022 (10, 1426) | 179244 (10, 1542) | -1778 (-1.0 %) within budget |
| open-folder.warm.settled-renderer-ws-kb | 217196 (10, 10420) | 216234 (10, 7338) | -962 (-0.4 %) within budget |
| open-folder.warm.start-to-complete-ms | 1101 (10, 32.6) | 1094 (10, 35.8) | -7.2 (-0.7 %) within budget |
| settings.restart.click-to-exit-ms | 151 (10, 2.5) | 151 (10, 2.0) | +0.5 (+0.3 %) within budget |
| settings.restart.click-to-home-rendered-ms | 870 (10, 12.1) | 876 (10, 4.8) | +5.6 (+0.6 %) within budget |
| settings.restart.click-to-process-started-ms | 178 (10, 2.6) | 178 (10, 1.6) | +0.3 (+0.2 %) within budget |
| settings.restart.process-to-home-rendered-ms | 693 (10, 8.1) | 697 (10, 7.2) | +3.4 (+0.5 %) within budget |
| settings.save.click-to-closed-ms | 114 (10, 0.8) | 116 (10, 1.1) | +2.0 (+1.7 %) within budget |
| settings.save.click-to-persisted-ms | 115 (10, 1.0) | 117 (10, 1.0) | +1.5 (+1.3 %) within budget |
| startup.cold.bootstrap-done-ms | 827 (10, 4.2) | 838 (10, 11.8) | +11.2 (+1.3 %) within budget |
| startup.cold.bootstrap-start-ms | 750 (10, 1.7) | 767 (10, 8.4) | +17.0 (+2.3 %) within budget |
| startup.cold.close-ms | 93.5 (10, 1.5) | 92.0 (10, 1.0) | -1.5 (-1.6 %) within budget |
| startup.cold.create-window-ms | 422 (10, 1.1) | 428 (10, 2.5) | +5.6 (+1.3 %) within budget |
| startup.cold.did-finish-load-ms | 578 (10, 6.3) | 590 (10, 4.8) | +11.1 (+1.9 %) within budget |
| startup.cold.home-rendered-ms | 878 (10, 5.3) | 890 (10, 9.4) | +11.2 (+1.3 %) within budget |
| startup.cold.navigation-start-ms | 489 (10, 1.3) | 495 (10, 2.6) | +6.8 (+1.4 %) within budget |
| startup.cold.process-started-ms | 38.8 (10, 0.4) | 39.1 (10, 0.4) | +0.3 (+0.8 %) within budget |
| startup.cold.ready-to-show-ms | 584 (10, 5.6) | 595 (10, 4.9) | +11.2 (+1.9 %) within budget |
| startup.cold.renderer-bootstrap-ms | 75.5 (10, 3.0) | 73.1 (10, 2.1) | -2.4 (-3.1 %) within budget |
| startup.cold.renderer-modules-ms | 261 (10, 2.3) | 269 (10, 9.3) | +7.5 (+2.9 %) within budget |
| startup.cold.settled-main-ws-kb | 145014 (10, 1106) | 144492 (10, 834) | -522 (-0.4 %) within budget |
| startup.cold.settled-renderer-ws-kb | 169020 (10, 528) | 169116 (10, 704) | +96.0 (+0.1 %) within budget |
| startup.cold.window-created-ms | 451 (10, 2.1) | 455 (10, 2.8) | +4.2 (+0.9 %) within budget |
| startup.warm.bootstrap-done-ms | 777 (10, 5.5) | 775 (10, 4.8) | -2.3 (-0.3 %) within budget |
| startup.warm.bootstrap-start-ms | 707 (10, 4.7) | 709 (10, 7.2) | +2.1 (+0.3 %) within budget |
| startup.warm.close-ms | 80.0 (10, 1.0) | 80.5 (10, 1.0) | +0.5 (+0.6 %) within budget |
| startup.warm.create-window-ms | 416 (10, 1.3) | 416 (10, 2.0) | +0.5 (+0.1 %) within budget |
| startup.warm.did-finish-load-ms | 558 (10, 4.0) | 562 (10, 6.1) | +3.7 (+0.7 %) within budget |
| startup.warm.home-rendered-ms | 829 (10, 7.4) | 827 (10, 5.0) | -1.8 (-0.2 %) within budget |
| startup.warm.navigation-start-ms | 476 (10, 2.2) | 476 (10, 3.0) | +0.0 (+0.0 %) within budget |
| startup.warm.process-started-ms | 38.0 (10, 0.7) | 38.0 (10, 0.5) | -0.0 (-0.1 %) within budget |
| startup.warm.ready-to-show-ms | 566 (10, 3.6) | 564 (10, 6.0) | -1.3 (-0.2 %) within budget |
| startup.warm.renderer-bootstrap-ms | 67.4 (10, 6.9) | 63.3 (10, 2.4) | -4.2 (-6.2 %) within budget |
| startup.warm.renderer-modules-ms | 232 (10, 6.2) | 230 (10, 5.9) | -1.6 (-0.7 %) within budget |
| startup.warm.settled-main-ws-kb | 143652 (10, 298) | 144202 (10, 836) | +550 (+0.4 %) within budget |
| startup.warm.settled-renderer-ws-kb | 153240 (10, 1028) | 152990 (10, 152) | -250 (-0.2 %) within budget |
| startup.warm.window-created-ms | 441 (10, 1.9) | 441 (10, 1.9) | +0.0 (+0.0 %) within budget |
| view-data.heic.launch-to-window-created-ms | 12.1 (9, 0.2) | 12.1 (9, 0.5) | +0.0 (+0.1 %) within budget |
| view-data.heic.menu-to-request-ms | 22.6 (9, 0.5) | 23.6 (9, 1.0) | +1.0 (+4.4 %) within budget |
| view-data.heic.request-to-image-ms | 1268 (9, 8.0) | 1283 (9, 10.3) | +15.7 (+1.2 %) within budget |
| view-data.heic.request-to-launch-ms | 0.2 (9, 0.1) | 0.1 (9, 0.1) | -0.1 (-59.7 %) within budget |
| view-data.heic.request-to-metadata-ms | 1270 (9, 8.1) | 1288 (9, 11.4) | +18.6 (+1.5 %) within budget |
| view-data.heic.request-to-page-loaded-ms | 157 (9, 1.5) | 130 (9, 4.9) | -27.4 (-17.4 %) improvement |
| view-data.heic.window-created-to-page-loaded-ms | 146 (9, 1.1) | 117 (9, 3.6) | -28.6 (-19.6 %) improvement |
| view-data.jpeg-first.launch-to-window-created-ms | 20.9 (9, 0.4) | 20.5 (9, 0.4) | -0.4 (-1.7 %) within budget |
| view-data.jpeg-first.menu-to-request-ms | 22.8 (9, 1.1) | 22.5 (9, 1.3) | -0.3 (-1.3 %) within budget |
| view-data.jpeg-first.request-to-image-ms | 760 (9, 1.7) | 828 (9, 11.6) | +68.8 (+9.1 %) within budget |
| view-data.jpeg-first.request-to-launch-ms | 0.3 (9, 0.2) | 0.3 (9, 0.1) | -0.0 (-10.0 %) within budget |
| view-data.jpeg-first.request-to-metadata-ms | 783 (9, 1.7) | 846 (9, 6.7) | +62.7 (+8.0 %) within budget |
| view-data.jpeg-first.request-to-page-loaded-ms | 205 (9, 1.2) | 186 (9, 2.1) | -19.2 (-9.4 %) within budget |
| view-data.jpeg-first.window-created-to-page-loaded-ms | 184 (9, 1.4) | 165 (9, 2.4) | -19.1 (-10.4 %) improvement |
| view-data.jpeg.launch-to-window-created-ms | 11.6 (9, 0.1) | 11.6 (9, 0.3) | +0.0 (+0.3 %) within budget |
| view-data.jpeg.menu-to-request-ms | 22.6 (9, 0.4) | 22.2 (9, 0.5) | -0.4 (-1.8 %) within budget |
| view-data.jpeg.request-to-image-ms | 745 (9, 2.4) | 801 (9, 4.9) | +56.0 (+7.5 %) within budget |
| view-data.jpeg.request-to-launch-ms | 0.1 (9, 0.3) | 0.1 (9, 0.1) | -0.1 (-45.6 %) within budget |
| view-data.jpeg.request-to-metadata-ms | 767 (9, 3.0) | 825 (9, 3.0) | +57.6 (+7.5 %) within budget |
| view-data.jpeg.request-to-page-loaded-ms | 182 (9, 3.0) | 165 (9, 6.3) | -17.0 (-9.4 %) within budget |
| view-data.jpeg.window-created-to-page-loaded-ms | 171 (9, 3.2) | 153 (9, 5.5) | -17.2 (-10.1 %) improvement |
