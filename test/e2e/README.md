# Application regression checks

Build first, then run against the checkout:

```sh
mise exec -- npm run build:prod
PLM_VISUAL=1 mise exec -- npm run test:e2e
```

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

Visual comparisons use the committed original references. Snapshot updates are
rejected unless the original Angular 18.2.4 / Electron 32.0.2 pair is installed.
Do not broaden tolerances or replace references with upgraded output.

The visual references are macOS arm64 at a 1200x800 content size. Keep the same
display scaling, locale and fonts. OpenStreetMap tiles can vary independently;
inspect any difference. Date examples and temporary cache paths are masked.
Nonvisual checks and the original HEIC decoded-pixel comparison run on every OS.
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
