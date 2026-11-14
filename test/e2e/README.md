# Application regression checks

Build first, then run against the checkout:

```sh
mise exec -- npm run build:prod
PLM_VISUAL=1 mise exec -- npm run test:e2e
```

A development build also checks every second for a binding that changed
without telling Angular, which an OnPush component or zoneless change detection
would not render (`src/app/app.config.ts`). Angular only logs it, as NG0100, so
the suite fails a case that logged one. Run the suite against such a build after
changing what a view shows:

```sh
mise exec -- npm run build:dev
mise exec -- npm run test:e2e
```

CI does so on Ubuntu, after its run against the AppImage, which is a production
build (`.github/workflows/ci-on-ubuntu.yml`).

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
CI. Transparent windows, as on Windows, do not help: Electron applies their
opacity to the window's content, which is then not drawn either, and the suite
took 5.0 minutes. Linux CI runs under Xvfb, so its windows are not on anyone's
screen.

To exercise the existing development-server flow, start `mise exec -- npm run
ng:serve`, wait for `http://localhost:4200/`, then set
`PLM_E2E_LIVE_RELOAD=1` for the checkout tests. This uses the application's real
`--live-reload` option and asserts the HTTP origin. Stop the server afterward.

On macOS, run the same application flows against the actual final signed bundle:

```sh
PLM_PACKAGED_EXECUTABLE="$(mise exec -- node script/package-test/inspectable-package.js)" \
  PLM_VISUAL=1 mise exec -- npm run test:e2e
```

This mode asserts the real executable/resources, packaged flag, production
profile, dependency manifest, Electron/Node versions and architecture. Worker
and JPEG dependencies come from the bundle, while public photo fixtures stay
in the checkout. The separate website case is skipped. The bundle must include
the fixed test helper **before signing**; never modify it after signing.

The suite runs a copy of the package, which `inspectable-package.js` makes in
`release/e2e/` and whose executable it prints: Playwright controls the
application through Node's inspector, and the package has the fuse that lets
`--inspect` start it off. The copy has that fuse on, and differs from the
package by it alone; on macOS it is signed again ad hoc, without the hardened
runtime (`docs/contributing/electron-fuses.md`).

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
display scaling and color profile, locale and fonts. OpenStreetMap tiles can
vary independently; inspect any difference. Date examples and temporary cache
paths are masked.
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

CI compares the screenshots on macOS arm64 too, against references of its own
in `snapshots-ci/macos-26-arm64/`, which `PLM_VISUAL_REFERENCES` selects. The
runner draws them differently from the Mac that `snapshots/` matches, by more
than the comparisons allow. Its macOS sets text differently: some lines move by
a pixel, and the chart's axis labels, drawn in the system's sans-serif font,
are narrower, so the axis shows other dates. Its saturated colors are plain
sRGB, while the Mac converted them, as a display's color profile does:
Material's red #F44336 is (225, 82, 65) in `snapshots/`. CI's set is not the
original one: the runner wrote it from an application whose screenshots matched
`snapshots/` locally. CI runs the packaged application, so it has no
screenshots of the website case. To write the set anew, after an intentional
change or when the runner's fonts change, run "CI on macOS" by hand with
`update_screenshots`:

```sh
gh workflow run ci-on-mac.yml --ref <branch> -f update_screenshots=true
```

Its artifact `screenshots-macos-26-arm64` holds the folder, with the references
that differed written anew. Compare them with `snapshots/` before committing
them: they should differ only in how text is set and in saturated colors.

The negative controls `PLM_NEGATIVE_CONTROL=1` and `PLM_MAP_NEGATIVE_CONTROL=1`,
combined with `PLM_VISUAL=1`, deliberately move the Open Folder button by 20px
or the map toolbar by 3px and must fail the welcome/empty-home case.

The suite runs in English on a machine in any language: with a test profile,
the application takes `en-US` as the operating system's language instead of
asking the machine (`src-main/startup/startup-metadata-setup.ts`). A case of
another language gives the languages in `PLM_TEST_SYSTEM_LANGUAGES`, as
`launchAsNew({ env: { PLM_TEST_SYSTEM_LANGUAGES: 'ja-JP,en-US' } })` does. A new
profile shows the Language dialog first; `launch()` confirms it, with the
language that it offers, unless it is asked to keep it. The references ending
in `-ja` are of the application in Japanese, whose text is set in the system's
Japanese font.

Coverage includes the Language dialog, a restart in another language, a Japanese
launch, welcome/about/settings, recursive folder loading, map regions,
photo selection, grouping/zoom/reset, splitters, chooser/window/settings restart
behavior, analytics payloads, the actual HEIC worker and corrupt input, public
embedded JPEG/HEIC viewing and the download website. Map/embedded viewer checks
need network access. Further platform/packaging results belong in task STATUS;
they are not implied by a checkout run.
