# Original application baseline

Baseline application: `911dd91`; execution branch starts at `fe50f4f` (planning
records only). Node 20.16.0 / bundled npm 10.8.1, Electron 32.0.2, Angular 18.2.4.

- Clean `npm ci`: passes; original audit classifications unchanged (140 entries).
- `lint:all` and production/main build: pass.
- Electron Mocha main: 74 passing; renderer: 41 passing.
- Angular Karma: all 57 assertions pass, then the runner reports "Some of your
  tests did a full page reload!" / exit-code-1 text while the outer command exits
  0. Reproduced with Angular alone after the build finished, so it is not a
  parallel build artifact. Preserve this distinction until the runner is fixed.
- Test profiles are explicitly isolated with `PLM_TEST_ROOT` before path-caching
  imports. Log clearing in package smoke tests no longer targets the live profile.
- Original screenshots live in `test/e2e/snapshots`; the baseline guard rejects
  regeneration after upgrading Angular or Electron. Final pass counts, negative
  control and packaged-app results are appended once completed.

Raw local evidence is in `.upgrade-artifacts/baseline-*.log`. These files contain
absolute paths and are not committed. The HEIC fixture's public provenance is
in `test/e2e/fixtures/README.md`.

Completed baseline results:

- All seven Electron/website regression cases pass with visual comparison.
- Actual local JPEG and HEIC both load in the public embedded companion through
  the app's IPC path.
- Process-worker HEIC output is 300x400; decoded pixel SHA-256 is committed in
  `test/e2e/snapshots/heic-thumbnail.json`; corrupt input is classified correctly.
- Mac universal signed DMG + updater ZIP creation, mount, 60-second app launch,
  main/renderer logs, graceful quit and detach all pass. This package test skips
  notarization as designed; it is not notarization evidence.
- The first whole-page negative-control attempt moved the toolbar button 20px
  but was below the whole-page pixel threshold; a focused toolbar snapshot was
  added to make this regression observable. The focused control result is
  recorded after running it.

The focused toolbar negative control fails at `toolbar.png` after the deliberate
20px movement (see local `visual-negative-control-focused.log`). This establishes
that the comparison catches that concrete UI regression. Baseline application
and test harness checkpoint: `926a777`.
