# Series rer-2-C1c (protocol rer-2)

Builds: 0 (code e6a1d1e7c0b2), B (code c747f3e6fb52), C1 (code 81e273306058). Baseline: 0.
Host: Apple M5, 10 cores, 32 GB, darwin 27.0.0.
Viewer: 4be696704639 (unchanged).
Complete: yes. Trials: {"0":{"open-folder":{"ok":10,"failed":0,"interrupted":0,"warmup":1}},"B":{"open-folder":{"ok":10,"failed":0,"interrupted":0,"warmup":1}},"C1":{"open-folder":{"ok":10,"failed":0,"interrupted":0,"warmup":1}}}

| Metric | 0 median (n, MAD) | B median (n, MAD) | C1 median (n, MAD) | B vs 0 | C1 vs 0 |
| --- | ---: | ---: | ---: | --- | --- |
| open-folder.cold.click-to-complete-ms | 765 (10, 2.8) | 679 (10, 5.3) | 675 (10, 1.8) | -85.9 (-11.2 %) improvement | -89.2 (-11.7 %) improvement |
| open-folder.cold.click-to-dialog-ms | 32.2 (10, 2.7) | 32.8 (10, 4.7) | 30.7 (10, 1.9) | +0.6 (+2.0 %) within budget | -1.6 (-4.8 %) within budget |
| open-folder.cold.dialog-ms | 1.6 (10, 0.0) | 0.4 (10, 0.0) | 0.4 (10, 0.0) | -1.2 (-75.0 %) within budget | -1.2 (-75.0 %) within budget |
| open-folder.cold.dialog-to-start-ms | 0.7 (10, 0.0) | 0.2 (10, 0.0) | 0.1 (10, 0.1) | -0.5 (-71.4 %) within budget | -0.6 (-85.7 %) within budget |
| open-folder.cold.directory-tree-ms | 15.1 (10, 0.2) | 17.0 (10, 0.2) | 9.0 (10, 0.2) | +1.9 (+13.0 %) within budget | -6.0 (-39.9 %) improvement |
| open-folder.cold.exif-files | 314 (10, 0.0) | 314 (10, 0.0) | 314 (10, 0.0) | +0.0 (+0.0 %) same | +0.0 (+0.0 %) same |
| open-folder.cold.exif-max-file-ms | 45.2 (10, 0.6) | 23.8 (10, 0.6) | 29.3 (10, 0.2) | -21.4 (-47.5 %) | -15.9 (-35.2 %) |
| open-folder.cold.exif-parse-sum-ms | 238 (10, 6.2) | 82.9 (10, 5.2) | 81.3 (10, 6.4) | -156 (-65.2 %) | -157 (-65.9 %) |
| open-folder.cold.exif-read-sum-ms | 0.0 (10, 0.0) | 234 (10, 11.6) | 249 (10, 10.9) | +234 () | +249 () |
| open-folder.cold.exif-rotate-sum-ms | 5319 (10, 27.4) | 4773 (10, 17.8) | 4833 (10, 11.0) | -547 (-10.3 %) | -487 (-9.2 %) |
| open-folder.cold.exif-thumbnail-sum-ms | 225 (10, 1.3) | 52.7 (10, 2.9) | 52.9 (10, 3.8) | -173 (-76.6 %) | -173 (-76.6 %) |
| open-folder.cold.finish-ms | 110 (10, 0.5) | 110 (10, 0.5) | 111 (10, 0.2) | +0.1 (+0.0 %) within budget | +0.6 (+0.5 %) within budget |
| open-folder.cold.main-event-loop-max-ms | 22.7 (10, 2.0) | 23.4 (10, 1.2) | 22.0 (10, 1.7) | +0.7 (+3.0 %) within budget | -0.6 (-2.9 %) within budget |
| open-folder.cold.main-event-loop-p99-ms | 19.7 (10, 1.4) | 19.6 (10, 0.9) | 18.7 (10, 0.5) | -0.1 (-0.5 %) within budget | -1.0 (-5.1 %) within budget |
| open-folder.cold.peak-tree-delta-kb | 3099904 (10, 108848) | 3067912 (10, 51640) | 3076624 (10, 79248) | -31992 (-1.0 %) within budget | -23280 (-0.8 %) within budget |
| open-folder.cold.peak-tree-rss-kb | 3839088 (10, 102752) | 3801232 (10, 56224) | 3792784 (10, 80280) | -37856 (-1.0 %) within budget | -46304 (-1.2 %) within budget |
| open-folder.cold.photo-data-ms | 609 (10, 3.7) | 516 (10, 0.3) | 524 (10, 0.4) | -92.4 (-15.2 %) improvement | -84.6 (-13.9 %) improvement |
| open-folder.cold.renderer-longtask-max-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget | +0.0 () within budget |
| open-folder.cold.renderer-longtask-total-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget | +0.0 () within budget |
| open-folder.cold.renderer-longtasks | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget | +0.0 () within budget |
| open-folder.cold.renderer-max-frame-gap-ms | 48.8 (10, 7.5) | 61.1 (10, 1.7) | 33.4 (10, 0.3) | +12.3 (+25.1 %) within budget | -15.5 (-31.7 %) within budget |
| open-folder.cold.settled-main-ws-kb | 268552 (10, 3232) | 234296 (10, 15624) | 279344 (10, 3824) | -34256 (-12.8 %) improvement | +10792 (+4.0 %) within budget |
| open-folder.cold.settled-renderer-ws-kb | 327568 (10, 2384) | 293072 (10, 5760) | 291736 (10, 10392) | -34496 (-10.5 %) improvement | -35832 (-10.9 %) improvement |
| open-folder.cold.settled-tree-rss-kb | 763616 (10, 3184) | 689544 (10, 17920) | 735568 (10, 25160) | -74072 (-9.7 %) within budget | -28048 (-3.7 %) within budget |
| open-folder.cold.start-to-complete-ms | 734 (10, 4.2) | 644 (10, 0.3) | 644 (10, 0.5) | -90.1 (-12.3 %) improvement | -89.8 (-12.2 %) improvement |
| open-folder.cold.start-to-markers-ms | 1746 (10, 2.8) | 1664 (10, 1.1) | 1661 (10, 3.8) | -81.3 (-4.7 %) within budget | -85.1 (-4.9 %) within budget |
| open-folder.cold.start-to-thumbnails-done-ms | 5730 (10, 3.5) | 5644 (10, 1.2) | 5642 (10, 0.3) | -86.6 (-1.5 %) within budget | -88.1 (-1.5 %) within budget |
| open-folder.cold.thumbnails-main-ms | 1938 (10, 31.0) | 1957 (10, 64.2) | 1935 (10, 33.8) | +18.6 (+1.0 %) within budget | -2.7 (-0.1 %) within budget |
| open-folder.warm.click-to-complete-ms | 765 (10, 5.7) | 693 (10, 3.0) | 677 (10, 3.3) | -72.4 (-9.5 %) within budget | -88.0 (-11.5 %) improvement |
| open-folder.warm.click-to-dialog-ms | 29.8 (10, 2.4) | 34.7 (10, 1.6) | 32.7 (10, 3.8) | +4.9 (+16.4 %) within budget | +2.9 (+9.7 %) within budget |
| open-folder.warm.dialog-ms | 1.4 (10, 0.0) | 0.4 (10, 0.0) | 0.6 (10, 0.1) | -1.0 (-71.4 %) within budget | -0.8 (-57.1 %) within budget |
| open-folder.warm.dialog-to-start-ms | 0.6 (10, 0.1) | 0.1 (10, 0.0) | 0.1 (10, 0.1) | -0.5 (-83.3 %) within budget | -0.5 (-83.4 %) within budget |
| open-folder.warm.directory-tree-ms | 16.3 (10, 0.2) | 17.8 (10, 0.2) | 8.9 (10, 1.7) | +1.5 (+9.5 %) within budget | -7.4 (-45.2 %) improvement |
| open-folder.warm.exif-files | 314 (10, 0.0) | 314 (10, 0.0) | 314 (10, 0.0) | +0.0 (+0.0 %) same | +0.0 (+0.0 %) same |
| open-folder.warm.exif-max-file-ms | 39.4 (10, 4.0) | 36.5 (10, 0.9) | 31.5 (10, 2.4) | -2.9 (-7.2 %) | -7.9 (-20.2 %) |
| open-folder.warm.exif-parse-sum-ms | 216 (10, 5.4) | 64.9 (10, 4.3) | 61.9 (10, 3.7) | -151 (-70.0 %) | -154 (-71.4 %) |
| open-folder.warm.exif-read-sum-ms | 0.0 (10, 0.0) | 203 (10, 6.1) | 214 (10, 8.0) | +203 () | +214 () |
| open-folder.warm.exif-rotate-sum-ms | 5389 (10, 54.0) | 4974 (10, 12.0) | 4928 (10, 32.7) | -415 (-7.7 %) | -461 (-8.5 %) |
| open-folder.warm.exif-thumbnail-sum-ms | 218 (10, 5.6) | 51.0 (10, 2.3) | 51.8 (10, 3.2) | -167 (-76.6 %) | -166 (-76.3 %) |
| open-folder.warm.finish-ms | 109 (10, 0.4) | 110 (10, 0.5) | 110 (10, 0.4) | +0.7 (+0.6 %) within budget | +0.5 (+0.4 %) within budget |
| open-folder.warm.main-event-loop-max-ms | 12.2 (10, 0.1) | 12.4 (10, 0.2) | 12.6 (10, 0.2) | +0.2 (+1.5 %) within budget | +0.3 (+2.8 %) within budget |
| open-folder.warm.main-event-loop-p99-ms | 12.1 (10, 0.0) | 12.2 (10, 0.0) | 12.3 (10, 0.1) | +0.1 (+0.5 %) within budget | +0.2 (+1.6 %) within budget |
| open-folder.warm.peak-tree-delta-kb | 78520 (10, 1032) | 110112 (10, 10568) | 80024 (10, 4680) | +31592 (+40.2 %) REGRESSION | +1504 (+1.9 %) within budget |
| open-folder.warm.peak-tree-rss-kb | 842208 (10, 2776) | 805168 (10, 13888) | 813712 (10, 22584) | -37040 (-4.4 %) within budget | -28496 (-3.4 %) within budget |
| open-folder.warm.photo-data-ms | 608 (10, 3.2) | 532 (10, 0.3) | 525 (10, 2.1) | -75.7 (-12.4 %) improvement | -82.7 (-13.6 %) improvement |
| open-folder.warm.renderer-longtask-max-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget | +0.0 () within budget |
| open-folder.warm.renderer-longtask-total-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget | +0.0 () within budget |
| open-folder.warm.renderer-longtasks | 0.0 (10, 0.0) | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget | +0.0 () within budget |
| open-folder.warm.renderer-max-frame-gap-ms | 67.0 (10, 9.1) | 73.8 (10, 2.4) | 22.4 (10, 3.8) | +6.7 (+10.1 %) within budget | -44.6 (-66.6 %) improvement |
| open-folder.warm.settled-main-ws-kb | 274416 (10, 3152) | 249200 (10, 6152) | 282568 (10, 3496) | -25216 (-9.2 %) within budget | +8152 (+3.0 %) within budget |
| open-folder.warm.settled-renderer-ws-kb | 369888 (10, 3280) | 352920 (10, 5568) | 331592 (10, 8960) | -16968 (-4.6 %) within budget | -38296 (-10.4 %) improvement |
| open-folder.warm.settled-tree-rss-kb | 842888 (10, 2704) | 800528 (10, 13536) | 808976 (10, 22568) | -42360 (-5.0 %) within budget | -33912 (-4.0 %) within budget |
| open-folder.warm.start-to-complete-ms | 733 (10, 4.1) | 660 (10, 0.5) | 645 (10, 1.1) | -73.6 (-10.0 %) improvement | -88.4 (-12.1 %) improvement |

Folder opening only, of C1 at 0aefe3fc, which checks the thumbnail cache while the photos' data load; the other scenarios are those of series rer-2-C1b, as the change touches folder opening only.

## C1 against B

The same trials, with B as the baseline.

| Metric | B median (n, MAD) | C1 median (n, MAD) | C1 vs B |
| --- | ---: | ---: | --- |
| open-folder.cold.click-to-complete-ms | 679 (10, 5.3) | 675 (10, 1.8) | -3.4 (-0.5 %) within budget |
| open-folder.cold.click-to-dialog-ms | 32.8 (10, 4.7) | 30.7 (10, 1.9) | -2.2 (-6.7 %) within budget |
| open-folder.cold.dialog-ms | 0.4 (10, 0.0) | 0.4 (10, 0.0) | +0.0 (+0.1 %) within budget |
| open-folder.cold.dialog-to-start-ms | 0.2 (10, 0.0) | 0.1 (10, 0.1) | -0.1 (-49.9 %) within budget |
| open-folder.cold.directory-tree-ms | 17.0 (10, 0.2) | 9.0 (10, 0.2) | -8.0 (-46.8 %) improvement |
| open-folder.cold.exif-files | 314 (10, 0.0) | 314 (10, 0.0) | +0.0 (+0.0 %) same |
| open-folder.cold.exif-max-file-ms | 23.8 (10, 0.6) | 29.3 (10, 0.2) | +5.6 (+23.4 %) |
| open-folder.cold.exif-parse-sum-ms | 82.9 (10, 5.2) | 81.3 (10, 6.4) | -1.6 (-1.9 %) |
| open-folder.cold.exif-read-sum-ms | 234 (10, 11.6) | 249 (10, 10.9) | +15.4 (+6.6 %) |
| open-folder.cold.exif-rotate-sum-ms | 4773 (10, 17.8) | 4833 (10, 11.0) | +60.0 (+1.3 %) |
| open-folder.cold.exif-thumbnail-sum-ms | 52.7 (10, 2.9) | 52.9 (10, 3.8) | +0.2 (+0.3 %) |
| open-folder.cold.finish-ms | 110 (10, 0.5) | 111 (10, 0.2) | +0.6 (+0.5 %) within budget |
| open-folder.cold.main-event-loop-max-ms | 23.4 (10, 1.2) | 22.0 (10, 1.7) | -1.3 (-5.6 %) within budget |
| open-folder.cold.main-event-loop-p99-ms | 19.6 (10, 0.9) | 18.7 (10, 0.5) | -0.9 (-4.6 %) within budget |
| open-folder.cold.peak-tree-delta-kb | 3067912 (10, 51640) | 3076624 (10, 79248) | +8712 (+0.3 %) within budget |
| open-folder.cold.peak-tree-rss-kb | 3801232 (10, 56224) | 3792784 (10, 80280) | -8448 (-0.2 %) within budget |
| open-folder.cold.photo-data-ms | 516 (10, 0.3) | 524 (10, 0.4) | +7.8 (+1.5 %) within budget |
| open-folder.cold.renderer-longtask-max-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.cold.renderer-longtask-total-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.cold.renderer-longtasks | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.cold.renderer-max-frame-gap-ms | 61.1 (10, 1.7) | 33.4 (10, 0.3) | -27.8 (-45.4 %) improvement |
| open-folder.cold.settled-main-ws-kb | 234296 (10, 15624) | 279344 (10, 3824) | +45048 (+19.2 %) within budget |
| open-folder.cold.settled-renderer-ws-kb | 293072 (10, 5760) | 291736 (10, 10392) | -1336 (-0.5 %) within budget |
| open-folder.cold.settled-tree-rss-kb | 689544 (10, 17920) | 735568 (10, 25160) | +46024 (+6.7 %) within budget |
| open-folder.cold.start-to-complete-ms | 644 (10, 0.3) | 644 (10, 0.5) | +0.3 (+0.0 %) within budget |
| open-folder.cold.start-to-markers-ms | 1664 (10, 1.1) | 1661 (10, 3.8) | -3.7 (-0.2 %) within budget |
| open-folder.cold.start-to-thumbnails-done-ms | 5644 (10, 1.2) | 5642 (10, 0.3) | -1.5 (-0.0 %) within budget |
| open-folder.cold.thumbnails-main-ms | 1957 (10, 64.2) | 1935 (10, 33.8) | -21.3 (-1.1 %) within budget |
| open-folder.warm.click-to-complete-ms | 693 (10, 3.0) | 677 (10, 3.3) | -15.6 (-2.3 %) within budget |
| open-folder.warm.click-to-dialog-ms | 34.7 (10, 1.6) | 32.7 (10, 3.8) | -2.0 (-5.8 %) within budget |
| open-folder.warm.dialog-ms | 0.4 (10, 0.0) | 0.6 (10, 0.1) | +0.2 (+50.1 %) within budget |
| open-folder.warm.dialog-to-start-ms | 0.1 (10, 0.0) | 0.1 (10, 0.1) | -0.0 (-0.1 %) within budget |
| open-folder.warm.directory-tree-ms | 17.8 (10, 0.2) | 8.9 (10, 1.7) | -8.9 (-50.0 %) improvement |
| open-folder.warm.exif-files | 314 (10, 0.0) | 314 (10, 0.0) | +0.0 (+0.0 %) same |
| open-folder.warm.exif-max-file-ms | 36.5 (10, 0.9) | 31.5 (10, 2.4) | -5.1 (-14.0 %) |
| open-folder.warm.exif-parse-sum-ms | 64.9 (10, 4.3) | 61.9 (10, 3.7) | -3.0 (-4.6 %) |
| open-folder.warm.exif-read-sum-ms | 203 (10, 6.1) | 214 (10, 8.0) | +10.3 (+5.1 %) |
| open-folder.warm.exif-rotate-sum-ms | 4974 (10, 12.0) | 4928 (10, 32.7) | -45.6 (-0.9 %) |
| open-folder.warm.exif-thumbnail-sum-ms | 51.0 (10, 2.3) | 51.8 (10, 3.2) | +0.8 (+1.6 %) |
| open-folder.warm.finish-ms | 110 (10, 0.5) | 110 (10, 0.4) | -0.2 (-0.2 %) within budget |
| open-folder.warm.main-event-loop-max-ms | 12.4 (10, 0.2) | 12.6 (10, 0.2) | +0.2 (+1.3 %) within budget |
| open-folder.warm.main-event-loop-p99-ms | 12.2 (10, 0.0) | 12.3 (10, 0.1) | +0.1 (+1.0 %) within budget |
| open-folder.warm.peak-tree-delta-kb | 110112 (10, 10568) | 80024 (10, 4680) | -30088 (-27.3 %) within budget |
| open-folder.warm.peak-tree-rss-kb | 805168 (10, 13888) | 813712 (10, 22584) | +8544 (+1.1 %) within budget |
| open-folder.warm.photo-data-ms | 532 (10, 0.3) | 525 (10, 2.1) | -7.0 (-1.3 %) within budget |
| open-folder.warm.renderer-longtask-max-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.warm.renderer-longtask-total-ms | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.warm.renderer-longtasks | 0.0 (10, 0.0) | 0.0 (10, 0.0) | +0.0 () within budget |
| open-folder.warm.renderer-max-frame-gap-ms | 73.8 (10, 2.4) | 22.4 (10, 3.8) | -51.3 (-69.6 %) improvement |
| open-folder.warm.settled-main-ws-kb | 249200 (10, 6152) | 282568 (10, 3496) | +33368 (+13.4 %) REGRESSION |
| open-folder.warm.settled-renderer-ws-kb | 352920 (10, 5568) | 331592 (10, 8960) | -21328 (-6.0 %) within budget |
| open-folder.warm.settled-tree-rss-kb | 800528 (10, 13536) | 808976 (10, 22568) | +8448 (+1.1 %) within budget |
| open-folder.warm.start-to-complete-ms | 660 (10, 0.5) | 645 (10, 1.1) | -14.8 (-2.2 %) within budget |
