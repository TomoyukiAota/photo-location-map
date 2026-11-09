# Series rer-2-C2 (protocol rer-2)

Builds: 0 (code e6a1d1e7c0b2), C1 (code 81e273306058), C2-url (code 81ae9b8e4226), C2-ipc (code 81ae9b8e4226). Baseline: 0.
Host: Apple M5, 10 cores, 32 GB, darwin 27.0.0.
Viewer: f5858a35aa41 (unchanged).
Complete: yes. Trials: {"0":{"open-folder":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"settings":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"startup":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"view-data":{"ok":10,"failed":0,"interrupted":0,"warmup":1}},"C1":{"open-folder":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"settings":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"startup":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"view-data":{"ok":10,"failed":0,"interrupted":0,"warmup":1}},"C2-ipc":{"open-folder":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"settings":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"startup":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"view-data":{"ok":10,"failed":0,"interrupted":0,"warmup":1}},"C2-url":{"open-folder":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"settings":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"startup":{"ok":10,"failed":0,"interrupted":0,"warmup":1},"view-data":{"ok":10,"failed":0,"interrupted":0,"warmup":1}}}

| Metric | 0 median (n, MAD) | C1 median (n, MAD) | C2-url median (n, MAD) | C2-ipc median (n, MAD) | C1 vs 0 | C2-url vs 0 | C2-ipc vs 0 |
| --- | ---: | ---: | ---: | ---: | --- | --- | --- |
| open-folder.cold.click-to-complete-ms | 778 (10, 8.1) | 676 (10, 2.6) | 679 (10, 4.0) | 678 (10, 4.2) | -102 (-13.1 %) improvement | -99.6 (-12.8 %) improvement | -99.8 (-12.8 %) improvement |
| open-folder.cold.click-to-dialog-ms | 29.8 (10, 3.1) | 32.4 (10, 1.9) | 34.0 (10, 2.2) | 35.1 (10, 4.8) | +2.6 (+8.7 %) within budget | +4.2 (+14.1 %) within budget | +5.2 (+17.4 %) within budget |
| open-folder.cold.dialog-ms | 1.7 (10, 0.1) | 0.4 (10, 0.1) | 0.5 (10, 0.0) | 0.4 (10, 0.0) | -1.3 (-76.5 %) within budget | -1.2 (-73.5 %) within budget | -1.3 (-76.5 %) within budget |
| open-folder.cold.dialog-to-start-ms | 0.8 (10, 0.0) | 0.1 (10, 0.0) | 0.1 (10, 0.0) | 0.1 (10, 0.0) | -0.7 (-87.5 %) within budget | -0.7 (-87.5 %) within budget | -0.7 (-87.5 %) within budget |
| open-folder.cold.directory-tree-ms | 15.1 (10, 0.4) | 8.6 (10, 0.3) | 8.7 (10, 0.3) | 9.2 (10, 0.9) | -6.5 (-43.0 %) improvement | -6.4 (-42.7 %) improvement | -5.9 (-39.1 %) improvement |
| open-folder.cold.exif-files | 314 (10, 0.0) | 314 (10, 0.0) | 314 (10, 0.0) | 314 (10, 0.0) | +0.0 (+0.0 %) same | +0.0 (+0.0 %) same | +0.0 (+0.0 %) same |
| open-folder.cold.exif-max-file-ms | 51.1 (10, 5.5) | 29.6 (10, 0.6) | 29.7 (10, 0.3) | 28.9 (10, 1.1) | -21.4 (-42.0 %) | -21.4 (-41.9 %) | -22.1 (-43.3 %) |
| open-folder.cold.exif-parse-sum-ms | 327 (10, 19.3) | 87.1 (10, 7.7) | 84.9 (10, 4.7) | 115 (10, 33.1) | -240 (-73.4 %) | -242 (-74.1 %) | -212 (-64.8 %) |
| open-folder.cold.exif-read-sum-ms | 0.0 (10, 0.0) | 261 (10, 15.6) | 260 (10, 9.8) | 283 (10, 32.6) | +261 () | +260 () | +283 () |
| open-folder.cold.exif-rotate-sum-ms | 5379 (10, 154) | 4819 (10, 19.4) | 4821 (10, 16.3) | 4796 (10, 48.6) | -560 (-10.4 %) | -558 (-10.4 %) | -583 (-10.8 %) |
| open-folder.cold.exif-thumbnail-sum-ms | 237 (10, 18.5) | 57.8 (10, 5.7) | 56.2 (10, 4.5) | 60.3 (10, 5.2) | -179 (-75.6 %) | -180 (-76.3 %) | -176 (-74.5 %) |
| open-folder.cold.finish-ms | 110 (10, 0.7) | 110 (10, 0.4) | 111 (10, 0.8) | 110 (10, 0.6) | -0.2 (-0.2 %) within budget | +0.2 (+0.2 %) within budget | -0.5 (-0.5 %) within budget |
| open-folder.cold.main-event-loop-max-ms | 22.2 (10, 1.6) | 22.8 (10, 1.0) | 21.4 (10, 2.4) | 21.9 (10, 0.9) | +0.5 (+2.5 %) within budget | -0.8 (-3.6 %) within budget | -0.3 (-1.4 %) within budget |
| open-folder.cold.main-event-loop-p99-ms | 18.7 (10, 1.0) | 20.4 (10, 0.6) | 19.3 (10, 1.3) | 18.6 (10, 1.0) | +1.6 (+8.7 %) within budget | +0.6 (+3.0 %) within budget | -0.1 (-0.7 %) within budget |
| open-folder.cold.peak-tree-delta-kb | 2517736 (10, 146800) | 2574056 (10, 136120) | 2542096 (10, 42200) | 2581384 (10, 116032) | +56320 (+2.2 %) within budget | +24360 (+1.0 %) within budget | +63648 (+2.5 %) within budget |
| open-folder.cold.peak-tree-rss-kb | 3257096 (10, 152720) | 3290968 (10, 136184) | 3271264 (10, 48696) | 3266400 (10, 80320) | +33872 (+1.0 %) within budget | +14168 (+0.4 %) within budget | +9304 (+0.3 %) within budget |
| open-folder.cold.photo-data-ms | 625 (10, 20.7) | 525 (10, 0.3) | 525 (10, 1.1) | 524 (10, 1.2) | -100 (-16.1 %) improvement | -100 (-16.0 %) improvement | -101 (-16.2 %) improvement |
| open-folder.cold.renderer-longtask-max-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget | +0.0 () within budget | +0.0 () within budget |
| open-folder.cold.renderer-longtask-total-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget | +0.0 () within budget | +0.0 () within budget |
| open-folder.cold.renderer-longtasks | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget | +0.0 () within budget | +0.0 () within budget |
| open-folder.cold.renderer-max-frame-gap-ms | 66.0 (10, 4.1) | 33.5 (10, 0.3) | 33.4 (10, 0.1) | 33.4 (10, 0.6) | -32.6 (-49.4 %) improvement | -32.6 (-49.4 %) improvement | -32.6 (-49.4 %) improvement |
| open-folder.cold.settled-main-ws-kb | 198568 (10, 11072) | 214400 (10, 24560) | 206640 (10, 17640) | 195000 (10, 16048) | +15832 (+8.0 %) within budget | +8072 (+4.1 %) within budget | -3568 (-1.8 %) within budget |
| open-folder.cold.settled-renderer-ws-kb | 265928 (10, 9296) | 258048 (10, 17784) | 245312 (10, 13224) | 242968 (10, 12656) | -7880 (-3.0 %) within budget | -20616 (-7.8 %) within budget | -22960 (-8.6 %) within budget |
| open-folder.cold.settled-tree-rss-kb | 619120 (10, 19768) | 634472 (10, 52840) | 613208 (10, 36128) | 600976 (10, 34776) | +15352 (+2.5 %) within budget | -5912 (-1.0 %) within budget | -18144 (-2.9 %) within budget |
| open-folder.cold.start-to-complete-ms | 751 (10, 23.7) | 643 (10, 1.0) | 644 (10, 0.9) | 643 (10, 0.5) | -108 (-14.4 %) improvement | -107 (-14.2 %) improvement | -108 (-14.3 %) improvement |
| open-folder.cold.start-to-markers-ms | 1768 (10, 17.3) | 1663 (10, 6.7) | 1662 (10, 3.6) | 1658 (10, 4.4) | -106 (-6.0 %) within budget | -106 (-6.0 %) within budget | -111 (-6.3 %) within budget |
| open-folder.cold.start-to-thumbnails-done-ms | 5749 (10, 23.9) | 5641 (10, 0.9) | 5641 (10, 0.9) | 5642 (10, 1.3) | -108 (-1.9 %) within budget | -108 (-1.9 %) within budget | -107 (-1.9 %) within budget |
| open-folder.cold.thumbnails-main-ms | 2312 (10, 162) | 2192 (10, 112) | 2190 (10, 193) | 2170 (10, 104) | -120 (-5.2 %) within budget | -121 (-5.3 %) within budget | -141 (-6.1 %) within budget |
| open-folder.warm.click-to-complete-ms | 779 (10, 14.4) | 684 (10, 8.8) | 680 (10, 5.8) | 678 (10, 5.1) | -94.5 (-12.1 %) improvement | -98.8 (-12.7 %) improvement | -101 (-13.0 %) improvement |
| open-folder.warm.click-to-dialog-ms | 26.1 (10, 3.1) | 31.1 (10, 5.0) | 30.6 (10, 2.3) | 30.7 (10, 3.8) | +5.0 (+19.3 %) within budget | +4.5 (+17.2 %) within budget | +4.6 (+17.4 %) within budget |
| open-folder.warm.dialog-ms | 1.4 (10, 0.1) | 0.7 (10, 0.0) | 0.7 (10, 0.1) | 0.7 (10, 0.1) | -0.7 (-50.0 %) within budget | -0.7 (-50.0 %) within budget | -0.7 (-50.0 %) within budget |
| open-folder.warm.dialog-to-start-ms | 0.6 (10, 0.0) | 0.1 (10, 0.0) | 0.0 (10, 0.0) | 0.1 (10, 0.0) | -0.5 (-83.4 %) within budget | -0.6 (-91.7 %) within budget | -0.5 (-83.3 %) within budget |
| open-folder.warm.directory-tree-ms | 16.3 (10, 0.4) | 11.8 (10, 1.3) | 8.9 (10, 0.7) | 8.9 (10, 0.8) | -4.4 (-27.1 %) within budget | -7.3 (-44.9 %) improvement | -7.4 (-45.2 %) improvement |
| open-folder.warm.exif-files | 314 (10, 0.0) | 314 (10, 0.0) | 314 (10, 0.0) | 314 (10, 0.0) | +0.0 (+0.0 %) same | +0.0 (+0.0 %) same | +0.0 (+0.0 %) same |
| open-folder.warm.exif-max-file-ms | 42.3 (10, 5.6) | 29.8 (10, 3.6) | 33.2 (10, 2.8) | 31.1 (10, 2.5) | -12.5 (-29.6 %) | -9.1 (-21.6 %) | -11.1 (-26.4 %) |
| open-folder.warm.exif-parse-sum-ms | 230 (10, 17.2) | 69.8 (10, 9.8) | 82.9 (10, 18.2) | 68.3 (10, 9.8) | -160 (-69.6 %) | -147 (-63.9 %) | -162 (-70.3 %) |
| open-folder.warm.exif-read-sum-ms | 0.0 (10, 0.0) | 235 (10, 24.9) | 243 (10, 22.4) | 225 (10, 17.5) | +235 () | +243 () | +225 () |
| open-folder.warm.exif-rotate-sum-ms | 5531 (10, 151) | 4900 (10, 48.1) | 4927 (10, 54.2) | 4930 (10, 33.7) | -631 (-11.4 %) | -604 (-10.9 %) | -601 (-10.9 %) |
| open-folder.warm.exif-thumbnail-sum-ms | 224 (10, 12.8) | 62.3 (10, 8.6) | 63.2 (10, 13.2) | 53.8 (10, 4.9) | -162 (-72.2 %) | -161 (-71.8 %) | -170 (-76.0 %) |
| open-folder.warm.finish-ms | 109 (10, 0.7) | 109 (10, 0.6) | 108 (10, 0.3) | 109 (10, 0.5) | -0.7 (-0.6 %) within budget | -0.8 (-0.7 %) within budget | -0.3 (-0.3 %) within budget |
| open-folder.warm.main-event-loop-max-ms | 12.2 (10, 0.5) | 12.4 (10, 0.6) | 12.3 (10, 0.7) | 12.6 (10, 0.4) | +0.1 (+1.1 %) within budget | +0.1 (+1.0 %) within budget | +0.3 (+2.7 %) within budget |
| open-folder.warm.main-event-loop-p99-ms | 12.1 (10, 0.4) | 12.3 (10, 0.5) | 12.1 (10, 0.5) | 12.0 (10, 0.5) | +0.2 (+1.6 %) within budget | +0.0 (+0.4 %) within budget | -0.1 (-1.2 %) within budget |
| open-folder.warm.peak-tree-delta-kb | 123864 (10, 19648) | 119832 (10, 15416) | 128496 (10, 9048) | 129520 (10, 10352) | -4032 (-3.3 %) within budget | +4632 (+3.7 %) within budget | +5656 (+4.6 %) within budget |
| open-folder.warm.peak-tree-rss-kb | 744736 (10, 7824) | 750328 (10, 29696) | 736752 (10, 25120) | 714280 (10, 23616) | +5592 (+0.8 %) within budget | -7984 (-1.1 %) within budget | -30456 (-4.1 %) within budget |
| open-folder.warm.photo-data-ms | 624 (10, 13.9) | 528 (10, 6.5) | 528 (10, 2.2) | 527 (10, 0.8) | -95.6 (-15.3 %) improvement | -96.2 (-15.4 %) improvement | -96.6 (-15.5 %) improvement |
| open-folder.warm.renderer-longtask-max-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget | +0.0 () within budget | +0.0 () within budget |
| open-folder.warm.renderer-longtask-total-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget | +0.0 () within budget | +0.0 () within budget |
| open-folder.warm.renderer-longtasks | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget | +0.0 () within budget | +0.0 () within budget |
| open-folder.warm.renderer-max-frame-gap-ms | 74.9 (10, 7.0) | 18.9 (10, 1.4) | 19.5 (10, 1.7) | 23.2 (10, 4.1) | -56.1 (-74.8 %) improvement | -55.4 (-74.0 %) improvement | -51.7 (-69.0 %) improvement |
| open-folder.warm.settled-main-ws-kb | 233992 (10, 3600) | 243032 (10, 13280) | 238240 (10, 12896) | 229216 (10, 6976) | +9040 (+3.9 %) within budget | +4248 (+1.8 %) within budget | -4776 (-2.0 %) within budget |
| open-folder.warm.settled-renderer-ws-kb | 325024 (10, 3320) | 312216 (10, 8536) | 303816 (10, 7048) | 294856 (10, 7752) | -12808 (-3.9 %) within budget | -21208 (-6.5 %) within budget | -30168 (-9.3 %) within budget |
| open-folder.warm.settled-tree-rss-kb | 746072 (10, 8136) | 747736 (10, 25024) | 732832 (10, 26216) | 709776 (10, 20432) | +1664 (+0.2 %) within budget | -13240 (-1.8 %) within budget | -36296 (-4.9 %) within budget |
| open-folder.warm.start-to-complete-ms | 749 (10, 14.1) | 645 (10, 1.8) | 645 (10, 2.6) | 645 (10, 1.5) | -104 (-13.9 %) improvement | -104 (-13.9 %) improvement | -104 (-13.9 %) improvement |
| settings.restart.click-to-exit-ms | 135 (10, 7.0) | 129 (10, 10.0) | 127 (10, 9.0) | 131 (10, 10.0) | -5.5 (-4.1 %) within budget | -8.0 (-5.9 %) within budget | -3.5 (-2.6 %) within budget |
| settings.restart.click-to-home-rendered-ms | 547 (10, 21.5) | 482 (10, 7.6) | 481 (10, 15.0) | 467 (10, 17.9) | -64.6 (-11.8 %) within budget | -65.3 (-11.9 %) within budget | -79.9 (-14.6 %) within budget |
| settings.restart.click-to-process-started-ms | 164 (10, 5.5) | 159 (10, 11.7) | 155 (10, 9.4) | 163 (10, 10.1) | -4.3 (-2.7 %) within budget | -8.2 (-5.0 %) within budget | -1.0 (-0.6 %) within budget |
| settings.restart.process-to-home-rendered-ms | 379 (10, 17.7) | 320 (10, 19.1) | 333 (10, 14.8) | 315 (10, 19.6) | -59.7 (-15.7 %) within budget | -46.7 (-12.3 %) within budget | -64.0 (-16.9 %) within budget |
| settings.save.click-to-closed-ms | 109 (10, 1.2) | 110 (10, 2.1) | 113 (10, 0.8) | 113 (10, 0.4) | +0.9 (+0.8 %) within budget | +4.5 (+4.1 %) within budget | +4.4 (+4.1 %) within budget |
| settings.save.click-to-persisted-ms | 109 (10, 1.0) | 110 (10, 2.0) | 113 (10, 0.5) | 114 (10, 0.5) | +1.0 (+0.9 %) within budget | +4.0 (+3.7 %) within budget | +5.0 (+4.6 %) within budget |
| startup.cold.bootstrap-done-ms | 563 (10, 131) | 604 (10, 79.5) | 461 (10, 75.7) | 402 (10, 13.7) | +41.3 (+7.3 %) within budget | -102 (-18.2 %) within budget | -161 (-28.6 %) within budget |
| startup.cold.bootstrap-start-ms | 536 (10, 125) | 572 (10, 70.2) | 435 (10, 74.2) | 378 (10, 9.7) | +35.6 (+6.6 %) within budget | -101 (-18.9 %) within budget | -158 (-29.5 %) within budget |
| startup.cold.close-ms | 50.0 (10, 5.5) | 50.5 (10, 5.5) | 46.5 (10, 3.0) | 45.0 (10, 5.0) | +0.5 (+1.0 %) within budget | -3.5 (-7.0 %) within budget | -5.0 (-10.0 %) within budget |
| startup.cold.create-window-ms | 275 (10, 87.2) | 352 (10, 25.7) | 207 (10, 40.7) | 186 (10, 8.3) | +77.0 (+27.9 %) within budget | -68.9 (-25.0 %) within budget | -89.7 (-32.6 %) within budget |
| startup.cold.did-finish-load-ms | 537 (10, 125) | 486 (10, 57.1) | 324 (10, 78.8) | 276 (10, 6.9) | -50.8 (-9.5 %) within budget | -214 (-39.8 %) within budget | -261 (-48.6 %) within budget |
| startup.cold.home-rendered-ms | 580 (10, 133) | 619 (10, 82.8) | 474 (10, 76.4) | 414 (10, 13.7) | +38.6 (+6.7 %) within budget | -106 (-18.3 %) within budget | -166 (-28.7 %) within budget |
| startup.cold.navigation-start-ms | 389 (10, 105) | 425 (10, 48.4) | 292 (10, 75.3) | 241 (10, 8.3) | +35.9 (+9.2 %) within budget | -96.8 (-24.9 %) within budget | -148 (-38.0 %) within budget |
| startup.cold.process-started-ms | 39.6 (10, 8.8) | 42.8 (10, 2.2) | 33.7 (10, 4.2) | 31.1 (10, 1.2) | +3.2 (+8.1 %) within budget | -5.8 (-14.8 %) within budget | -8.5 (-21.4 %) within budget |
| startup.cold.ready-to-show-ms | 543 (10, 128) | 488 (10, 57.4) | 325 (10, 75.2) | 279 (10, 10.3) | -54.4 (-10.0 %) within budget | -218 (-40.2 %) within budget | -264 (-48.6 %) within budget |
| startup.cold.renderer-bootstrap-ms | 26.9 (10, 4.7) | 32.7 (10, 5.7) | 26.6 (10, 3.3) | 24.2 (10, 1.2) | +5.8 (+21.3 %) within budget | -0.3 (-1.3 %) within budget | -2.8 (-10.4 %) within budget |
| startup.cold.renderer-modules-ms | 146 (10, 17.2) | 147 (10, 14.6) | 134 (10, 12.7) | 133 (10, 3.7) | +0.6 (+0.4 %) within budget | -11.9 (-8.2 %) within budget | -13.7 (-9.4 %) within budget |
| startup.cold.settled-main-ws-kb | 201048 (10, 96.0) | 210592 (10, 88.0) | 210592 (10, 128) | 210624 (10, 208) | +9544 (+4.7 %) within budget | +9544 (+4.7 %) within budget | +9576 (+4.8 %) within budget |
| startup.cold.settled-renderer-ws-kb | 317576 (10, 928) | 294424 (10, 784) | 294136 (10, 376) | 293656 (10, 448) | -23152 (-7.3 %) within budget | -23440 (-7.4 %) within budget | -23920 (-7.5 %) within budget |
| startup.cold.settled-tree-rss-kb | 743848 (10, 1624) | 717240 (10, 1680) | 716848 (10, 1008) | 715520 (10, 3160) | -26608 (-3.6 %) within budget | -27000 (-3.6 %) within budget | -28328 (-3.8 %) within budget |
| startup.cold.window-created-ms | 327 (10, 91.0) | 410 (10, 30.4) | 264 (10, 57.7) | 231 (10, 9.0) | +82.3 (+25.1 %) within budget | -63.9 (-19.5 %) within budget | -96.5 (-29.5 %) within budget |
| startup.warm.bootstrap-done-ms | 393 (10, 29.1) | 367 (10, 24.8) | 378 (10, 27.3) | 358 (10, 20.1) | -26.5 (-6.7 %) within budget | -15.0 (-3.8 %) within budget | -34.8 (-8.8 %) within budget |
| startup.warm.bootstrap-start-ms | 378 (10, 27.6) | 346 (10, 23.3) | 359 (10, 27.1) | 338 (10, 19.3) | -32.7 (-8.6 %) within budget | -19.5 (-5.2 %) within budget | -40.7 (-10.7 %) within budget |
| startup.warm.close-ms | 46.0 (10, 5.0) | 45.0 (10, 2.0) | 48.5 (10, 3.0) | 45.0 (10, 7.5) | -1.0 (-2.2 %) within budget | +2.5 (+5.4 %) within budget | -1.0 (-2.2 %) within budget |
| startup.warm.create-window-ms | 186 (10, 18.0) | 188 (10, 12.6) | 196 (10, 12.0) | 188 (10, 13.4) | +2.2 (+1.2 %) within budget | +10.5 (+5.7 %) within budget | +1.9 (+1.0 %) within budget |
| startup.warm.did-finish-load-ms | 379 (10, 27.6) | 279 (10, 19.9) | 291 (10, 20.6) | 272 (10, 15.3) | -100 (-26.4 %) within budget | -88.4 (-23.3 %) within budget | -107 (-28.3 %) within budget |
| startup.warm.home-rendered-ms | 408 (10, 30.3) | 382 (10, 26.4) | 393 (10, 28.3) | 374 (10, 20.8) | -25.9 (-6.4 %) within budget | -14.9 (-3.6 %) within budget | -34.3 (-8.4 %) within budget |
| startup.warm.navigation-start-ms | 281 (10, 23.3) | 245 (10, 20.3) | 257 (10, 21.7) | 238 (10, 14.2) | -37.0 (-13.1 %) within budget | -24.3 (-8.6 %) within budget | -44.0 (-15.6 %) within budget |
| startup.warm.process-started-ms | 30.8 (10, 0.5) | 30.4 (10, 1.2) | 32.4 (10, 1.0) | 30.5 (10, 1.2) | -0.4 (-1.2 %) within budget | +1.6 (+5.4 %) within budget | -0.3 (-1.0 %) within budget |
| startup.warm.ready-to-show-ms | 409 (10, 25.3) | 283 (10, 23.6) | 295 (10, 20.8) | 275 (10, 13.4) | -126 (-30.9 %) improvement | -114 (-28.0 %) improvement | -134 (-32.7 %) improvement |
| startup.warm.renderer-bootstrap-ms | 14.9 (10, 0.4) | 20.3 (10, 1.9) | 20.3 (10, 0.7) | 20.8 (10, 1.2) | +5.3 (+35.5 %) REGRESSION | +5.3 (+35.5 %) REGRESSION | +5.8 (+38.8 %) REGRESSION |
| startup.warm.renderer-modules-ms | 94.4 (10, 3.3) | 101 (10, 3.3) | 105 (10, 9.2) | 98.3 (10, 3.9) | +6.6 (+7.0 %) within budget | +10.2 (+10.9 %) within budget | +3.9 (+4.1 %) within budget |
| startup.warm.settled-main-ws-kb | 205400 (10, 112) | 215040 (10, 160) | 215176 (10, 120) | 215016 (10, 160) | +9640 (+4.7 %) within budget | +9776 (+4.8 %) within budget | +9616 (+4.7 %) within budget |
| startup.warm.settled-renderer-ws-kb | 256656 (10, 1976) | 225656 (10, 512) | 230424 (10, 1104) | 228128 (10, 2384) | -31000 (-12.1 %) improvement | -26232 (-10.2 %) improvement | -28528 (-11.1 %) improvement |
| startup.warm.settled-tree-rss-kb | 621528 (10, 2024) | 595728 (10, 848) | 602024 (10, 5024) | 597368 (10, 2112) | -25800 (-4.2 %) within budget | -19504 (-3.1 %) within budget | -24160 (-3.9 %) within budget |
| startup.warm.window-created-ms | 232 (10, 19.5) | 240 (10, 18.0) | 245 (10, 17.8) | 234 (10, 13.1) | +7.9 (+3.4 %) within budget | +12.8 (+5.5 %) within budget | +2.3 (+1.0 %) within budget |
| view-data.cycles.retained-tree-kb | -51720 (10, 10576) | -54648 (10, 9224) | -53120 (10, 8656) | -53576 (10, 16424) | -2928 (+5.7 %) within budget | -1400 (+2.7 %) within budget | -1856 (+3.6 %) within budget |
| view-data.heic.after-close-tree-delta-kb | -61768 (10, 6512) | -59464 (10, 4584) | -59232 (10, 3440) | -57912 (10, 2552) | +2304 (-3.7 %) within budget | +2536 (-4.1 %) within budget | +3856 (-6.2 %) within budget |
| view-data.heic.launch-to-window-created-ms | 12.9 (10, 2.6) | 13.0 (10, 1.2) | 12.8 (10, 3.0) | 11.2 (10, 2.9) | +0.1 (+0.8 %) within budget | -0.2 (-1.4 %) within budget | -1.7 (-13.4 %) within budget |
| view-data.heic.menu-to-request-ms | 35.7 (10, 1.6) | 35.1 (10, 1.6) | 34.3 (10, 1.4) | 36.3 (10, 1.2) | -0.6 (-1.7 %) within budget | -1.4 (-3.9 %) within budget | +0.6 (+1.7 %) within budget |
| view-data.heic.open-tree-delta-kb | 487288 (10, 17512) | 481784 (10, 15312) | 374344 (10, 1896) | 373488 (10, 3176) | -5504 (-1.1 %) within budget | -112944 (-23.2 %) improvement | -113800 (-23.4 %) improvement |
| view-data.heic.peak-tree-delta-kb | 490248 (10, 15384) | 487296 (10, 2912) | 472312 (10, 2176) | 474120 (10, 2568) | -2952 (-0.6 %) within budget | -17936 (-3.7 %) within budget | -16128 (-3.3 %) within budget |
| view-data.heic.request-to-image-ms | 597 (10, 32.3) | 598 (10, 17.6) | 606 (10, 25.0) | 589 (10, 23.8) | +0.5 (+0.1 %) within budget | +8.9 (+1.5 %) within budget | -7.8 (-1.3 %) within budget |
| view-data.heic.request-to-launch-ms | 0.2 (10, 0.1) | 0.2 (10, 0.0) | 0.3 (10, 0.0) | 0.3 (10, 0.1) | -0.0 (-4.5 %) within budget | +0.0 (+9.2 %) within budget | +0.1 (+23.2 %) within budget |
| view-data.heic.request-to-metadata-ms | 598 (10, 32.3) | 600 (10, 17.8) | 608 (10, 25.3) | 591 (10, 24.0) | +1.1 (+0.2 %) within budget | +9.4 (+1.6 %) within budget | -7.7 (-1.3 %) within budget |
| view-data.heic.request-to-page-loaded-ms | 101 (10, 8.2) | 103 (10, 8.6) | 93.6 (10, 4.4) | 88.3 (10, 2.3) | +2.2 (+2.2 %) within budget | -7.5 (-7.5 %) within budget | -12.8 (-12.7 %) within budget |
| view-data.heic.window-created-to-page-loaded-ms | 91.0 (10, 6.9) | 92.0 (10, 9.4) | 78.7 (10, 4.5) | 74.5 (10, 5.3) | +1.0 (+1.1 %) within budget | -12.2 (-13.5 %) within budget | -16.5 (-18.1 %) within budget |
| view-data.jpeg-first.after-close-tree-delta-kb | -113944 (10, 1128) | -112208 (10, 1840) | -99536 (10, 7984) | -108680 (10, 1752) | +1736 (-1.5 %) within budget | +14408 (-12.6 %) within budget | +5264 (-4.6 %) within budget |
| view-data.jpeg-first.launch-to-window-created-ms | 20.5 (10, 1.7) | 21.2 (10, 2.6) | 20.4 (10, 3.5) | 19.5 (10, 3.5) | +0.7 (+3.4 %) within budget | -0.0 (-0.2 %) within budget | -0.9 (-4.6 %) within budget |
| view-data.jpeg-first.menu-to-request-ms | 31.6 (10, 4.6) | 31.8 (10, 3.2) | 33.0 (10, 4.9) | 31.5 (10, 3.7) | +0.2 (+0.5 %) within budget | +1.4 (+4.3 %) within budget | -0.1 (-0.5 %) within budget |
| view-data.jpeg-first.open-tree-delta-kb | 247088 (10, 8928) | 249240 (10, 12712) | 236240 (10, 8856) | 232072 (10, 10360) | +2152 (+0.9 %) within budget | -10848 (-4.4 %) within budget | -15016 (-6.1 %) within budget |
| view-data.jpeg-first.peak-tree-delta-kb | 262440 (10, 4280) | 266704 (10, 9064) | 255584 (10, 3160) | 244656 (10, 8168) | +4264 (+1.6 %) within budget | -6856 (-2.6 %) within budget | -17784 (-6.8 %) within budget |
| view-data.jpeg-first.request-to-image-ms | 664 (10, 5.3) | 674 (10, 7.4) | 680 (10, 6.4) | 664 (10, 7.7) | +10.0 (+1.5 %) within budget | +16.3 (+2.5 %) within budget | +0.5 (+0.1 %) within budget |
| view-data.jpeg-first.request-to-launch-ms | 0.3 (10, 0.1) | 0.3 (10, 0.1) | 0.3 (10, 0.0) | 0.3 (10, 0.0) | -0.0 (-2.4 %) within budget | +0.0 (+16.9 %) within budget | +0.1 (+18.1 %) within budget |
| view-data.jpeg-first.request-to-metadata-ms | 665 (10, 4.9) | 678 (10, 8.1) | 682 (10, 7.7) | 666 (10, 7.7) | +12.3 (+1.8 %) within budget | +16.6 (+2.5 %) within budget | +0.6 (+0.1 %) within budget |
| view-data.jpeg-first.request-to-page-loaded-ms | 125 (10, 4.2) | 135 (10, 3.9) | 116 (10, 5.7) | 114 (10, 8.2) | +9.8 (+7.8 %) within budget | -8.6 (-6.9 %) within budget | -11.3 (-9.0 %) within budget |
| view-data.jpeg-first.window-created-to-page-loaded-ms | 105 (10, 3.7) | 116 (10, 9.2) | 93.3 (10, 5.6) | 92.8 (10, 5.4) | +11.2 (+10.7 %) within budget | -11.2 (-10.7 %) within budget | -11.7 (-11.2 %) within budget |
| view-data.jpeg.after-close-tree-delta-kb | -46400 (10, 560) | -45592 (10, 2368) | -36512 (10, 6072) | -41080 (10, 2104) | +808 (-1.7 %) within budget | +9888 (-21.3 %) within budget | +5320 (-11.5 %) within budget |
| view-data.jpeg.launch-to-window-created-ms | 14.2 (10, 1.6) | 12.5 (10, 1.7) | 13.8 (10, 1.6) | 9.8 (10, 1.7) | -1.7 (-11.7 %) within budget | -0.4 (-2.6 %) within budget | -4.4 (-31.2 %) within budget |
| view-data.jpeg.menu-to-request-ms | 34.5 (10, 5.0) | 36.8 (10, 2.3) | 38.0 (10, 1.1) | 37.7 (10, 1.0) | +2.2 (+6.4 %) within budget | +3.5 (+10.0 %) within budget | +3.2 (+9.1 %) within budget |
| view-data.jpeg.open-tree-delta-kb | 292248 (10, 960) | 295064 (10, 5160) | 295272 (10, 2640) | 288576 (10, 4552) | +2816 (+1.0 %) within budget | +3024 (+1.0 %) within budget | -3672 (-1.3 %) within budget |
| view-data.jpeg.peak-tree-delta-kb | 291040 (10, 1320) | 293936 (10, 5616) | 293504 (10, 2704) | 287544 (10, 3736) | +2896 (+1.0 %) within budget | +2464 (+0.8 %) within budget | -3496 (-1.2 %) within budget |
| view-data.jpeg.request-to-image-ms | 647 (10, 16.1) | 658 (10, 8.0) | 670 (10, 8.8) | 649 (10, 3.0) | +10.7 (+1.7 %) within budget | +22.4 (+3.5 %) within budget | +2.0 (+0.3 %) within budget |
| view-data.jpeg.request-to-launch-ms | 0.2 (10, 0.0) | 0.2 (10, 0.1) | 0.3 (10, 0.0) | 0.2 (10, 0.0) | +0.0 (+25.2 %) within budget | +0.1 (+42.8 %) within budget | +0.0 (+15.3 %) within budget |
| view-data.jpeg.request-to-metadata-ms | 649 (10, 16.2) | 661 (10, 8.0) | 672 (10, 9.2) | 652 (10, 3.9) | +11.8 (+1.8 %) within budget | +22.6 (+3.5 %) within budget | +2.5 (+0.4 %) within budget |
| view-data.jpeg.request-to-page-loaded-ms | 110 (10, 8.6) | 122 (10, 5.6) | 101 (10, 4.5) | 97.3 (10, 9.4) | +11.4 (+10.3 %) within budget | -9.3 (-8.4 %) within budget | -12.9 (-11.7 %) within budget |
| view-data.jpeg.window-created-to-page-loaded-ms | 95.4 (10, 8.4) | 108 (10, 5.8) | 89.4 (10, 4.2) | 85.8 (10, 7.4) | +12.7 (+13.3 %) within budget | -6.0 (-6.3 %) within budget | -9.6 (-10.0 %) within budget |

C2-url and C2-ipc are one package of C2 (b6a4bfa3), launched with PLM_TEST_PHOTO_TRANSPORT=url and =ipc. The viewer is 568b8ab for every build. A Time Machine backup and another session's repeated tool runs loaded the computer for part of the series (RESULTS.md).

## C2 (URL) against C1

The same trials, with C1 as the baseline.

| Metric | C1 median (n, MAD) | C2-url median (n, MAD) | C2-url vs C1 |
| --- | ---: | ---: | --- |
| open-folder.cold.click-to-complete-ms | 676 (10, 2.6) | 679 (10, 4.0) | +2.5 (+0.4 %) within budget |
| open-folder.cold.click-to-dialog-ms | 32.4 (10, 1.9) | 34.0 (10, 2.2) | +1.6 (+4.9 %) within budget |
| open-folder.cold.dialog-ms | 0.4 (10, 0.1) | 0.5 (10, 0.0) | +0.0 (+12.5 %) within budget |
| open-folder.cold.dialog-to-start-ms | 0.1 (10, 0.0) | 0.1 (10, 0.0) | +0.0 (+0.2 %) within budget |
| open-folder.cold.directory-tree-ms | 8.6 (10, 0.3) | 8.7 (10, 0.3) | +0.1 (+0.6 %) within budget |
| open-folder.cold.exif-files | 314 (10, 0.0) | 314 (10, 0.0) | +0.0 (+0.0 %) same |
| open-folder.cold.exif-max-file-ms | 29.6 (10, 0.6) | 29.7 (10, 0.3) | +0.1 (+0.2 %) |
| open-folder.cold.exif-parse-sum-ms | 87.1 (10, 7.7) | 84.9 (10, 4.7) | -2.1 (-2.5 %) |
| open-folder.cold.exif-read-sum-ms | 261 (10, 15.6) | 260 (10, 9.8) | -1.1 (-0.4 %) |
| open-folder.cold.exif-rotate-sum-ms | 4819 (10, 19.4) | 4821 (10, 16.3) | +1.6 (+0.0 %) |
| open-folder.cold.exif-thumbnail-sum-ms | 57.8 (10, 5.7) | 56.2 (10, 4.5) | -1.6 (-2.8 %) |
| open-folder.cold.finish-ms | 110 (10, 0.4) | 111 (10, 0.8) | +0.4 (+0.4 %) within budget |
| open-folder.cold.main-event-loop-max-ms | 22.8 (10, 1.0) | 21.4 (10, 2.4) | -1.4 (-6.0 %) within budget |
| open-folder.cold.main-event-loop-p99-ms | 20.4 (10, 0.6) | 19.3 (10, 1.3) | -1.1 (-5.2 %) within budget |
| open-folder.cold.peak-tree-delta-kb | 2574056 (10, 136120) | 2542096 (10, 42200) | -31960 (-1.2 %) within budget |
| open-folder.cold.peak-tree-rss-kb | 3290968 (10, 136184) | 3271264 (10, 48696) | -19704 (-0.6 %) within budget |
| open-folder.cold.photo-data-ms | 525 (10, 0.3) | 525 (10, 1.1) | +0.1 (+0.0 %) within budget |
| open-folder.cold.renderer-longtask-max-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.cold.renderer-longtask-total-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.cold.renderer-longtasks | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.cold.renderer-max-frame-gap-ms | 33.5 (10, 0.3) | 33.4 (10, 0.1) | -0.0 (-0.1 %) within budget |
| open-folder.cold.settled-main-ws-kb | 214400 (10, 24560) | 206640 (10, 17640) | -7760 (-3.6 %) within budget |
| open-folder.cold.settled-renderer-ws-kb | 258048 (10, 17784) | 245312 (10, 13224) | -12736 (-4.9 %) within budget |
| open-folder.cold.settled-tree-rss-kb | 634472 (10, 52840) | 613208 (10, 36128) | -21264 (-3.4 %) within budget |
| open-folder.cold.start-to-complete-ms | 643 (10, 1.0) | 644 (10, 0.9) | +1.0 (+0.1 %) within budget |
| open-folder.cold.start-to-markers-ms | 1663 (10, 6.7) | 1662 (10, 3.6) | -0.2 (-0.0 %) within budget |
| open-folder.cold.start-to-thumbnails-done-ms | 5641 (10, 0.9) | 5641 (10, 0.9) | +0.0 (+0.0 %) within budget |
| open-folder.cold.thumbnails-main-ms | 2192 (10, 112) | 2190 (10, 193) | -1.7 (-0.1 %) within budget |
| open-folder.warm.click-to-complete-ms | 684 (10, 8.8) | 680 (10, 5.8) | -4.3 (-0.6 %) within budget |
| open-folder.warm.click-to-dialog-ms | 31.1 (10, 5.0) | 30.6 (10, 2.3) | -0.5 (-1.8 %) within budget |
| open-folder.warm.dialog-ms | 0.7 (10, 0.0) | 0.7 (10, 0.1) | -0.0 (-0.0 %) within budget |
| open-folder.warm.dialog-to-start-ms | 0.1 (10, 0.0) | 0.0 (10, 0.0) | -0.0 (-50.0 %) within budget |
| open-folder.warm.directory-tree-ms | 11.8 (10, 1.3) | 8.9 (10, 0.7) | -2.9 (-24.5 %) within budget |
| open-folder.warm.exif-files | 314 (10, 0.0) | 314 (10, 0.0) | +0.0 (+0.0 %) same |
| open-folder.warm.exif-max-file-ms | 29.8 (10, 3.6) | 33.2 (10, 2.8) | +3.4 (+11.2 %) |
| open-folder.warm.exif-parse-sum-ms | 69.8 (10, 9.8) | 82.9 (10, 18.2) | +13.1 (+18.8 %) |
| open-folder.warm.exif-read-sum-ms | 235 (10, 24.9) | 243 (10, 22.4) | +8.2 (+3.5 %) |
| open-folder.warm.exif-rotate-sum-ms | 4900 (10, 48.1) | 4927 (10, 54.2) | +26.6 (+0.5 %) |
| open-folder.warm.exif-thumbnail-sum-ms | 62.3 (10, 8.6) | 63.2 (10, 13.2) | +0.9 (+1.5 %) |
| open-folder.warm.finish-ms | 109 (10, 0.6) | 108 (10, 0.3) | -0.1 (-0.1 %) within budget |
| open-folder.warm.main-event-loop-max-ms | 12.4 (10, 0.6) | 12.3 (10, 0.7) | -0.0 (-0.1 %) within budget |
| open-folder.warm.main-event-loop-p99-ms | 12.3 (10, 0.5) | 12.1 (10, 0.5) | -0.1 (-1.2 %) within budget |
| open-folder.warm.peak-tree-delta-kb | 119832 (10, 15416) | 128496 (10, 9048) | +8664 (+7.2 %) within budget |
| open-folder.warm.peak-tree-rss-kb | 750328 (10, 29696) | 736752 (10, 25120) | -13576 (-1.8 %) within budget |
| open-folder.warm.photo-data-ms | 528 (10, 6.5) | 528 (10, 2.2) | -0.6 (-0.1 %) within budget |
| open-folder.warm.renderer-longtask-max-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.warm.renderer-longtask-total-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.warm.renderer-longtasks | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.warm.renderer-max-frame-gap-ms | 18.9 (10, 1.4) | 19.5 (10, 1.7) | +0.6 (+3.2 %) within budget |
| open-folder.warm.settled-main-ws-kb | 243032 (10, 13280) | 238240 (10, 12896) | -4792 (-2.0 %) within budget |
| open-folder.warm.settled-renderer-ws-kb | 312216 (10, 8536) | 303816 (10, 7048) | -8400 (-2.7 %) within budget |
| open-folder.warm.settled-tree-rss-kb | 747736 (10, 25024) | 732832 (10, 26216) | -14904 (-2.0 %) within budget |
| open-folder.warm.start-to-complete-ms | 645 (10, 1.8) | 645 (10, 2.6) | +0.4 (+0.1 %) within budget |
| settings.restart.click-to-exit-ms | 129 (10, 10.0) | 127 (10, 9.0) | -2.5 (-1.9 %) within budget |
| settings.restart.click-to-home-rendered-ms | 482 (10, 7.6) | 481 (10, 15.0) | -0.7 (-0.1 %) within budget |
| settings.restart.click-to-process-started-ms | 159 (10, 11.7) | 155 (10, 9.4) | -3.9 (-2.4 %) within budget |
| settings.restart.process-to-home-rendered-ms | 320 (10, 19.1) | 333 (10, 14.8) | +13.1 (+4.1 %) within budget |
| settings.save.click-to-closed-ms | 110 (10, 2.1) | 113 (10, 0.8) | +3.6 (+3.3 %) within budget |
| settings.save.click-to-persisted-ms | 110 (10, 2.0) | 113 (10, 0.5) | +3.0 (+2.7 %) within budget |
| startup.cold.bootstrap-done-ms | 604 (10, 79.5) | 461 (10, 75.7) | -144 (-23.8 %) within budget |
| startup.cold.bootstrap-start-ms | 572 (10, 70.2) | 435 (10, 74.2) | -137 (-24.0 %) within budget |
| startup.cold.close-ms | 50.5 (10, 5.5) | 46.5 (10, 3.0) | -4.0 (-7.9 %) within budget |
| startup.cold.create-window-ms | 352 (10, 25.7) | 207 (10, 40.7) | -146 (-41.4 %) improvement |
| startup.cold.did-finish-load-ms | 486 (10, 57.1) | 324 (10, 78.8) | -163 (-33.5 %) within budget |
| startup.cold.home-rendered-ms | 619 (10, 82.8) | 474 (10, 76.4) | -145 (-23.4 %) within budget |
| startup.cold.navigation-start-ms | 425 (10, 48.4) | 292 (10, 75.3) | -133 (-31.3 %) within budget |
| startup.cold.process-started-ms | 42.8 (10, 2.2) | 33.7 (10, 4.2) | -9.0 (-21.1 %) within budget |
| startup.cold.ready-to-show-ms | 488 (10, 57.4) | 325 (10, 75.2) | -163 (-33.5 %) within budget |
| startup.cold.renderer-bootstrap-ms | 32.7 (10, 5.7) | 26.6 (10, 3.3) | -6.1 (-18.7 %) within budget |
| startup.cold.renderer-modules-ms | 147 (10, 14.6) | 134 (10, 12.7) | -12.5 (-8.5 %) within budget |
| startup.cold.settled-main-ws-kb | 210592 (10, 88.0) | 210592 (10, 128) | +0.0 (+0.0 %) within budget |
| startup.cold.settled-renderer-ws-kb | 294424 (10, 784) | 294136 (10, 376) | -288 (-0.1 %) within budget |
| startup.cold.settled-tree-rss-kb | 717240 (10, 1680) | 716848 (10, 1008) | -392 (-0.1 %) within budget |
| startup.cold.window-created-ms | 410 (10, 30.4) | 264 (10, 57.7) | -146 (-35.7 %) improvement |
| startup.warm.bootstrap-done-ms | 367 (10, 24.8) | 378 (10, 27.3) | +11.5 (+3.1 %) within budget |
| startup.warm.bootstrap-start-ms | 346 (10, 23.3) | 359 (10, 27.1) | +13.2 (+3.8 %) within budget |
| startup.warm.close-ms | 45.0 (10, 2.0) | 48.5 (10, 3.0) | +3.5 (+7.8 %) within budget |
| startup.warm.create-window-ms | 188 (10, 12.6) | 196 (10, 12.0) | +8.3 (+4.4 %) within budget |
| startup.warm.did-finish-load-ms | 279 (10, 19.9) | 291 (10, 20.6) | +11.9 (+4.3 %) within budget |
| startup.warm.home-rendered-ms | 382 (10, 26.4) | 393 (10, 28.3) | +11.1 (+2.9 %) within budget |
| startup.warm.navigation-start-ms | 245 (10, 20.3) | 257 (10, 21.7) | +12.7 (+5.2 %) within budget |
| startup.warm.process-started-ms | 30.4 (10, 1.2) | 32.4 (10, 1.0) | +2.0 (+6.7 %) within budget |
| startup.warm.ready-to-show-ms | 283 (10, 23.6) | 295 (10, 20.8) | +12.0 (+4.3 %) within budget |
| startup.warm.renderer-bootstrap-ms | 20.3 (10, 1.9) | 20.3 (10, 0.7) | +0.0 (+0.0 %) within budget |
| startup.warm.renderer-modules-ms | 101 (10, 3.3) | 105 (10, 9.2) | +3.7 (+3.6 %) within budget |
| startup.warm.settled-main-ws-kb | 215040 (10, 160) | 215176 (10, 120) | +136 (+0.1 %) within budget |
| startup.warm.settled-renderer-ws-kb | 225656 (10, 512) | 230424 (10, 1104) | +4768 (+2.1 %) within budget |
| startup.warm.settled-tree-rss-kb | 595728 (10, 848) | 602024 (10, 5024) | +6296 (+1.1 %) within budget |
| startup.warm.window-created-ms | 240 (10, 18.0) | 245 (10, 17.8) | +4.9 (+2.0 %) within budget |
| view-data.cycles.retained-tree-kb | -54648 (10, 9224) | -53120 (10, 8656) | +1528 (-2.8 %) within budget |
| view-data.heic.after-close-tree-delta-kb | -59464 (10, 4584) | -59232 (10, 3440) | +232 (-0.4 %) within budget |
| view-data.heic.launch-to-window-created-ms | 13.0 (10, 1.2) | 12.8 (10, 3.0) | -0.3 (-2.2 %) within budget |
| view-data.heic.menu-to-request-ms | 35.1 (10, 1.6) | 34.3 (10, 1.4) | -0.8 (-2.3 %) within budget |
| view-data.heic.open-tree-delta-kb | 481784 (10, 15312) | 374344 (10, 1896) | -107440 (-22.3 %) improvement |
| view-data.heic.peak-tree-delta-kb | 487296 (10, 2912) | 472312 (10, 2176) | -14984 (-3.1 %) within budget |
| view-data.heic.request-to-image-ms | 598 (10, 17.6) | 606 (10, 25.0) | +8.4 (+1.4 %) within budget |
| view-data.heic.request-to-launch-ms | 0.2 (10, 0.0) | 0.3 (10, 0.0) | +0.0 (+14.4 %) within budget |
| view-data.heic.request-to-metadata-ms | 600 (10, 17.8) | 608 (10, 25.3) | +8.3 (+1.4 %) within budget |
| view-data.heic.request-to-page-loaded-ms | 103 (10, 8.6) | 93.6 (10, 4.4) | -9.8 (-9.4 %) within budget |
| view-data.heic.window-created-to-page-loaded-ms | 92.0 (10, 9.4) | 78.7 (10, 4.5) | -13.3 (-14.4 %) within budget |
| view-data.jpeg-first.after-close-tree-delta-kb | -112208 (10, 1840) | -99536 (10, 7984) | +12672 (-11.3 %) within budget |
| view-data.jpeg-first.launch-to-window-created-ms | 21.2 (10, 2.6) | 20.4 (10, 3.5) | -0.7 (-3.4 %) within budget |
| view-data.jpeg-first.menu-to-request-ms | 31.8 (10, 3.2) | 33.0 (10, 4.9) | +1.2 (+3.8 %) within budget |
| view-data.jpeg-first.open-tree-delta-kb | 249240 (10, 12712) | 236240 (10, 8856) | -13000 (-5.2 %) within budget |
| view-data.jpeg-first.peak-tree-delta-kb | 266704 (10, 9064) | 255584 (10, 3160) | -11120 (-4.2 %) within budget |
| view-data.jpeg-first.request-to-image-ms | 674 (10, 7.4) | 680 (10, 6.4) | +6.3 (+0.9 %) within budget |
| view-data.jpeg-first.request-to-launch-ms | 0.3 (10, 0.1) | 0.3 (10, 0.0) | +0.1 (+19.7 %) within budget |
| view-data.jpeg-first.request-to-metadata-ms | 678 (10, 8.1) | 682 (10, 7.7) | +4.3 (+0.6 %) within budget |
| view-data.jpeg-first.request-to-page-loaded-ms | 135 (10, 3.9) | 116 (10, 5.7) | -18.4 (-13.6 %) improvement |
| view-data.jpeg-first.window-created-to-page-loaded-ms | 116 (10, 9.2) | 93.3 (10, 5.6) | -22.5 (-19.4 %) within budget |
| view-data.jpeg.after-close-tree-delta-kb | -45592 (10, 2368) | -36512 (10, 6072) | +9080 (-19.9 %) within budget |
| view-data.jpeg.launch-to-window-created-ms | 12.5 (10, 1.7) | 13.8 (10, 1.6) | +1.3 (+10.3 %) within budget |
| view-data.jpeg.menu-to-request-ms | 36.8 (10, 2.3) | 38.0 (10, 1.1) | +1.3 (+3.4 %) within budget |
| view-data.jpeg.open-tree-delta-kb | 295064 (10, 5160) | 295272 (10, 2640) | +208 (+0.1 %) within budget |
| view-data.jpeg.peak-tree-delta-kb | 293936 (10, 5616) | 293504 (10, 2704) | -432 (-0.1 %) within budget |
| view-data.jpeg.request-to-image-ms | 658 (10, 8.0) | 670 (10, 8.8) | +11.7 (+1.8 %) within budget |
| view-data.jpeg.request-to-launch-ms | 0.2 (10, 0.1) | 0.3 (10, 0.0) | +0.0 (+14.0 %) within budget |
| view-data.jpeg.request-to-metadata-ms | 661 (10, 8.0) | 672 (10, 9.2) | +10.8 (+1.6 %) within budget |
| view-data.jpeg.request-to-page-loaded-ms | 122 (10, 5.6) | 101 (10, 4.5) | -20.7 (-17.0 %) within budget |
| view-data.jpeg.window-created-to-page-loaded-ms | 108 (10, 5.8) | 89.4 (10, 4.2) | -18.7 (-17.3 %) within budget |

## C2 (IPC) against C2 (URL)

The same trials, with C2-url as the baseline.

| Metric | C2-url median (n, MAD) | C2-ipc median (n, MAD) | C2-ipc vs C2-url |
| --- | ---: | ---: | --- |
| open-folder.cold.click-to-complete-ms | 679 (10, 4.0) | 678 (10, 4.2) | -0.2 (-0.0 %) within budget |
| open-folder.cold.click-to-dialog-ms | 34.0 (10, 2.2) | 35.1 (10, 4.8) | +1.0 (+2.9 %) within budget |
| open-folder.cold.dialog-ms | 0.5 (10, 0.0) | 0.4 (10, 0.0) | -0.1 (-11.1 %) within budget |
| open-folder.cold.dialog-to-start-ms | 0.1 (10, 0.0) | 0.1 (10, 0.0) | +0.0 (+0.0 %) within budget |
| open-folder.cold.directory-tree-ms | 8.7 (10, 0.3) | 9.2 (10, 0.9) | +0.6 (+6.4 %) within budget |
| open-folder.cold.exif-files | 314 (10, 0.0) | 314 (10, 0.0) | +0.0 (+0.0 %) same |
| open-folder.cold.exif-max-file-ms | 29.7 (10, 0.3) | 28.9 (10, 1.1) | -0.8 (-2.5 %) |
| open-folder.cold.exif-parse-sum-ms | 84.9 (10, 4.7) | 115 (10, 33.1) | +30.2 (+35.6 %) |
| open-folder.cold.exif-read-sum-ms | 260 (10, 9.8) | 283 (10, 32.6) | +23.1 (+8.9 %) |
| open-folder.cold.exif-rotate-sum-ms | 4821 (10, 16.3) | 4796 (10, 48.6) | -24.6 (-0.5 %) |
| open-folder.cold.exif-thumbnail-sum-ms | 56.2 (10, 4.5) | 60.3 (10, 5.2) | +4.1 (+7.3 %) |
| open-folder.cold.finish-ms | 111 (10, 0.8) | 110 (10, 0.6) | -0.7 (-0.6 %) within budget |
| open-folder.cold.main-event-loop-max-ms | 21.4 (10, 2.4) | 21.9 (10, 0.9) | +0.5 (+2.3 %) within budget |
| open-folder.cold.main-event-loop-p99-ms | 19.3 (10, 1.3) | 18.6 (10, 1.0) | -0.7 (-3.6 %) within budget |
| open-folder.cold.peak-tree-delta-kb | 2542096 (10, 42200) | 2581384 (10, 116032) | +39288 (+1.5 %) within budget |
| open-folder.cold.peak-tree-rss-kb | 3271264 (10, 48696) | 3266400 (10, 80320) | -4864 (-0.1 %) within budget |
| open-folder.cold.photo-data-ms | 525 (10, 1.1) | 524 (10, 1.2) | -0.7 (-0.1 %) within budget |
| open-folder.cold.renderer-longtask-max-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.cold.renderer-longtask-total-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.cold.renderer-longtasks | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.cold.renderer-max-frame-gap-ms | 33.4 (10, 0.1) | 33.4 (10, 0.6) | -0.0 (-0.0 %) within budget |
| open-folder.cold.settled-main-ws-kb | 206640 (10, 17640) | 195000 (10, 16048) | -11640 (-5.6 %) within budget |
| open-folder.cold.settled-renderer-ws-kb | 245312 (10, 13224) | 242968 (10, 12656) | -2344 (-1.0 %) within budget |
| open-folder.cold.settled-tree-rss-kb | 613208 (10, 36128) | 600976 (10, 34776) | -12232 (-2.0 %) within budget |
| open-folder.cold.start-to-complete-ms | 644 (10, 0.9) | 643 (10, 0.5) | -0.6 (-0.1 %) within budget |
| open-folder.cold.start-to-markers-ms | 1662 (10, 3.6) | 1658 (10, 4.4) | -4.7 (-0.3 %) within budget |
| open-folder.cold.start-to-thumbnails-done-ms | 5641 (10, 0.9) | 5642 (10, 1.3) | +0.6 (+0.0 %) within budget |
| open-folder.cold.thumbnails-main-ms | 2190 (10, 193) | 2170 (10, 104) | -19.6 (-0.9 %) within budget |
| open-folder.warm.click-to-complete-ms | 680 (10, 5.8) | 678 (10, 5.1) | -2.4 (-0.4 %) within budget |
| open-folder.warm.click-to-dialog-ms | 30.6 (10, 2.3) | 30.7 (10, 3.8) | +0.1 (+0.2 %) within budget |
| open-folder.warm.dialog-ms | 0.7 (10, 0.1) | 0.7 (10, 0.1) | +0.0 (+0.0 %) within budget |
| open-folder.warm.dialog-to-start-ms | 0.0 (10, 0.0) | 0.1 (10, 0.0) | +0.1 (+100.5 %) within budget |
| open-folder.warm.directory-tree-ms | 8.9 (10, 0.7) | 8.9 (10, 0.8) | -0.1 (-0.6 %) within budget |
| open-folder.warm.exif-files | 314 (10, 0.0) | 314 (10, 0.0) | +0.0 (+0.0 %) same |
| open-folder.warm.exif-max-file-ms | 33.2 (10, 2.8) | 31.1 (10, 2.5) | -2.0 (-6.0 %) |
| open-folder.warm.exif-parse-sum-ms | 82.9 (10, 18.2) | 68.3 (10, 9.8) | -14.6 (-17.7 %) |
| open-folder.warm.exif-read-sum-ms | 243 (10, 22.4) | 225 (10, 17.5) | -18.6 (-7.6 %) |
| open-folder.warm.exif-rotate-sum-ms | 4927 (10, 54.2) | 4930 (10, 33.7) | +3.4 (+0.1 %) |
| open-folder.warm.exif-thumbnail-sum-ms | 63.2 (10, 13.2) | 53.8 (10, 4.9) | -9.4 (-14.9 %) |
| open-folder.warm.finish-ms | 108 (10, 0.3) | 109 (10, 0.5) | +0.5 (+0.4 %) within budget |
| open-folder.warm.main-event-loop-max-ms | 12.3 (10, 0.7) | 12.6 (10, 0.4) | +0.2 (+1.8 %) within budget |
| open-folder.warm.main-event-loop-p99-ms | 12.1 (10, 0.5) | 12.0 (10, 0.5) | -0.2 (-1.6 %) within budget |
| open-folder.warm.peak-tree-delta-kb | 128496 (10, 9048) | 129520 (10, 10352) | +1024 (+0.8 %) within budget |
| open-folder.warm.peak-tree-rss-kb | 736752 (10, 25120) | 714280 (10, 23616) | -22472 (-3.1 %) within budget |
| open-folder.warm.photo-data-ms | 528 (10, 2.2) | 527 (10, 0.8) | -0.4 (-0.1 %) within budget |
| open-folder.warm.renderer-longtask-max-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.warm.renderer-longtask-total-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.warm.renderer-longtasks | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.warm.renderer-max-frame-gap-ms | 19.5 (10, 1.7) | 23.2 (10, 4.1) | +3.7 (+19.0 %) within budget |
| open-folder.warm.settled-main-ws-kb | 238240 (10, 12896) | 229216 (10, 6976) | -9024 (-3.8 %) within budget |
| open-folder.warm.settled-renderer-ws-kb | 303816 (10, 7048) | 294856 (10, 7752) | -8960 (-2.9 %) within budget |
| open-folder.warm.settled-tree-rss-kb | 732832 (10, 26216) | 709776 (10, 20432) | -23056 (-3.1 %) within budget |
| open-folder.warm.start-to-complete-ms | 645 (10, 2.6) | 645 (10, 1.5) | +0.0 (+0.0 %) within budget |
| settings.restart.click-to-exit-ms | 127 (10, 9.0) | 131 (10, 10.0) | +4.5 (+3.6 %) within budget |
| settings.restart.click-to-home-rendered-ms | 481 (10, 15.0) | 467 (10, 17.9) | -14.6 (-3.0 %) within budget |
| settings.restart.click-to-process-started-ms | 155 (10, 9.4) | 163 (10, 10.1) | +7.2 (+4.7 %) within budget |
| settings.restart.process-to-home-rendered-ms | 333 (10, 14.8) | 315 (10, 19.6) | -17.3 (-5.2 %) within budget |
| settings.save.click-to-closed-ms | 113 (10, 0.8) | 113 (10, 0.4) | -0.1 (-0.0 %) within budget |
| settings.save.click-to-persisted-ms | 113 (10, 0.5) | 114 (10, 0.5) | +1.0 (+0.9 %) within budget |
| startup.cold.bootstrap-done-ms | 461 (10, 75.7) | 402 (10, 13.7) | -58.8 (-12.8 %) within budget |
| startup.cold.bootstrap-start-ms | 435 (10, 74.2) | 378 (10, 9.7) | -56.9 (-13.1 %) within budget |
| startup.cold.close-ms | 46.5 (10, 3.0) | 45.0 (10, 5.0) | -1.5 (-3.2 %) within budget |
| startup.cold.create-window-ms | 207 (10, 40.7) | 186 (10, 8.3) | -20.8 (-10.1 %) within budget |
| startup.cold.did-finish-load-ms | 324 (10, 78.8) | 276 (10, 6.9) | -47.3 (-14.6 %) within budget |
| startup.cold.home-rendered-ms | 474 (10, 76.4) | 414 (10, 13.7) | -60.4 (-12.7 %) within budget |
| startup.cold.navigation-start-ms | 292 (10, 75.3) | 241 (10, 8.3) | -50.8 (-17.4 %) within budget |
| startup.cold.process-started-ms | 33.7 (10, 4.2) | 31.1 (10, 1.2) | -2.6 (-7.8 %) within budget |
| startup.cold.ready-to-show-ms | 325 (10, 75.2) | 279 (10, 10.3) | -46.0 (-14.2 %) within budget |
| startup.cold.renderer-bootstrap-ms | 26.6 (10, 3.3) | 24.2 (10, 1.2) | -2.4 (-9.2 %) within budget |
| startup.cold.renderer-modules-ms | 134 (10, 12.7) | 133 (10, 3.7) | -1.8 (-1.3 %) within budget |
| startup.cold.settled-main-ws-kb | 210592 (10, 128) | 210624 (10, 208) | +32.0 (+0.0 %) within budget |
| startup.cold.settled-renderer-ws-kb | 294136 (10, 376) | 293656 (10, 448) | -480 (-0.2 %) within budget |
| startup.cold.settled-tree-rss-kb | 716848 (10, 1008) | 715520 (10, 3160) | -1328 (-0.2 %) within budget |
| startup.cold.window-created-ms | 264 (10, 57.7) | 231 (10, 9.0) | -32.6 (-12.4 %) within budget |
| startup.warm.bootstrap-done-ms | 378 (10, 27.3) | 358 (10, 20.1) | -19.8 (-5.2 %) within budget |
| startup.warm.bootstrap-start-ms | 359 (10, 27.1) | 338 (10, 19.3) | -21.2 (-5.9 %) within budget |
| startup.warm.close-ms | 48.5 (10, 3.0) | 45.0 (10, 7.5) | -3.5 (-7.2 %) within budget |
| startup.warm.create-window-ms | 196 (10, 12.0) | 188 (10, 13.4) | -8.6 (-4.4 %) within budget |
| startup.warm.did-finish-load-ms | 291 (10, 20.6) | 272 (10, 15.3) | -18.9 (-6.5 %) within budget |
| startup.warm.home-rendered-ms | 393 (10, 28.3) | 374 (10, 20.8) | -19.4 (-4.9 %) within budget |
| startup.warm.navigation-start-ms | 257 (10, 21.7) | 238 (10, 14.2) | -19.7 (-7.7 %) within budget |
| startup.warm.process-started-ms | 32.4 (10, 1.0) | 30.5 (10, 1.2) | -1.9 (-6.0 %) within budget |
| startup.warm.ready-to-show-ms | 295 (10, 20.8) | 275 (10, 13.4) | -19.3 (-6.5 %) within budget |
| startup.warm.renderer-bootstrap-ms | 20.3 (10, 0.7) | 20.8 (10, 1.2) | +0.5 (+2.5 %) within budget |
| startup.warm.renderer-modules-ms | 105 (10, 9.2) | 98.3 (10, 3.9) | -6.3 (-6.1 %) within budget |
| startup.warm.settled-main-ws-kb | 215176 (10, 120) | 215016 (10, 160) | -160 (-0.1 %) within budget |
| startup.warm.settled-renderer-ws-kb | 230424 (10, 1104) | 228128 (10, 2384) | -2296 (-1.0 %) within budget |
| startup.warm.settled-tree-rss-kb | 602024 (10, 5024) | 597368 (10, 2112) | -4656 (-0.8 %) within budget |
| startup.warm.window-created-ms | 245 (10, 17.8) | 234 (10, 13.1) | -10.5 (-4.3 %) within budget |
| view-data.cycles.retained-tree-kb | -53120 (10, 8656) | -53576 (10, 16424) | -456 (+0.9 %) within budget |
| view-data.heic.after-close-tree-delta-kb | -59232 (10, 3440) | -57912 (10, 2552) | +1320 (-2.2 %) within budget |
| view-data.heic.launch-to-window-created-ms | 12.8 (10, 3.0) | 11.2 (10, 2.9) | -1.6 (-12.2 %) within budget |
| view-data.heic.menu-to-request-ms | 34.3 (10, 1.4) | 36.3 (10, 1.2) | +2.0 (+5.8 %) within budget |
| view-data.heic.open-tree-delta-kb | 374344 (10, 1896) | 373488 (10, 3176) | -856 (-0.2 %) within budget |
| view-data.heic.peak-tree-delta-kb | 472312 (10, 2176) | 474120 (10, 2568) | +1808 (+0.4 %) within budget |
| view-data.heic.request-to-image-ms | 606 (10, 25.0) | 589 (10, 23.8) | -16.7 (-2.8 %) within budget |
| view-data.heic.request-to-launch-ms | 0.3 (10, 0.0) | 0.3 (10, 0.1) | +0.0 (+12.8 %) within budget |
| view-data.heic.request-to-metadata-ms | 608 (10, 25.3) | 591 (10, 24.0) | -17.1 (-2.8 %) within budget |
| view-data.heic.request-to-page-loaded-ms | 93.6 (10, 4.4) | 88.3 (10, 2.3) | -5.3 (-5.6 %) within budget |
| view-data.heic.window-created-to-page-loaded-ms | 78.7 (10, 4.5) | 74.5 (10, 5.3) | -4.2 (-5.4 %) within budget |
| view-data.jpeg-first.after-close-tree-delta-kb | -99536 (10, 7984) | -108680 (10, 1752) | -9144 (+9.2 %) within budget |
| view-data.jpeg-first.launch-to-window-created-ms | 20.4 (10, 3.5) | 19.5 (10, 3.5) | -0.9 (-4.5 %) within budget |
| view-data.jpeg-first.menu-to-request-ms | 33.0 (10, 4.9) | 31.5 (10, 3.7) | -1.5 (-4.6 %) within budget |
| view-data.jpeg-first.open-tree-delta-kb | 236240 (10, 8856) | 232072 (10, 10360) | -4168 (-1.8 %) within budget |
| view-data.jpeg-first.peak-tree-delta-kb | 255584 (10, 3160) | 244656 (10, 8168) | -10928 (-4.3 %) within budget |
| view-data.jpeg-first.request-to-image-ms | 680 (10, 6.4) | 664 (10, 7.7) | -15.8 (-2.3 %) within budget |
| view-data.jpeg-first.request-to-launch-ms | 0.3 (10, 0.0) | 0.3 (10, 0.0) | +0.0 (+1.1 %) within budget |
| view-data.jpeg-first.request-to-metadata-ms | 682 (10, 7.7) | 666 (10, 7.7) | -16.0 (-2.3 %) within budget |
| view-data.jpeg-first.request-to-page-loaded-ms | 116 (10, 5.7) | 114 (10, 8.2) | -2.6 (-2.3 %) within budget |
| view-data.jpeg-first.window-created-to-page-loaded-ms | 93.3 (10, 5.6) | 92.8 (10, 5.4) | -0.5 (-0.5 %) within budget |
| view-data.jpeg.after-close-tree-delta-kb | -36512 (10, 6072) | -41080 (10, 2104) | -4568 (+12.5 %) within budget |
| view-data.jpeg.launch-to-window-created-ms | 13.8 (10, 1.6) | 9.8 (10, 1.7) | -4.0 (-29.3 %) within budget |
| view-data.jpeg.menu-to-request-ms | 38.0 (10, 1.1) | 37.7 (10, 1.0) | -0.3 (-0.8 %) within budget |
| view-data.jpeg.open-tree-delta-kb | 295272 (10, 2640) | 288576 (10, 4552) | -6696 (-2.3 %) within budget |
| view-data.jpeg.peak-tree-delta-kb | 293504 (10, 2704) | 287544 (10, 3736) | -5960 (-2.0 %) within budget |
| view-data.jpeg.request-to-image-ms | 670 (10, 8.8) | 649 (10, 3.0) | -20.4 (-3.1 %) within budget |
| view-data.jpeg.request-to-launch-ms | 0.3 (10, 0.0) | 0.2 (10, 0.0) | -0.1 (-19.2 %) within budget |
| view-data.jpeg.request-to-metadata-ms | 672 (10, 9.2) | 652 (10, 3.9) | -20.1 (-3.0 %) within budget |
| view-data.jpeg.request-to-page-loaded-ms | 101 (10, 4.5) | 97.3 (10, 9.4) | -3.6 (-3.5 %) within budget |
| view-data.jpeg.window-created-to-page-loaded-ms | 89.4 (10, 4.2) | 85.8 (10, 7.4) | -3.6 (-4.0 %) within budget |
