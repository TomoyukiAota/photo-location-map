# Series rer-2-B (protocol rer-2)

Builds: 0 (code e6a1d1e7c0b2), A (code f0296fedce14), B (code c747f3e6fb52). Baseline: 0.
Host: Apple M5, 10 cores, 32 GB, darwin 27.0.0.
Viewer: 4be696704639 (unchanged).
Complete: yes. Trials: {"0":{"open-folder":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"settings":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"startup":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"view-data":{"ok":10,"failed":0,"interrupted":0,"warmup":1}},"A":{"open-folder":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"settings":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"startup":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"view-data":{"ok":10,"failed":0,"interrupted":0,"warmup":1}},"B":{"open-folder":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"settings":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"startup":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"view-data":{"ok":10,"failed":0,"interrupted":0,"warmup":1}}}

| Metric | 0 median (n, MAD) | A median (n, MAD) | B median (n, MAD) | A vs 0 | B vs 0 |
| --- | ---: | ---: | ---: | --- | --- |
| open-folder.cold.click-to-complete-ms | 766 (10, 6.4) | 680 (10, 6.2) | 677 (10, 2.8) | -85.9 (-11.2 %) improvement | -89.2 (-11.6 %) improvement |
| open-folder.cold.click-to-dialog-ms | 31.8 (10, 2.6) | 34.1 (10, 7.2) | 31.6 (10, 2.5) | +2.3 (+7.1 %) within budget | -0.2 (-0.8 %) within budget |
| open-folder.cold.dialog-ms | 1.6 (10, 0.1) | 0.5 (10, 0.0) | 0.4 (10, 0.1) | -1.1 (-68.8 %) within budget | -1.2 (-75.0 %) within budget |
| open-folder.cold.dialog-to-start-ms | 0.7 (10, 0.0) | 0.6 (10, 0.0) | 0.1 (10, 0.1) | -0.1 (-14.3 %) within budget | -0.6 (-85.7 %) within budget |
| open-folder.cold.directory-tree-ms | 15.1 (10, 0.1) | 16.3 (10, 0.3) | 17.5 (10, 0.2) | +1.2 (+7.9 %) within budget | +2.4 (+15.9 %) within budget |
| open-folder.cold.exif-files | 314 (10, 0.0) | 314 (10, 0.0) | 314 (10, 0.0) | +0.0 (+0.0 %) same | +0.0 (+0.0 %) same |
| open-folder.cold.exif-max-file-ms | 44.9 (10, 1.0) | 23.5 (10, 0.4) | 23.7 (10, 0.6) | -21.4 (-47.7 %) | -21.3 (-47.3 %) |
| open-folder.cold.exif-parse-sum-ms | 244 (10, 17.9) | 82.4 (10, 2.0) | 83.2 (10, 4.2) | -162 (-66.2 %) | -161 (-65.9 %) |
| open-folder.cold.exif-read-sum-ms | 0.0 (10, 0.0) | 229 (10, 4.5) | 234 (10, 10.2) | +229 () | +234 () |
| open-folder.cold.exif-rotate-sum-ms | 5274 (10, 70.2) | 4783 (10, 6.3) | 4765 (10, 14.2) | -490 (-9.3 %) | -509 (-9.7 %) |
| open-folder.cold.exif-thumbnail-sum-ms | 231 (10, 7.0) | 50.2 (10, 1.9) | 53.9 (10, 2.9) | -181 (-78.3 %) | -177 (-76.7 %) |
| open-folder.cold.finish-ms | 111 (10, 0.4) | 111 (10, 0.6) | 111 (10, 0.7) | +0.8 (+0.7 %) within budget | +0.0 (+0.0 %) within budget |
| open-folder.cold.main-event-loop-max-ms | 21.5 (10, 1.8) | 22.6 (10, 4.1) | 21.4 (10, 1.8) | +1.1 (+5.3 %) within budget | -0.1 (-0.6 %) within budget |
| open-folder.cold.main-event-loop-p99-ms | 19.0 (10, 1.0) | 19.0 (10, 1.0) | 18.3 (10, 0.8) | -0.1 (-0.4 %) within budget | -0.8 (-4.0 %) within budget |
| open-folder.cold.peak-tree-delta-kb | 2496704 (10, 140328) | 2706680 (10, 316304) | 2454176 (10, 87832) | +209976 (+8.4 %) within budget | -42528 (-1.7 %) within budget |
| open-folder.cold.peak-tree-rss-kb | 3237072 (10, 142456) | 3445680 (10, 320128) | 3198432 (10, 81328) | +208608 (+6.4 %) within budget | -38640 (-1.2 %) within budget |
| open-folder.cold.photo-data-ms | 602 (10, 3.3) | 517 (10, 0.2) | 516 (10, 0.4) | -84.9 (-14.1 %) improvement | -85.8 (-14.3 %) improvement |
| open-folder.cold.renderer-longtask-max-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget | +0.0 () within budget |
| open-folder.cold.renderer-longtask-total-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget | +0.0 () within budget |
| open-folder.cold.renderer-longtasks | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget | +0.0 () within budget |
| open-folder.cold.renderer-max-frame-gap-ms | 49.6 (10, 10.4) | 56.3 (10, 5.0) | 45.4 (10, 8.1) | +6.7 (+13.6 %) within budget | -4.3 (-8.6 %) within budget |
| open-folder.cold.settled-main-ws-kb | 196304 (10, 17104) | 227296 (10, 13560) | 184736 (10, 11120) | +30992 (+15.8 %) within budget | -11568 (-5.9 %) within budget |
| open-folder.cold.settled-renderer-ws-kb | 258616 (10, 11592) | 286264 (10, 12248) | 243616 (10, 9272) | +27648 (+10.7 %) within budget | -15000 (-5.8 %) within budget |
| open-folder.cold.settled-tree-rss-kb | 616632 (10, 40880) | 676208 (10, 26000) | 589688 (10, 27864) | +59576 (+9.7 %) within budget | -26944 (-4.4 %) within budget |
| open-folder.cold.start-to-complete-ms | 729 (10, 4.3) | 644 (10, 1.1) | 644 (10, 1.2) | -85.2 (-11.7 %) improvement | -84.6 (-11.6 %) improvement |
| open-folder.cold.start-to-markers-ms | 1746 (10, 3.8) | 1662 (10, 1.1) | 1664 (10, 3.3) | -83.9 (-4.8 %) within budget | -81.9 (-4.7 %) within budget |
| open-folder.cold.start-to-thumbnails-done-ms | 5730 (10, 3.7) | 5644 (10, 1.0) | 5645 (10, 1.2) | -86.2 (-1.5 %) within budget | -85.2 (-1.5 %) within budget |
| open-folder.cold.thumbnails-main-ms | 2034 (10, 23.8) | 2013 (10, 54.8) | 1989 (10, 42.8) | -20.4 (-1.0 %) within budget | -44.6 (-2.2 %) within budget |
| open-folder.warm.click-to-complete-ms | 771 (10, 7.8) | 684 (10, 3.7) | 684 (10, 1.5) | -87.5 (-11.3 %) improvement | -87.8 (-11.4 %) improvement |
| open-folder.warm.click-to-dialog-ms | 30.8 (10, 4.3) | 33.8 (10, 2.3) | 34.0 (10, 2.2) | +3.0 (+9.6 %) within budget | +3.2 (+10.4 %) within budget |
| open-folder.warm.dialog-ms | 1.4 (10, 0.0) | 0.4 (10, 0.0) | 0.4 (10, 0.1) | -1.0 (-71.4 %) within budget | -1.0 (-67.9 %) within budget |
| open-folder.warm.dialog-to-start-ms | 0.6 (10, 0.0) | 0.3 (10, 0.1) | 0.1 (10, 0.1) | -0.3 (-50.0 %) within budget | -0.5 (-83.3 %) within budget |
| open-folder.warm.directory-tree-ms | 16.1 (10, 0.4) | 17.8 (10, 0.5) | 17.9 (10, 0.2) | +1.7 (+10.2 %) within budget | +1.8 (+11.5 %) within budget |
| open-folder.warm.exif-files | 314 (10, 0.0) | 314 (10, 0.0) | 314 (10, 0.0) | +0.0 (+0.0 %) same | +0.0 (+0.0 %) same |
| open-folder.warm.exif-max-file-ms | 43.8 (10, 2.8) | 37.3 (10, 1.2) | 35.4 (10, 4.4) | -6.4 (-14.6 %) | -8.4 (-19.2 %) |
| open-folder.warm.exif-parse-sum-ms | 218 (10, 6.7) | 62.9 (10, 1.4) | 67.1 (10, 5.1) | -155 (-71.1 %) | -150 (-69.1 %) |
| open-folder.warm.exif-read-sum-ms | 0.0 (10, 0.0) | 204 (10, 2.4) | 212 (10, 11.0) | +204 () | +212 () |
| open-folder.warm.exif-rotate-sum-ms | 5395 (10, 38.0) | 4967 (10, 28.1) | 4876 (10, 29.9) | -428 (-7.9 %) | -519 (-9.6 %) |
| open-folder.warm.exif-thumbnail-sum-ms | 214 (10, 5.8) | 48.2 (10, 1.4) | 52.0 (10, 2.8) | -166 (-77.4 %) | -162 (-75.7 %) |
| open-folder.warm.finish-ms | 109 (10, 0.7) | 110 (10, 0.4) | 110 (10, 0.7) | +1.1 (+1.0 %) within budget | +1.1 (+1.0 %) within budget |
| open-folder.warm.main-event-loop-max-ms | 12.6 (10, 0.3) | 12.5 (10, 0.2) | 12.6 (10, 0.1) | -0.2 (-1.2 %) within budget | -0.0 (-0.3 %) within budget |
| open-folder.warm.main-event-loop-p99-ms | 12.2 (10, 0.0) | 12.3 (10, 0.1) | 12.3 (10, 0.1) | +0.1 (+1.0 %) within budget | +0.2 (+1.3 %) within budget |
| open-folder.warm.peak-tree-delta-kb | 140400 (10, 15008) | 130832 (10, 21056) | 163016 (10, 14792) | -9568 (-6.8 %) within budget | +22616 (+16.1 %) within budget |
| open-folder.warm.peak-tree-rss-kb | 757120 (10, 31128) | 810520 (10, 6488) | 750896 (10, 18448) | +53400 (+7.1 %) within budget | -6224 (-0.8 %) within budget |
| open-folder.warm.photo-data-ms | 610 (10, 3.6) | 531 (10, 2.7) | 519 (10, 1.8) | -78.5 (-12.9 %) improvement | -90.9 (-14.9 %) improvement |
| open-folder.warm.renderer-longtask-max-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget | +0.0 () within budget |
| open-folder.warm.renderer-longtask-total-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget | +0.0 () within budget |
| open-folder.warm.renderer-longtasks | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget | +0.0 () within budget |
| open-folder.warm.renderer-max-frame-gap-ms | 65.9 (10, 9.3) | 73.5 (10, 2.7) | 66.9 (10, 9.0) | +7.5 (+11.4 %) within budget | +1.0 (+1.4 %) within budget |
| open-folder.warm.settled-main-ws-kb | 234352 (10, 8256) | 249240 (10, 7304) | 221488 (10, 6712) | +14888 (+6.4 %) within budget | -12864 (-5.5 %) within budget |
| open-folder.warm.settled-renderer-ws-kb | 331576 (10, 12376) | 353040 (10, 8080) | 332464 (10, 8296) | +21464 (+6.5 %) within budget | +888 (+0.3 %) within budget |
| open-folder.warm.settled-tree-rss-kb | 758528 (10, 29904) | 808216 (10, 6032) | 746784 (10, 18272) | +49688 (+6.6 %) within budget | -11744 (-1.5 %) within budget |
| open-folder.warm.start-to-complete-ms | 735 (10, 4.3) | 659 (10, 2.9) | 649 (10, 2.9) | -76.1 (-10.4 %) improvement | -86.0 (-11.7 %) improvement |
| settings.restart.click-to-exit-ms | 127 (10, 5.5) | 132 (10, 5.5) | 128 (10, 4.5) | +5.0 (+4.0 %) within budget | +1.0 (+0.8 %) within budget |
| settings.restart.click-to-home-rendered-ms | 486 (10, 6.8) | 482 (10, 7.7) | 482 (10, 5.1) | -3.9 (-0.8 %) within budget | -4.3 (-0.9 %) within budget |
| settings.restart.click-to-process-started-ms | 155 (10, 5.8) | 160 (10, 5.1) | 156 (10, 5.0) | +5.7 (+3.7 %) within budget | +1.6 (+1.0 %) within budget |
| settings.restart.process-to-home-rendered-ms | 330 (10, 6.0) | 328 (10, 3.9) | 325 (10, 3.4) | -2.7 (-0.8 %) within budget | -5.8 (-1.7 %) within budget |
| settings.save.click-to-closed-ms | 107 (10, 1.6) | 108 (10, 1.1) | 108 (10, 2.6) | +1.1 (+1.0 %) within budget | +1.7 (+1.5 %) within budget |
| settings.save.click-to-persisted-ms | 107 (10, 2.0) | 108 (10, 1.0) | 109 (10, 2.5) | +1.0 (+0.9 %) within budget | +2.0 (+1.9 %) within budget |
| startup.cold.bootstrap-done-ms | 394 (10, 5.7) | 385 (10, 3.4) | 387 (10, 11.3) | -9.2 (-2.3 %) within budget | -6.9 (-1.8 %) within budget |
| startup.cold.bootstrap-start-ms | 374 (10, 5.2) | 367 (10, 3.4) | 370 (10, 10.8) | -6.3 (-1.7 %) within budget | -3.3 (-0.9 %) within budget |
| startup.cold.close-ms | 45.5 (10, 3.5) | 48.0 (10, 2.0) | 46.0 (10, 3.0) | +2.5 (+5.5 %) within budget | +0.5 (+1.1 %) within budget |
| startup.cold.create-window-ms | 163 (10, 1.9) | 166 (10, 2.2) | 168 (10, 4.0) | +2.8 (+1.7 %) within budget | +4.9 (+3.0 %) within budget |
| startup.cold.did-finish-load-ms | 374 (10, 5.4) | 368 (10, 3.4) | 371 (10, 10.9) | -6.3 (-1.7 %) within budget | -3.2 (-0.9 %) within budget |
| startup.cold.home-rendered-ms | 407 (10, 5.3) | 399 (10, 3.7) | 400 (10, 11.0) | -7.5 (-1.8 %) within budget | -7.1 (-1.7 %) within budget |
| startup.cold.navigation-start-ms | 250 (10, 2.4) | 251 (10, 1.7) | 255 (10, 4.9) | +1.7 (+0.7 %) within budget | +5.2 (+2.1 %) within budget |
| startup.cold.process-started-ms | 30.6 (10, 1.5) | 30.1 (10, 0.6) | 32.4 (10, 0.6) | -0.5 (-1.6 %) within budget | +1.8 (+5.8 %) within budget |
| startup.cold.ready-to-show-ms | 400 (10, 19.8) | 398 (10, 7.4) | 400 (10, 12.8) | -2.1 (-0.5 %) within budget | -0.7 (-0.2 %) within budget |
| startup.cold.renderer-bootstrap-ms | 20.3 (10, 0.5) | 17.3 (10, 1.2) | 17.4 (10, 1.8) | -2.9 (-14.6 %) within budget | -2.8 (-13.8 %) within budget |
| startup.cold.renderer-modules-ms | 121 (10, 2.2) | 117 (10, 1.5) | 114 (10, 2.6) | -4.8 (-4.0 %) within budget | -6.9 (-5.7 %) within budget |
| startup.cold.settled-main-ws-kb | 200824 (10, 96.0) | 200608 (10, 96.0) | 200752 (10, 120) | -216 (-0.1 %) within budget | -72.0 (-0.0 %) within budget |
| startup.cold.settled-renderer-ws-kb | 318632 (10, 984) | 318536 (10, 416) | 318328 (10, 816) | -96.0 (-0.0 %) within budget | -304 (-0.1 %) within budget |
| startup.cold.settled-tree-rss-kb | 739168 (10, 6392) | 733304 (10, 6528) | 733600 (10, 3440) | -5864 (-0.8 %) within budget | -5568 (-0.8 %) within budget |
| startup.cold.window-created-ms | 204 (10, 2.5) | 206 (10, 2.0) | 208 (10, 3.5) | +2.2 (+1.1 %) within budget | +4.3 (+2.1 %) within budget |
| startup.warm.bootstrap-done-ms | 356 (10, 5.7) | 349 (10, 3.6) | 346 (10, 3.2) | -7.3 (-2.1 %) within budget | -9.7 (-2.7 %) within budget |
| startup.warm.bootstrap-start-ms | 341 (10, 4.7) | 337 (10, 3.0) | 335 (10, 2.2) | -4.3 (-1.2 %) within budget | -6.5 (-1.9 %) within budget |
| startup.warm.close-ms | 41.5 (10, 2.0) | 38.0 (10, 2.5) | 42.0 (10, 4.5) | -3.5 (-8.4 %) within budget | +0.5 (+1.2 %) within budget |
| startup.warm.create-window-ms | 165 (10, 3.1) | 166 (10, 1.9) | 165 (10, 2.8) | +0.8 (+0.5 %) within budget | -0.7 (-0.4 %) within budget |
| startup.warm.did-finish-load-ms | 342 (10, 4.7) | 338 (10, 3.0) | 336 (10, 2.3) | -4.2 (-1.2 %) within budget | -6.4 (-1.9 %) within budget |
| startup.warm.home-rendered-ms | 371 (10, 4.3) | 363 (10, 3.4) | 361 (10, 3.2) | -7.8 (-2.1 %) within budget | -10.1 (-2.7 %) within budget |
| startup.warm.navigation-start-ms | 250 (10, 3.8) | 251 (10, 2.7) | 249 (10, 1.8) | +1.7 (+0.7 %) within budget | -0.7 (-0.3 %) within budget |
| startup.warm.process-started-ms | 30.6 (10, 0.7) | 30.4 (10, 0.7) | 29.7 (10, 1.0) | -0.2 (-0.6 %) within budget | -0.8 (-2.8 %) within budget |
| startup.warm.ready-to-show-ms | 366 (10, 5.6) | 364 (10, 5.9) | 363 (10, 2.5) | -2.9 (-0.8 %) within budget | -3.1 (-0.9 %) within budget |
| startup.warm.renderer-bootstrap-ms | 13.6 (10, 1.4) | 12.4 (10, 1.6) | 10.9 (10, 0.8) | -1.2 (-8.8 %) within budget | -2.7 (-19.9 %) within budget |
| startup.warm.renderer-modules-ms | 90.8 (10, 0.7) | 86.6 (10, 1.1) | 85.8 (10, 0.8) | -4.2 (-4.7 %) within budget | -4.9 (-5.5 %) within budget |
| startup.warm.settled-main-ws-kb | 205144 (10, 136) | 205064 (10, 88.0) | 204776 (10, 112) | -80.0 (-0.0 %) within budget | -368 (-0.2 %) within budget |
| startup.warm.settled-renderer-ws-kb | 253856 (10, 2832) | 252680 (10, 3112) | 254512 (10, 2384) | -1176 (-0.5 %) within budget | +656 (+0.3 %) within budget |
| startup.warm.settled-tree-rss-kb | 622176 (10, 1776) | 619648 (10, 5744) | 622192 (10, 1568) | -2528 (-0.4 %) within budget | +16.0 (+0.0 %) within budget |
| startup.warm.window-created-ms | 206 (10, 3.5) | 207 (10, 2.0) | 205 (10, 3.0) | +0.3 (+0.1 %) within budget | -1.3 (-0.6 %) within budget |
| view-data.cycles.retained-tree-kb | -53296 (10, 2432) | -56808 (10, 2120) | -53912 (10, 1680) | -3512 (+6.6 %) within budget | -616 (+1.2 %) within budget |
| view-data.heic.after-close-tree-delta-kb | -59600 (10, 2984) | -57864 (10, 1760) | -57160 (10, 1280) | +1736 (-2.9 %) within budget | +2440 (-4.1 %) within budget |
| view-data.heic.launch-to-window-created-ms | 9.2 (10, 0.1) | 9.4 (10, 0.2) | 9.4 (10, 0.3) | +0.2 (+2.2 %) within budget | +0.2 (+1.6 %) within budget |
| view-data.heic.menu-to-request-ms | 36.1 (10, 1.3) | 36.3 (10, 2.2) | 36.5 (10, 1.8) | +0.2 (+0.6 %) within budget | +0.4 (+1.1 %) within budget |
| view-data.heic.open-tree-delta-kb | 486840 (10, 1216) | 487800 (10, 1816) | 488872 (10, 1256) | +960 (+0.2 %) within budget | +2032 (+0.4 %) within budget |
| view-data.heic.peak-tree-delta-kb | 488384 (10, 1256) | 489288 (10, 1736) | 490288 (10, 1208) | +904 (+0.2 %) within budget | +1904 (+0.4 %) within budget |
| view-data.heic.request-to-image-ms | 564 (10, 0.4) | 564 (10, 0.7) | 565 (10, 1.4) | -0.4 (-0.1 %) within budget | +0.7 (+0.1 %) within budget |
| view-data.heic.request-to-launch-ms | 0.2 (10, 0.1) | 0.2 (10, 0.0) | 0.3 (10, 0.1) | -0.0 (-5.6 %) within budget | +0.0 (+11.6 %) within budget |
| view-data.heic.request-to-metadata-ms | 566 (10, 0.3) | 565 (10, 0.8) | 566 (10, 1.5) | -0.5 (-0.1 %) within budget | +0.8 (+0.2 %) within budget |
| view-data.heic.request-to-page-loaded-ms | 87.1 (10, 1.7) | 87.5 (10, 0.6) | 87.5 (10, 1.5) | +0.4 (+0.5 %) within budget | +0.4 (+0.4 %) within budget |
| view-data.heic.window-created-to-page-loaded-ms | 77.7 (10, 1.7) | 77.6 (10, 0.6) | 77.6 (10, 1.4) | -0.1 (-0.1 %) within budget | -0.1 (-0.1 %) within budget |
| view-data.jpeg-first.after-close-tree-delta-kb | -113976 (10, 920) | -115744 (10, 904) | -114960 (10, 560) | -1768 (+1.6 %) within budget | -984 (+0.9 %) within budget |
| view-data.jpeg-first.launch-to-window-created-ms | 18.6 (10, 0.7) | 18.6 (10, 0.8) | 14.7 (10, 1.5) | -0.0 (-0.2 %) within budget | -3.9 (-21.0 %) within budget |
| view-data.jpeg-first.menu-to-request-ms | 29.5 (10, 3.1) | 29.2 (10, 2.2) | 31.3 (10, 4.6) | -0.3 (-1.2 %) within budget | +1.7 (+5.8 %) within budget |
| view-data.jpeg-first.open-tree-delta-kb | 235416 (10, 2544) | 234448 (10, 4552) | 236032 (10, 7176) | -968 (-0.4 %) within budget | +616 (+0.3 %) within budget |
| view-data.jpeg-first.peak-tree-delta-kb | 251352 (10, 2568) | 248264 (10, 4016) | 252480 (10, 4392) | -3088 (-1.2 %) within budget | +1128 (+0.4 %) within budget |
| view-data.jpeg-first.request-to-image-ms | 652 (10, 2.8) | 656 (10, 7.1) | 650 (10, 3.5) | +4.0 (+0.6 %) within budget | -1.4 (-0.2 %) within budget |
| view-data.jpeg-first.request-to-launch-ms | 0.3 (10, 0.0) | 0.3 (10, 0.0) | 0.3 (10, 0.1) | +0.0 (+1.3 %) within budget | +0.0 (+9.5 %) within budget |
| view-data.jpeg-first.request-to-metadata-ms | 658 (10, 6.9) | 659 (10, 6.5) | 655 (10, 6.0) | +0.5 (+0.1 %) within budget | -3.7 (-0.6 %) within budget |
| view-data.jpeg-first.request-to-page-loaded-ms | 118 (10, 2.1) | 119 (10, 1.8) | 116 (10, 3.1) | +1.5 (+1.3 %) within budget | -1.9 (-1.6 %) within budget |
| view-data.jpeg-first.window-created-to-page-loaded-ms | 99.5 (10, 4.1) | 100 (10, 1.1) | 100 (10, 3.6) | +0.6 (+0.6 %) within budget | +0.5 (+0.5 %) within budget |
| view-data.jpeg.after-close-tree-delta-kb | -46800 (10, 664) | -46920 (10, 1416) | -44064 (10, 608) | -120 (+0.3 %) within budget | +2736 (-5.8 %) within budget |
| view-data.jpeg.launch-to-window-created-ms | 9.2 (10, 0.3) | 9.4 (10, 0.2) | 9.3 (10, 0.3) | +0.2 (+2.5 %) within budget | +0.0 (+0.5 %) within budget |
| view-data.jpeg.menu-to-request-ms | 24.4 (10, 0.6) | 25.3 (10, 1.4) | 24.7 (10, 1.1) | +0.9 (+3.7 %) within budget | +0.3 (+1.0 %) within budget |
| view-data.jpeg.open-tree-delta-kb | 293344 (10, 1440) | 291680 (10, 2000) | 292272 (10, 1504) | -1664 (-0.6 %) within budget | -1072 (-0.4 %) within budget |
| view-data.jpeg.peak-tree-delta-kb | 292568 (10, 1288) | 290624 (10, 1928) | 291440 (10, 1504) | -1944 (-0.7 %) within budget | -1128 (-0.4 %) within budget |
| view-data.jpeg.request-to-image-ms | 632 (10, 1.2) | 631 (10, 0.4) | 632 (10, 0.8) | -0.7 (-0.1 %) within budget | -0.1 (-0.0 %) within budget |
| view-data.jpeg.request-to-launch-ms | 0.2 (10, 0.1) | 0.2 (10, 0.0) | 0.2 (10, 0.1) | -0.1 (-25.0 %) within budget | +0.0 (+0.0 %) within budget |
| view-data.jpeg.request-to-metadata-ms | 633 (10, 1.2) | 632 (10, 0.6) | 633 (10, 0.9) | -0.9 (-0.1 %) within budget | -0.7 (-0.1 %) within budget |
| view-data.jpeg.request-to-page-loaded-ms | 97.4 (10, 2.8) | 96.1 (10, 1.4) | 96.6 (10, 0.6) | -1.2 (-1.3 %) within budget | -0.8 (-0.8 %) within budget |
| view-data.jpeg.window-created-to-page-loaded-ms | 87.8 (10, 2.8) | 86.0 (10, 1.1) | 86.6 (10, 0.8) | -1.8 (-2.0 %) within budget | -1.3 (-1.4 %) within budget |

## B against A

The same trials, with A as the baseline: B's change from stage A alone.

| Metric | A median (n, MAD) | B median (n, MAD) | B vs A |
| --- | ---: | ---: | --- |
| open-folder.cold.click-to-complete-ms | 680 (10, 6.2) | 677 (10, 2.8) | -3.3 (-0.5 %) within budget |
| open-folder.cold.click-to-dialog-ms | 34.1 (10, 7.2) | 31.6 (10, 2.5) | -2.5 (-7.3 %) within budget |
| open-folder.cold.dialog-ms | 0.5 (10, 0.0) | 0.4 (10, 0.1) | -0.1 (-20.0 %) within budget |
| open-folder.cold.dialog-to-start-ms | 0.6 (10, 0.0) | 0.1 (10, 0.1) | -0.5 (-83.4 %) within budget |
| open-folder.cold.directory-tree-ms | 16.3 (10, 0.3) | 17.5 (10, 0.2) | +1.2 (+7.4 %) within budget |
| open-folder.cold.exif-files | 314 (10, 0.0) | 314 (10, 0.0) | +0.0 (+0.0 %) same |
| open-folder.cold.exif-max-file-ms | 23.5 (10, 0.4) | 23.7 (10, 0.6) | +0.2 (+0.9 %) |
| open-folder.cold.exif-parse-sum-ms | 82.4 (10, 2.0) | 83.2 (10, 4.2) | +0.8 (+1.0 %) |
| open-folder.cold.exif-read-sum-ms | 229 (10, 4.5) | 234 (10, 10.2) | +4.9 (+2.1 %) |
| open-folder.cold.exif-rotate-sum-ms | 4783 (10, 6.3) | 4765 (10, 14.2) | -18.5 (-0.4 %) |
| open-folder.cold.exif-thumbnail-sum-ms | 50.2 (10, 1.9) | 53.9 (10, 2.9) | +3.7 (+7.4 %) |
| open-folder.cold.finish-ms | 111 (10, 0.6) | 111 (10, 0.7) | -0.8 (-0.7 %) within budget |
| open-folder.cold.main-event-loop-max-ms | 22.6 (10, 4.1) | 21.4 (10, 1.8) | -1.3 (-5.5 %) within budget |
| open-folder.cold.main-event-loop-p99-ms | 19.0 (10, 1.0) | 18.3 (10, 0.8) | -0.7 (-3.6 %) within budget |
| open-folder.cold.peak-tree-delta-kb | 2706680 (10, 316304) | 2454176 (10, 87832) | -252504 (-9.3 %) within budget |
| open-folder.cold.peak-tree-rss-kb | 3445680 (10, 320128) | 3198432 (10, 81328) | -247248 (-7.2 %) within budget |
| open-folder.cold.photo-data-ms | 517 (10, 0.2) | 516 (10, 0.4) | -0.9 (-0.2 %) within budget |
| open-folder.cold.renderer-longtask-max-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.cold.renderer-longtask-total-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.cold.renderer-longtasks | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.cold.renderer-max-frame-gap-ms | 56.3 (10, 5.0) | 45.4 (10, 8.1) | -11.0 (-19.5 %) within budget |
| open-folder.cold.settled-main-ws-kb | 227296 (10, 13560) | 184736 (10, 11120) | -42560 (-18.7 %) within budget |
| open-folder.cold.settled-renderer-ws-kb | 286264 (10, 12248) | 243616 (10, 9272) | -42648 (-14.9 %) within budget |
| open-folder.cold.settled-tree-rss-kb | 676208 (10, 26000) | 589688 (10, 27864) | -86520 (-12.8 %) within budget |
| open-folder.cold.start-to-complete-ms | 644 (10, 1.1) | 644 (10, 1.2) | +0.6 (+0.1 %) within budget |
| open-folder.cold.start-to-markers-ms | 1662 (10, 1.1) | 1664 (10, 3.3) | +2.0 (+0.1 %) within budget |
| open-folder.cold.start-to-thumbnails-done-ms | 5644 (10, 1.0) | 5645 (10, 1.2) | +1.0 (+0.0 %) within budget |
| open-folder.cold.thumbnails-main-ms | 2013 (10, 54.8) | 1989 (10, 42.8) | -24.2 (-1.2 %) within budget |
| open-folder.warm.click-to-complete-ms | 684 (10, 3.7) | 684 (10, 1.5) | -0.3 (-0.0 %) within budget |
| open-folder.warm.click-to-dialog-ms | 33.8 (10, 2.3) | 34.0 (10, 2.2) | +0.3 (+0.7 %) within budget |
| open-folder.warm.dialog-ms | 0.4 (10, 0.0) | 0.4 (10, 0.1) | +0.0 (+12.4 %) within budget |
| open-folder.warm.dialog-to-start-ms | 0.3 (10, 0.1) | 0.1 (10, 0.1) | -0.2 (-66.6 %) within budget |
| open-folder.warm.directory-tree-ms | 17.8 (10, 0.5) | 17.9 (10, 0.2) | +0.2 (+1.1 %) within budget |
| open-folder.warm.exif-files | 314 (10, 0.0) | 314 (10, 0.0) | +0.0 (+0.0 %) same |
| open-folder.warm.exif-max-file-ms | 37.3 (10, 1.2) | 35.4 (10, 4.4) | -2.0 (-5.4 %) |
| open-folder.warm.exif-parse-sum-ms | 62.9 (10, 1.4) | 67.1 (10, 5.1) | +4.2 (+6.8 %) |
| open-folder.warm.exif-read-sum-ms | 204 (10, 2.4) | 212 (10, 11.0) | +7.8 (+3.8 %) |
| open-folder.warm.exif-rotate-sum-ms | 4967 (10, 28.1) | 4876 (10, 29.9) | -90.8 (-1.8 %) |
| open-folder.warm.exif-thumbnail-sum-ms | 48.2 (10, 1.4) | 52.0 (10, 2.8) | +3.8 (+7.8 %) |
| open-folder.warm.finish-ms | 110 (10, 0.4) | 110 (10, 0.7) | -0.0 (-0.0 %) within budget |
| open-folder.warm.main-event-loop-max-ms | 12.5 (10, 0.2) | 12.6 (10, 0.1) | +0.1 (+1.0 %) within budget |
| open-folder.warm.main-event-loop-p99-ms | 12.3 (10, 0.1) | 12.3 (10, 0.1) | +0.0 (+0.3 %) within budget |
| open-folder.warm.peak-tree-delta-kb | 130832 (10, 21056) | 163016 (10, 14792) | +32184 (+24.6 %) within budget |
| open-folder.warm.peak-tree-rss-kb | 810520 (10, 6488) | 750896 (10, 18448) | -59624 (-7.4 %) within budget |
| open-folder.warm.photo-data-ms | 531 (10, 2.7) | 519 (10, 1.8) | -12.4 (-2.3 %) within budget |
| open-folder.warm.renderer-longtask-max-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.warm.renderer-longtask-total-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.warm.renderer-longtasks | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.warm.renderer-max-frame-gap-ms | 73.5 (10, 2.7) | 66.9 (10, 9.0) | -6.6 (-8.9 %) within budget |
| open-folder.warm.settled-main-ws-kb | 249240 (10, 7304) | 221488 (10, 6712) | -27752 (-11.1 %) within budget |
| open-folder.warm.settled-renderer-ws-kb | 353040 (10, 8080) | 332464 (10, 8296) | -20576 (-5.8 %) within budget |
| open-folder.warm.settled-tree-rss-kb | 808216 (10, 6032) | 746784 (10, 18272) | -61432 (-7.6 %) within budget |
| open-folder.warm.start-to-complete-ms | 659 (10, 2.9) | 649 (10, 2.9) | -9.9 (-1.5 %) within budget |
| settings.restart.click-to-exit-ms | 132 (10, 5.5) | 128 (10, 4.5) | -4.0 (-3.0 %) within budget |
| settings.restart.click-to-home-rendered-ms | 482 (10, 7.7) | 482 (10, 5.1) | -0.5 (-0.1 %) within budget |
| settings.restart.click-to-process-started-ms | 160 (10, 5.1) | 156 (10, 5.0) | -4.1 (-2.5 %) within budget |
| settings.restart.process-to-home-rendered-ms | 328 (10, 3.9) | 325 (10, 3.4) | -3.1 (-0.9 %) within budget |
| settings.save.click-to-closed-ms | 108 (10, 1.1) | 108 (10, 2.6) | +0.6 (+0.5 %) within budget |
| settings.save.click-to-persisted-ms | 108 (10, 1.0) | 109 (10, 2.5) | +1.0 (+0.9 %) within budget |
| startup.cold.bootstrap-done-ms | 385 (10, 3.4) | 387 (10, 11.3) | +2.3 (+0.6 %) within budget |
| startup.cold.bootstrap-start-ms | 367 (10, 3.4) | 370 (10, 10.8) | +3.0 (+0.8 %) within budget |
| startup.cold.close-ms | 48.0 (10, 2.0) | 46.0 (10, 3.0) | -2.0 (-4.2 %) within budget |
| startup.cold.create-window-ms | 166 (10, 2.2) | 168 (10, 4.0) | +2.1 (+1.3 %) within budget |
| startup.cold.did-finish-load-ms | 368 (10, 3.4) | 371 (10, 10.9) | +3.1 (+0.8 %) within budget |
| startup.cold.home-rendered-ms | 399 (10, 3.7) | 400 (10, 11.0) | +0.4 (+0.1 %) within budget |
| startup.cold.navigation-start-ms | 251 (10, 1.7) | 255 (10, 4.9) | +3.5 (+1.4 %) within budget |
| startup.cold.process-started-ms | 30.1 (10, 0.6) | 32.4 (10, 0.6) | +2.2 (+7.5 %) within budget |
| startup.cold.ready-to-show-ms | 398 (10, 7.4) | 400 (10, 12.8) | +1.5 (+0.4 %) within budget |
| startup.cold.renderer-bootstrap-ms | 17.3 (10, 1.2) | 17.4 (10, 1.8) | +0.1 (+0.9 %) within budget |
| startup.cold.renderer-modules-ms | 117 (10, 1.5) | 114 (10, 2.6) | -2.1 (-1.8 %) within budget |
| startup.cold.settled-main-ws-kb | 200608 (10, 96.0) | 200752 (10, 120) | +144 (+0.1 %) within budget |
| startup.cold.settled-renderer-ws-kb | 318536 (10, 416) | 318328 (10, 816) | -208 (-0.1 %) within budget |
| startup.cold.settled-tree-rss-kb | 733304 (10, 6528) | 733600 (10, 3440) | +296 (+0.0 %) within budget |
| startup.cold.window-created-ms | 206 (10, 2.0) | 208 (10, 3.5) | +2.1 (+1.0 %) within budget |
| startup.warm.bootstrap-done-ms | 349 (10, 3.6) | 346 (10, 3.2) | -2.3 (-0.7 %) within budget |
| startup.warm.bootstrap-start-ms | 337 (10, 3.0) | 335 (10, 2.2) | -2.3 (-0.7 %) within budget |
| startup.warm.close-ms | 38.0 (10, 2.5) | 42.0 (10, 4.5) | +4.0 (+10.5 %) within budget |
| startup.warm.create-window-ms | 166 (10, 1.9) | 165 (10, 2.8) | -1.4 (-0.9 %) within budget |
| startup.warm.did-finish-load-ms | 338 (10, 3.0) | 336 (10, 2.3) | -2.3 (-0.7 %) within budget |
| startup.warm.home-rendered-ms | 363 (10, 3.4) | 361 (10, 3.2) | -2.3 (-0.6 %) within budget |
| startup.warm.navigation-start-ms | 251 (10, 2.7) | 249 (10, 1.8) | -2.3 (-0.9 %) within budget |
| startup.warm.process-started-ms | 30.4 (10, 0.7) | 29.7 (10, 1.0) | -0.6 (-2.1 %) within budget |
| startup.warm.ready-to-show-ms | 364 (10, 5.9) | 363 (10, 2.5) | -0.2 (-0.1 %) within budget |
| startup.warm.renderer-bootstrap-ms | 12.4 (10, 1.6) | 10.9 (10, 0.8) | -1.5 (-12.1 %) within budget |
| startup.warm.renderer-modules-ms | 86.6 (10, 1.1) | 85.8 (10, 0.8) | -0.7 (-0.8 %) within budget |
| startup.warm.settled-main-ws-kb | 205064 (10, 88.0) | 204776 (10, 112) | -288 (-0.1 %) within budget |
| startup.warm.settled-renderer-ws-kb | 252680 (10, 3112) | 254512 (10, 2384) | +1832 (+0.7 %) within budget |
| startup.warm.settled-tree-rss-kb | 619648 (10, 5744) | 622192 (10, 1568) | +2544 (+0.4 %) within budget |
| startup.warm.window-created-ms | 207 (10, 2.0) | 205 (10, 3.0) | -1.6 (-0.8 %) within budget |
| view-data.cycles.retained-tree-kb | -56808 (10, 2120) | -53912 (10, 1680) | +2896 (-5.1 %) within budget |
| view-data.heic.after-close-tree-delta-kb | -57864 (10, 1760) | -57160 (10, 1280) | +704 (-1.2 %) within budget |
| view-data.heic.launch-to-window-created-ms | 9.4 (10, 0.2) | 9.4 (10, 0.3) | -0.1 (-0.5 %) within budget |
| view-data.heic.menu-to-request-ms | 36.3 (10, 2.2) | 36.5 (10, 1.8) | +0.2 (+0.6 %) within budget |
| view-data.heic.open-tree-delta-kb | 487800 (10, 1816) | 488872 (10, 1256) | +1072 (+0.2 %) within budget |
| view-data.heic.peak-tree-delta-kb | 489288 (10, 1736) | 490288 (10, 1208) | +1000 (+0.2 %) within budget |
| view-data.heic.request-to-image-ms | 564 (10, 0.7) | 565 (10, 1.4) | +1.1 (+0.2 %) within budget |
| view-data.heic.request-to-launch-ms | 0.2 (10, 0.0) | 0.3 (10, 0.1) | +0.0 (+18.3 %) within budget |
| view-data.heic.request-to-metadata-ms | 565 (10, 0.8) | 566 (10, 1.5) | +1.3 (+0.2 %) within budget |
| view-data.heic.request-to-page-loaded-ms | 87.5 (10, 0.6) | 87.5 (10, 1.5) | -0.0 (-0.0 %) within budget |
| view-data.heic.window-created-to-page-loaded-ms | 77.6 (10, 0.6) | 77.6 (10, 1.4) | +0.0 (+0.0 %) within budget |
| view-data.jpeg-first.after-close-tree-delta-kb | -115744 (10, 904) | -114960 (10, 560) | +784 (-0.7 %) within budget |
| view-data.jpeg-first.launch-to-window-created-ms | 18.6 (10, 0.8) | 14.7 (10, 1.5) | -3.9 (-20.8 %) within budget |
| view-data.jpeg-first.menu-to-request-ms | 29.2 (10, 2.2) | 31.3 (10, 4.6) | +2.1 (+7.0 %) within budget |
| view-data.jpeg-first.open-tree-delta-kb | 234448 (10, 4552) | 236032 (10, 7176) | +1584 (+0.7 %) within budget |
| view-data.jpeg-first.peak-tree-delta-kb | 248264 (10, 4016) | 252480 (10, 4392) | +4216 (+1.7 %) within budget |
| view-data.jpeg-first.request-to-image-ms | 656 (10, 7.1) | 650 (10, 3.5) | -5.4 (-0.8 %) within budget |
| view-data.jpeg-first.request-to-launch-ms | 0.3 (10, 0.0) | 0.3 (10, 0.1) | +0.0 (+8.1 %) within budget |
| view-data.jpeg-first.request-to-metadata-ms | 659 (10, 6.5) | 655 (10, 6.0) | -4.2 (-0.6 %) within budget |
| view-data.jpeg-first.request-to-page-loaded-ms | 119 (10, 1.8) | 116 (10, 3.1) | -3.4 (-2.8 %) within budget |
| view-data.jpeg-first.window-created-to-page-loaded-ms | 100 (10, 1.1) | 100 (10, 3.6) | -0.1 (-0.1 %) within budget |
| view-data.jpeg.after-close-tree-delta-kb | -46920 (10, 1416) | -44064 (10, 608) | +2856 (-6.1 %) within budget |
| view-data.jpeg.launch-to-window-created-ms | 9.4 (10, 0.2) | 9.3 (10, 0.3) | -0.2 (-1.9 %) within budget |
| view-data.jpeg.menu-to-request-ms | 25.3 (10, 1.4) | 24.7 (10, 1.1) | -0.6 (-2.6 %) within budget |
| view-data.jpeg.open-tree-delta-kb | 291680 (10, 2000) | 292272 (10, 1504) | +592 (+0.2 %) within budget |
| view-data.jpeg.peak-tree-delta-kb | 290624 (10, 1928) | 291440 (10, 1504) | +816 (+0.3 %) within budget |
| view-data.jpeg.request-to-image-ms | 631 (10, 0.4) | 632 (10, 0.8) | +0.6 (+0.1 %) within budget |
| view-data.jpeg.request-to-launch-ms | 0.2 (10, 0.0) | 0.2 (10, 0.1) | +0.1 (+33.4 %) within budget |
| view-data.jpeg.request-to-metadata-ms | 632 (10, 0.6) | 633 (10, 0.9) | +0.3 (+0.0 %) within budget |
| view-data.jpeg.request-to-page-loaded-ms | 96.1 (10, 1.4) | 96.6 (10, 0.6) | +0.5 (+0.5 %) within budget |
| view-data.jpeg.window-created-to-page-loaded-ms | 86.0 (10, 1.1) | 86.6 (10, 0.8) | +0.5 (+0.6 %) within budget |
