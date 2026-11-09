# Series rer-2-C2s (protocol rer-2)

Builds: 0 (code e6a1d1e7c0b2), C1 (code 81e273306058), C2 (code 81ae9b8e4226). Baseline: 0.
Host: Apple M5, 10 cores, 32 GB, darwin 27.0.0.
Viewer: d7f2f4a3c1ee (unchanged).
Complete: yes. Trials: {"0":{"startup":{"ok":10,"failed":0,"interrupted":0,"warmup":1}},"C1":{"startup":{"ok":10,"failed":0,"interrupted":0,"warmup":1}},"C2":{"startup":{"ok":10,"failed":0,"interrupted":0,"warmup":1}}}

| Metric | 0 median (n, MAD) | C1 median (n, MAD) | C2 median (n, MAD) | C1 vs 0 | C2 vs 0 |
| --- | ---: | ---: | ---: | --- | --- |
| startup.cold.bootstrap-done-ms | 404 (10, 19.3) | 364 (10, 2.3) | 371 (10, 15.3) | -39.5 (-9.8 %) within budget | -33.3 (-8.2 %) within budget |
| startup.cold.bootstrap-start-ms | 387 (10, 19.3) | 342 (10, 2.4) | 347 (10, 15.4) | -44.2 (-11.4 %) within budget | -40.0 (-10.3 %) within budget |
| startup.cold.close-ms | 42.5 (10, 1.5) | 43.5 (10, 4.5) | 45.5 (10, 4.0) | +1.0 (+2.4 %) within budget | +3.0 (+7.1 %) within budget |
| startup.cold.create-window-ms | 176 (10, 12.3) | 175 (10, 1.0) | 172 (10, 6.7) | -1.2 (-0.7 %) within budget | -4.2 (-2.4 %) within budget |
| startup.cold.did-finish-load-ms | 387 (10, 19.3) | 250 (10, 2.2) | 251 (10, 9.0) | -137 (-35.3 %) improvement | -136 (-35.2 %) improvement |
| startup.cold.home-rendered-ms | 416 (10, 19.0) | 376 (10, 2.3) | 382 (10, 15.1) | -40.0 (-9.6 %) within budget | -33.4 (-8.0 %) within budget |
| startup.cold.navigation-start-ms | 261 (10, 11.3) | 222 (10, 1.9) | 222 (10, 10.9) | -38.9 (-14.9 %) within budget | -38.5 (-14.8 %) within budget |
| startup.cold.process-started-ms | 31.0 (10, 1.2) | 31.3 (10, 0.4) | 30.0 (10, 1.4) | +0.2 (+0.7 %) within budget | -1.0 (-3.2 %) within budget |
| startup.cold.ready-to-show-ms | 408 (10, 38.3) | 255 (10, 2.6) | 256 (10, 6.9) | -154 (-37.6 %) within budget | -152 (-37.2 %) within budget |
| startup.cold.renderer-bootstrap-ms | 17.4 (10, 0.4) | 22.5 (10, 0.6) | 24.1 (10, 0.5) | +5.1 (+29.0 %) REGRESSION | +6.7 (+38.2 %) REGRESSION |
| startup.cold.renderer-modules-ms | 122 (10, 2.8) | 119 (10, 1.4) | 123 (10, 3.8) | -2.8 (-2.3 %) within budget | +1.1 (+0.9 %) within budget |
| startup.cold.settled-main-ws-kb | 201096 (10, 88.0) | 210896 (10, 40.0) | 210864 (10, 72.0) | +9800 (+4.9 %) within budget | +9768 (+4.9 %) within budget |
| startup.cold.settled-renderer-ws-kb | 318632 (10, 528) | 294000 (10, 296) | 293632 (10, 440) | -24632 (-7.7 %) within budget | -25000 (-7.8 %) within budget |
| startup.cold.settled-tree-rss-kb | 744864 (10, 1440) | 716616 (10, 272) | 716672 (10, 2000) | -28248 (-3.8 %) within budget | -28192 (-3.8 %) within budget |
| startup.cold.window-created-ms | 215 (10, 11.7) | 215 (10, 1.2) | 212 (10, 7.4) | -0.6 (-0.3 %) within budget | -3.7 (-1.7 %) within budget |
| startup.warm.bootstrap-done-ms | 355 (10, 2.5) | 323 (10, 2.7) | 322 (10, 1.6) | -32.1 (-9.0 %) within budget | -32.4 (-9.1 %) within budget |
| startup.warm.bootstrap-start-ms | 342 (10, 2.7) | 306 (10, 3.1) | 305 (10, 1.6) | -36.0 (-10.5 %) improvement | -36.5 (-10.7 %) improvement |
| startup.warm.close-ms | 45.0 (10, 3.5) | 40.0 (10, 3.0) | 45.5 (10, 4.0) | -5.0 (-11.1 %) within budget | +0.5 (+1.1 %) within budget |
| startup.warm.create-window-ms | 165 (10, 2.0) | 168 (10, 1.4) | 166 (10, 0.7) | +2.5 (+1.5 %) within budget | +0.8 (+0.5 %) within budget |
| startup.warm.did-finish-load-ms | 343 (10, 2.6) | 245 (10, 2.7) | 244 (10, 1.5) | -98.2 (-28.7 %) improvement | -98.8 (-28.8 %) improvement |
| startup.warm.home-rendered-ms | 368 (10, 2.3) | 336 (10, 2.8) | 335 (10, 1.5) | -32.5 (-8.8 %) within budget | -33.1 (-9.0 %) within budget |
| startup.warm.navigation-start-ms | 251 (10, 1.9) | 214 (10, 1.9) | 212 (10, 0.7) | -36.7 (-14.6 %) improvement | -38.6 (-15.4 %) improvement |
| startup.warm.process-started-ms | 29.8 (10, 0.9) | 30.2 (10, 1.1) | 30.2 (10, 1.1) | +0.4 (+1.4 %) within budget | +0.4 (+1.3 %) within budget |
| startup.warm.ready-to-show-ms | 370 (10, 3.4) | 249 (10, 3.1) | 247 (10, 1.0) | -121 (-32.7 %) improvement | -123 (-33.2 %) improvement |
| startup.warm.renderer-bootstrap-ms | 13.6 (10, 1.2) | 17.2 (10, 0.4) | 17.1 (10, 0.1) | +3.6 (+26.5 %) within budget | +3.5 (+25.7 %) within budget |
| startup.warm.renderer-modules-ms | 90.6 (10, 0.7) | 91.3 (10, 0.7) | 91.3 (10, 0.8) | +0.7 (+0.8 %) within budget | +0.8 (+0.8 %) within budget |
| startup.warm.settled-main-ws-kb | 205288 (10, 120) | 215048 (10, 48.0) | 215056 (10, 16.0) | +9760 (+4.8 %) within budget | +9768 (+4.8 %) within budget |
| startup.warm.settled-renderer-ws-kb | 257560 (10, 1184) | 225776 (10, 192) | 230424 (10, 584) | -31784 (-12.3 %) improvement | -27136 (-10.5 %) improvement |
| startup.warm.settled-tree-rss-kb | 622632 (10, 1392) | 599904 (10, 4416) | 616352 (10, 1744) | -22728 (-3.7 %) within budget | -6280 (-1.0 %) within budget |
| startup.warm.window-created-ms | 207 (10, 2.2) | 208 (10, 2.1) | 207 (10, 1.0) | +1.6 (+0.8 %) within budget | +0.6 (+0.3 %) within budget |

Startup only, measured again after rer-2-C2, whose startup the computer's load disturbed. C2 is the package of b6a4bfa3, by its default transport, which takes no part in startup.

## C2 against C1

The same trials, with C1 as the baseline.

| Metric | C1 median (n, MAD) | C2 median (n, MAD) | C2 vs C1 |
| --- | ---: | ---: | --- |
| startup.cold.bootstrap-done-ms | 364 (10, 2.3) | 371 (10, 15.3) | +6.2 (+1.7 %) within budget |
| startup.cold.bootstrap-start-ms | 342 (10, 2.4) | 347 (10, 15.4) | +4.2 (+1.2 %) within budget |
| startup.cold.close-ms | 43.5 (10, 4.5) | 45.5 (10, 4.0) | +2.0 (+4.6 %) within budget |
| startup.cold.create-window-ms | 175 (10, 1.0) | 172 (10, 6.7) | -3.0 (-1.7 %) within budget |
| startup.cold.did-finish-load-ms | 250 (10, 2.2) | 251 (10, 9.0) | +0.6 (+0.2 %) within budget |
| startup.cold.home-rendered-ms | 376 (10, 2.3) | 382 (10, 15.1) | +6.7 (+1.8 %) within budget |
| startup.cold.navigation-start-ms | 222 (10, 1.9) | 222 (10, 10.9) | +0.4 (+0.2 %) within budget |
| startup.cold.process-started-ms | 31.3 (10, 0.4) | 30.0 (10, 1.4) | -1.2 (-3.9 %) within budget |
| startup.cold.ready-to-show-ms | 255 (10, 2.6) | 256 (10, 6.9) | +1.8 (+0.7 %) within budget |
| startup.cold.renderer-bootstrap-ms | 22.5 (10, 0.6) | 24.1 (10, 0.5) | +1.6 (+7.1 %) within budget |
| startup.cold.renderer-modules-ms | 119 (10, 1.4) | 123 (10, 3.8) | +3.9 (+3.3 %) within budget |
| startup.cold.settled-main-ws-kb | 210896 (10, 40.0) | 210864 (10, 72.0) | -32.0 (-0.0 %) within budget |
| startup.cold.settled-renderer-ws-kb | 294000 (10, 296) | 293632 (10, 440) | -368 (-0.1 %) within budget |
| startup.cold.settled-tree-rss-kb | 716616 (10, 272) | 716672 (10, 2000) | +56.0 (+0.0 %) within budget |
| startup.cold.window-created-ms | 215 (10, 1.2) | 212 (10, 7.4) | -3.1 (-1.4 %) within budget |
| startup.warm.bootstrap-done-ms | 323 (10, 2.7) | 322 (10, 1.6) | -0.3 (-0.1 %) within budget |
| startup.warm.bootstrap-start-ms | 306 (10, 3.1) | 305 (10, 1.6) | -0.5 (-0.2 %) within budget |
| startup.warm.close-ms | 40.0 (10, 3.0) | 45.5 (10, 4.0) | +5.5 (+13.8 %) within budget |
| startup.warm.create-window-ms | 168 (10, 1.4) | 166 (10, 0.7) | -1.7 (-1.0 %) within budget |
| startup.warm.did-finish-load-ms | 245 (10, 2.7) | 244 (10, 1.5) | -0.6 (-0.2 %) within budget |
| startup.warm.home-rendered-ms | 336 (10, 2.8) | 335 (10, 1.5) | -0.6 (-0.2 %) within budget |
| startup.warm.navigation-start-ms | 214 (10, 1.9) | 212 (10, 0.7) | -1.9 (-0.9 %) within budget |
| startup.warm.process-started-ms | 30.2 (10, 1.1) | 30.2 (10, 1.1) | -0.0 (-0.0 %) within budget |
| startup.warm.ready-to-show-ms | 249 (10, 3.1) | 247 (10, 1.0) | -1.6 (-0.7 %) within budget |
| startup.warm.renderer-bootstrap-ms | 17.2 (10, 0.4) | 17.1 (10, 0.1) | -0.1 (-0.6 %) within budget |
| startup.warm.renderer-modules-ms | 91.3 (10, 0.7) | 91.3 (10, 0.8) | +0.1 (+0.1 %) within budget |
| startup.warm.settled-main-ws-kb | 215048 (10, 48.0) | 215056 (10, 16.0) | +8.0 (+0.0 %) within budget |
| startup.warm.settled-renderer-ws-kb | 225776 (10, 192) | 230424 (10, 584) | +4648 (+2.1 %) within budget |
| startup.warm.settled-tree-rss-kb | 599904 (10, 4416) | 616352 (10, 1744) | +16448 (+2.7 %) within budget |
| startup.warm.window-created-ms | 208 (10, 2.1) | 207 (10, 1.0) | -1.0 (-0.5 %) within budget |
