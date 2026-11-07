# Application regression checks

Build first, then run against the checkout:

```sh
mise exec -- npm run build:prod
PLM_VISUAL=1 mise exec -- npm run test:e2e
```

On macOS and Windows, the application's windows stay off the screen, as
Playwright's own browsers do, so that a run does not take over the screen. To
watch them, add Playwright's `--headed` option:

```sh
mise exec -- npm run test:e2e -- --headed
```

In such a headless run, the suite passes `PLM_TEST_HEADLESS=1` to the
application, which reads it only with a `PLM_TEST_ROOT` test profile:

- On macOS, the windows are hidden. Hidden windows render as shown ones do: the
  visual comparisons use the same references, and the run takes as long.
- On Windows, a hidden window gets about one animation frame per second once its
  page changes: the suite took 3.7 minutes instead of 1.6 on CI, and the map case
  failed. So the windows are shown, but fully transparent, click-through and never
  activated, and they are left out of the taskbar and Alt+Tab. The measurements
  are in `electron-util/e2e-test-hooks.js`.

Either way, the application does not restore a saved maximized or full-screen
main window, as that would show the window or bring it to the front. The suite
checks that the main and Photo Data Viewer windows are kept off the screen only
in a headless run, and that the main window keeps getting animation frames while
its page changes, rather than about one per second.

On Linux, the windows are still shown. There, a hidden window gets animation
frames far less often, too: the suite took 4.8 minutes instead of 2.1 on Ubuntu
CI. Linux CI runs under Xvfb, so its windows are not on anyone's screen.

To exercise the existing development-server flow, start `mise exec -- npm run
ng:serve`, wait for `http://localhost:4200/`, then set
`PLM_E2E_LIVE_RELOAD=1` for the checkout tests. This uses the application's real
`--live-reload` option and asserts the HTTP origin. Stop the server afterward.

On macOS, run the same application flows against the actual final signed bundle:

```sh
PLM_PACKAGED_EXECUTABLE="$PWD/release/mac-universal/Photo Location Map.app/Contents/MacOS/Photo Location Map" \
  PLM_VISUAL=1 mise exec -- npm run test:e2e
```

This mode asserts the real executable/resources, packaged flag, production
profile, dependency manifest, Electron/Node versions and architecture. Worker
and JPEG dependencies come from the bundle, while public photo fixtures stay
in the checkout. The separate website case is skipped. The bundle must include
the fixed test helper **before signing**; never modify it after signing.

The controller creates its own temporary profile. `PLM_E2E=1` requires an
absolute `PLM_TEST_ROOT`; only known injected debugger flags are removed.
Normal startup is unaffected. Test-profile launches intercept analytics and
release downloads without disabling SDK initialization or application logging.

For the x64 half of a universal app on Apple Silicon, create an external shell
launcher that executes `/usr/bin/arch -x86_64` with the same verified binary and
forwards `"$@"`. Set its absolute path as `PLM_E2E_LAUNCHER`, retain
`PLM_PACKAGED_EXECUTABLE`, and set `PLM_E2E_EXPECTED_ARCH=x64`. The suite checks
Rosetta translation. Verify bundle signatures before and afterward. This
supplements the required native Intel CI run.

Visual comparisons use the committed original references. During this migration,
set `PLM_REQUIRE_ORIGINAL_STACK=1` to reject `--update-snapshots` unless the
original Angular 18.2.4 / Electron 32.0.2 pair is installed. Do not broaden
tolerances or replace references with upgraded output. Future intentional UI
changes can update references normally with Playwright's `--update-snapshots`
option when the migration guard is unset.

The visual references are macOS arm64 at a 1200x800 content size. Keep the same
display scaling, locale and fonts. OpenStreetMap tiles can vary independently;
inspect any difference. Date examples and temporary cache paths are masked.
Nonvisual runs fit the physical work area so native pointer events stay on screen.
`PLM_E2E_COMPACT=1` exercises a 960x600 maximum content area locally. Map checks
count represented photos across marker clusters; clustering can change with size.
The HEIC JSON comparison uses its parsed dimensions/hash, independent of Git's
Windows line-ending conversion, with the original reference unchanged.
The owner-approved decoder update uses a separate strict version-labelled
reference in `approved-references/`; the original HEIC baseline is retained.
The real shipped heic-decode/libheif-js versions are asserted with the output.
Nonvisual checks and the approved HEIC decoded-pixel comparison run on every OS.
The resized reference includes a hovered gutter. The test performs a real hover
and checks its color/transition first, then holds that pseudo-state through CDP
only during capture so native focus changes cannot clear it. Product styles and
comparison tolerance are unchanged.

The negative controls `PLM_NEGATIVE_CONTROL=1` and `PLM_MAP_NEGATIVE_CONTROL=1`,
combined with `PLM_VISUAL=1`, deliberately move the Open Folder button by 20px
or the map toolbar by 3px and must fail the welcome/empty-home case.

Coverage includes welcome/about/settings, recursive folder loading, map regions,
photo selection, grouping/zoom/reset, splitters, chooser/window/settings restart
behavior, analytics payloads, the actual HEIC worker and corrupt input, public
embedded JPEG/HEIC viewing and the download website. Map/embedded viewer checks
need network access. Further platform/packaging results belong in task STATUS;
they are not implied by a checkout run.
