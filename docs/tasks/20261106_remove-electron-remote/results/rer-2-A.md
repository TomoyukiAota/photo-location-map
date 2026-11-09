# Series rer-2-A (protocol rer-2)

Builds: 0 (code e6a1d1e7c0b2), A (code f0296fedce14). Baseline: 0.
Host: Apple M5, 10 cores, 32 GB, darwin 27.0.0.
Viewer: 4be696704639 (unchanged).
Complete: yes. Trials: {"0":{"open-folder":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"settings":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"startup":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"view-data":{"ok":10,"failed":0,"interrupted":0,"warmup":1}},"A":{"open-folder":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"settings":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"startup":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"view-data":{"ok":10,"failed":0,"interrupted":0,"warmup":1}}}

| Metric | 0 median (n, MAD) | A median (n, MAD) | A vs 0 |
| --- | ---: | ---: | --- |
| open-folder.cold.click-to-complete-ms | 765 (10, 13.3) | 675 (10, 5.7) | -90.3 (-11.8 %) improvement |
| open-folder.cold.click-to-dialog-ms | 25.8 (10, 2.8) | 29.2 (10, 5.2) | +3.4 (+13.2 %) within budget |
| open-folder.cold.dialog-ms | 1.7 (10, 0.1) | 0.5 (10, 0.0) | -1.2 (-69.7 %) within budget |
| open-folder.cold.dialog-to-start-ms | 0.8 (10, 0.0) | 0.4 (10, 0.0) | -0.4 (-50.0 %) within budget |
| open-folder.cold.directory-tree-ms | 15.2 (10, 0.2) | 17.0 (10, 0.8) | +1.8 (+11.8 %) within budget |
| open-folder.cold.exif-files | 314 (10, 0.0) | 314 (10, 0.0) | +0.0 (+0.0 %) same |
| open-folder.cold.exif-max-file-ms | 45.7 (10, 2.3) | 23.3 (10, 0.3) | -22.3 (-48.9 %) |
| open-folder.cold.exif-parse-sum-ms | 236 (10, 9.4) | 81.4 (10, 3.0) | -155 (-65.5 %) |
| open-folder.cold.exif-read-sum-ms | 0.0 (10, 0.0) | 228 (10, 6.5) | +228 () |
| open-folder.cold.exif-rotate-sum-ms | 5311 (10, 29.1) | 4777 (10, 9.5) | -534 (-10.1 %) |
| open-folder.cold.exif-thumbnail-sum-ms | 225 (10, 4.7) | 50.0 (10, 1.4) | -175 (-77.7 %) |
| open-folder.cold.finish-ms | 110 (10, 0.6) | 112 (10, 0.4) | +1.3 (+1.1 %) within budget |
| open-folder.cold.main-event-loop-max-ms | 23.8 (10, 4.5) | 26.9 (10, 5.9) | +3.1 (+12.9 %) within budget |
| open-folder.cold.main-event-loop-p99-ms | 19.3 (10, 0.9) | 19.5 (10, 2.2) | +0.2 (+1.2 %) within budget |
| open-folder.cold.peak-tree-delta-kb | 2602848 (10, 283856) | 2500584 (10, 158584) | -102264 (-3.9 %) within budget |
| open-folder.cold.peak-tree-rss-kb | 3349256 (10, 289176) | 3233656 (10, 175976) | -115600 (-3.5 %) within budget |
| open-folder.cold.photo-data-ms | 610 (10, 8.0) | 516 (10, 0.8) | -94.3 (-15.5 %) improvement |
| open-folder.cold.renderer-longtask-max-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.cold.renderer-longtask-total-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.cold.renderer-longtasks | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.cold.renderer-max-frame-gap-ms | 44.2 (10, 3.5) | 43.6 (10, 2.4) | -0.6 (-1.4 %) within budget |
| open-folder.cold.settled-main-ws-kb | 194176 (10, 18480) | 184656 (10, 14256) | -9520 (-4.9 %) within budget |
| open-folder.cold.settled-renderer-ws-kb | 271136 (10, 24344) | 246872 (10, 29784) | -24264 (-8.9 %) within budget |
| open-folder.cold.settled-tree-rss-kb | 623600 (10, 55800) | 586376 (10, 47048) | -37224 (-6.0 %) within budget |
| open-folder.cold.start-to-complete-ms | 735 (10, 7.2) | 644 (10, 0.8) | -90.7 (-12.3 %) improvement |
| open-folder.cold.start-to-markers-ms | 1752 (10, 8.6) | 1662 (10, 1.7) | -89.2 (-5.1 %) within budget |
| open-folder.cold.start-to-thumbnails-done-ms | 5734 (10, 7.4) | 5644 (10, 0.6) | -89.6 (-1.6 %) within budget |
| open-folder.cold.thumbnails-main-ms | 2009 (10, 25.9) | 2053 (10, 65.9) | +43.9 (+2.2 %) within budget |
| open-folder.warm.click-to-complete-ms | 770 (10, 7.8) | 682 (10, 6.6) | -88.0 (-11.4 %) improvement |
| open-folder.warm.click-to-dialog-ms | 26.2 (10, 3.8) | 31.4 (10, 4.3) | +5.2 (+19.7 %) within budget |
| open-folder.warm.dialog-ms | 1.4 (10, 0.1) | 0.5 (10, 0.0) | -1.0 (-67.9 %) within budget |
| open-folder.warm.dialog-to-start-ms | 0.6 (10, 0.0) | 0.3 (10, 0.0) | -0.3 (-50.0 %) within budget |
| open-folder.warm.directory-tree-ms | 16.3 (10, 0.5) | 17.8 (10, 0.2) | +1.5 (+8.9 %) within budget |
| open-folder.warm.exif-files | 314 (10, 0.0) | 314 (10, 0.0) | +0.0 (+0.0 %) same |
| open-folder.warm.exif-max-file-ms | 41.6 (10, 2.2) | 36.6 (10, 1.0) | -5.0 (-12.0 %) |
| open-folder.warm.exif-parse-sum-ms | 214 (10, 2.5) | 62.3 (10, 1.3) | -152 (-70.9 %) |
| open-folder.warm.exif-read-sum-ms | 0.0 (10, 0.0) | 203 (10, 4.1) | +203 () |
| open-folder.warm.exif-rotate-sum-ms | 5382 (10, 27.9) | 4891 (10, 36.4) | -492 (-9.1 %) |
| open-folder.warm.exif-thumbnail-sum-ms | 214 (10, 3.4) | 48.9 (10, 2.0) | -165 (-77.2 %) |
| open-folder.warm.finish-ms | 110 (10, 0.4) | 110 (10, 0.5) | +0.3 (+0.2 %) within budget |
| open-folder.warm.main-event-loop-max-ms | 12.4 (10, 0.2) | 12.4 (10, 0.1) | +0.0 (+0.0 %) within budget |
| open-folder.warm.main-event-loop-p99-ms | 12.2 (10, 0.1) | 12.3 (10, 0.1) | +0.1 (+0.6 %) within budget |
| open-folder.warm.peak-tree-delta-kb | 126488 (10, 29144) | 145976 (10, 26000) | +19488 (+15.4 %) within budget |
| open-folder.warm.peak-tree-rss-kb | 750136 (10, 31720) | 737664 (10, 27984) | -12472 (-1.7 %) within budget |
| open-folder.warm.photo-data-ms | 610 (10, 3.5) | 521 (10, 2.9) | -89.1 (-14.6 %) improvement |
| open-folder.warm.renderer-longtask-max-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.warm.renderer-longtask-total-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.warm.renderer-longtasks | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.warm.renderer-max-frame-gap-ms | 54.2 (10, 4.8) | 56.7 (10, 4.6) | +2.5 (+4.6 %) within budget |
| open-folder.warm.settled-main-ws-kb | 232376 (10, 4952) | 219272 (10, 6216) | -13104 (-5.6 %) within budget |
| open-folder.warm.settled-renderer-ws-kb | 330888 (10, 13864) | 331704 (10, 14864) | +816 (+0.2 %) within budget |
| open-folder.warm.settled-tree-rss-kb | 751760 (10, 31592) | 734992 (10, 26368) | -16768 (-2.2 %) within budget |
| open-folder.warm.start-to-complete-ms | 736 (10, 4.1) | 648 (10, 3.0) | -87.4 (-11.9 %) improvement |
| settings.restart.click-to-exit-ms | 125 (10, 2.0) | 126 (10, 6.5) | +1.0 (+0.8 %) within budget |
| settings.restart.click-to-home-rendered-ms | 483 (10, 3.2) | 482 (10, 6.7) | -1.0 (-0.2 %) within budget |
| settings.restart.click-to-process-started-ms | 153 (10, 2.7) | 154 (10, 7.9) | +0.8 (+0.5 %) within budget |
| settings.restart.process-to-home-rendered-ms | 329 (10, 2.8) | 330 (10, 5.2) | +0.4 (+0.1 %) within budget |
| settings.save.click-to-closed-ms | 114 (10, 0.8) | 114 (10, 0.3) | +0.0 (+0.0 %) within budget |
| settings.save.click-to-persisted-ms | 114 (10, 0.5) | 114 (10, 0.5) | +0.0 (+0.0 %) within budget |
| startup.cold.bootstrap-done-ms | 392 (10, 4.7) | 384 (10, 4.7) | -7.2 (-1.8 %) within budget |
| startup.cold.bootstrap-start-ms | 374 (10, 4.8) | 368 (10, 3.8) | -5.9 (-1.6 %) within budget |
| startup.cold.close-ms | 42.0 (10, 4.5) | 41.5 (10, 2.5) | -0.5 (-1.2 %) within budget |
| startup.cold.create-window-ms | 165 (10, 2.6) | 168 (10, 1.9) | +2.1 (+1.3 %) within budget |
| startup.cold.did-finish-load-ms | 375 (10, 4.7) | 369 (10, 3.7) | -5.9 (-1.6 %) within budget |
| startup.cold.home-rendered-ms | 403 (10, 4.3) | 398 (10, 4.4) | -5.4 (-1.4 %) within budget |
| startup.cold.navigation-start-ms | 252 (10, 2.4) | 253 (10, 2.2) | +0.9 (+0.3 %) within budget |
| startup.cold.process-started-ms | 29.3 (10, 0.7) | 30.7 (10, 0.9) | +1.4 (+4.8 %) within budget |
| startup.cold.ready-to-show-ms | 405 (10, 5.2) | 398 (10, 17.8) | -6.9 (-1.7 %) within budget |
| startup.cold.renderer-bootstrap-ms | 17.5 (10, 0.3) | 16.0 (10, 0.5) | -1.5 (-8.9 %) within budget |
| startup.cold.renderer-modules-ms | 121 (10, 1.8) | 116 (10, 1.3) | -4.8 (-3.9 %) within budget |
| startup.cold.settled-main-ws-kb | 200832 (10, 104) | 200448 (10, 144) | -384 (-0.2 %) within budget |
| startup.cold.settled-renderer-ws-kb | 319440 (10, 336) | 318552 (10, 328) | -888 (-0.3 %) within budget |
| startup.cold.settled-tree-rss-kb | 734400 (10, 720) | 732688 (10, 416) | -1712 (-0.2 %) within budget |
| startup.cold.window-created-ms | 206 (10, 3.0) | 207 (10, 1.9) | +1.4 (+0.7 %) within budget |
| startup.warm.bootstrap-done-ms | 352 (10, 4.0) | 354 (10, 6.3) | +1.7 (+0.5 %) within budget |
| startup.warm.bootstrap-start-ms | 338 (10, 2.5) | 340 (10, 3.3) | +1.3 (+0.4 %) within budget |
| startup.warm.close-ms | 42.0 (10, 4.5) | 36.0 (10, 0.5) | -6.0 (-14.3 %) within budget |
| startup.warm.create-window-ms | 163 (10, 1.4) | 167 (10, 2.3) | +3.6 (+2.2 %) within budget |
| startup.warm.did-finish-load-ms | 339 (10, 2.4) | 341 (10, 3.3) | +1.3 (+0.4 %) within budget |
| startup.warm.home-rendered-ms | 366 (10, 4.8) | 368 (10, 6.9) | +2.4 (+0.7 %) within budget |
| startup.warm.navigation-start-ms | 248 (10, 2.6) | 252 (10, 1.7) | +3.6 (+1.4 %) within budget |
| startup.warm.process-started-ms | 30.2 (10, 0.3) | 30.7 (10, 0.7) | +0.5 (+1.6 %) within budget |
| startup.warm.ready-to-show-ms | 367 (10, 3.9) | 364 (10, 5.5) | -3.0 (-0.8 %) within budget |
| startup.warm.renderer-bootstrap-ms | 12.6 (10, 0.6) | 13.9 (10, 1.0) | +1.3 (+10.3 %) within budget |
| startup.warm.renderer-modules-ms | 91.0 (10, 0.9) | 87.3 (10, 1.3) | -3.7 (-4.0 %) within budget |
| startup.warm.settled-main-ws-kb | 205040 (10, 192) | 204872 (10, 152) | -168 (-0.1 %) within budget |
| startup.warm.settled-renderer-ws-kb | 253384 (10, 4048) | 256736 (10, 1392) | +3352 (+1.3 %) within budget |
| startup.warm.settled-tree-rss-kb | 621520 (10, 8640) | 621640 (10, 2432) | +120 (+0.0 %) within budget |
| startup.warm.window-created-ms | 203 (10, 1.9) | 207 (10, 2.8) | +4.0 (+1.9 %) within budget |
| view-data.cycles.retained-tree-kb | -54792 (10, 912) | -54096 (10, 1640) | +696 (-1.3 %) within budget |
| view-data.heic.after-close-tree-delta-kb | -59944 (10, 1208) | -59520 (10, 2256) | +424 (-0.7 %) within budget |
| view-data.heic.launch-to-window-created-ms | 9.3 (10, 0.1) | 9.1 (10, 0.2) | -0.1 (-1.4 %) within budget |
| view-data.heic.menu-to-request-ms | 36.3 (10, 1.2) | 33.8 (10, 2.2) | -2.6 (-7.2 %) within budget |
| view-data.heic.open-tree-delta-kb | 487768 (10, 1040) | 486448 (10, 2960) | -1320 (-0.3 %) within budget |
| view-data.heic.peak-tree-delta-kb | 489216 (10, 1016) | 489920 (10, 1368) | +704 (+0.1 %) within budget |
| view-data.heic.request-to-image-ms | 564 (10, 8.5) | 564 (10, 8.1) | +0.0 (+0.0 %) within budget |
| view-data.heic.request-to-launch-ms | 0.2 (10, 0.1) | 0.3 (10, 0.1) | +0.1 (+43.2 %) within budget |
| view-data.heic.request-to-metadata-ms | 565 (10, 8.2) | 565 (10, 8.2) | +0.1 (+0.0 %) within budget |
| view-data.heic.request-to-page-loaded-ms | 86.3 (10, 1.0) | 86.6 (10, 0.5) | +0.3 (+0.3 %) within budget |
| view-data.heic.window-created-to-page-loaded-ms | 76.8 (10, 1.0) | 77.1 (10, 0.6) | +0.3 (+0.4 %) within budget |
| view-data.jpeg-first.after-close-tree-delta-kb | -114776 (10, 320) | -114952 (10, 1240) | -176 (+0.2 %) within budget |
| view-data.jpeg-first.launch-to-window-created-ms | 14.4 (10, 1.3) | 14.0 (10, 0.5) | -0.4 (-2.7 %) within budget |
| view-data.jpeg-first.menu-to-request-ms | 29.2 (10, 2.8) | 27.8 (10, 2.1) | -1.4 (-4.8 %) within budget |
| view-data.jpeg-first.open-tree-delta-kb | 235288 (10, 2208) | 236648 (10, 2696) | +1360 (+0.6 %) within budget |
| view-data.jpeg-first.peak-tree-delta-kb | 249600 (10, 2656) | 250984 (10, 4128) | +1384 (+0.6 %) within budget |
| view-data.jpeg-first.request-to-image-ms | 647 (10, 0.8) | 648 (10, 1.2) | +1.2 (+0.2 %) within budget |
| view-data.jpeg-first.request-to-launch-ms | 0.2 (10, 0.1) | 0.3 (10, 0.1) | +0.0 (+12.3 %) within budget |
| view-data.jpeg-first.request-to-metadata-ms | 649 (10, 1.1) | 650 (10, 1.5) | +1.4 (+0.2 %) within budget |
| view-data.jpeg-first.request-to-page-loaded-ms | 114 (10, 3.7) | 115 (10, 3.3) | +1.2 (+1.0 %) within budget |
| view-data.jpeg-first.window-created-to-page-loaded-ms | 97.6 (10, 2.1) | 98.1 (10, 1.1) | +0.5 (+0.5 %) within budget |
| view-data.jpeg.after-close-tree-delta-kb | -46616 (10, 688) | -47704 (10, 928) | -1088 (+2.3 %) within budget |
| view-data.jpeg.launch-to-window-created-ms | 9.4 (10, 0.3) | 9.4 (10, 0.2) | +0.1 (+0.6 %) within budget |
| view-data.jpeg.menu-to-request-ms | 24.0 (10, 0.9) | 39.1 (10, 0.8) | +15.1 (+62.9 %) REGRESSION |
| view-data.jpeg.open-tree-delta-kb | 292064 (10, 1072) | 292936 (10, 768) | +872 (+0.3 %) within budget |
| view-data.jpeg.peak-tree-delta-kb | 291056 (10, 1008) | 291928 (10, 880) | +872 (+0.3 %) within budget |
| view-data.jpeg.request-to-image-ms | 631 (10, 0.8) | 632 (10, 0.8) | +0.6 (+0.1 %) within budget |
| view-data.jpeg.request-to-launch-ms | 0.2 (10, 0.1) | 0.3 (10, 0.1) | +0.0 (+15.6 %) within budget |
| view-data.jpeg.request-to-metadata-ms | 632 (10, 1.1) | 633 (10, 1.3) | +0.6 (+0.1 %) within budget |
| view-data.jpeg.request-to-page-loaded-ms | 96.5 (10, 0.7) | 96.6 (10, 1.8) | +0.2 (+0.2 %) within budget |
| view-data.jpeg.window-created-to-page-loaded-ms | 86.8 (10, 0.8) | 87.4 (10, 1.6) | +0.6 (+0.7 %) within budget |
