# macOS disk image command deprecations

## Evidence and scope

The first successful package smoke test on macOS 27.0.1 emitted:

```text
hdiutil: WARNING: 'hdiutil attach ...' is deprecated. Please use 'diskutil image attach ...' instead.
```

This comes from the repository's smoke-test prelaunch command, not the app.
The host's `hdiutil help` also marks `detach` deprecated and names
`diskutil eject` as its replacement. There is no `diskutil image detach` verb.

Primary local documentation was inspected directly on the host:

- `/usr/sbin/diskutil image attach`: no arguments print usage and return zero;
  accepts an image path, attaches it, and mounts its filesystem by default.
- `/usr/sbin/diskutil eject`: accepts a mount point, disk identifier, or device.
- `man diskutil`: the `image` section documents the same defaults; `DEVICES`
  permits mount-point arguments, and `HISTORY` dates image attachment to
  macOS 13.0. No increase of the supported minimum OS is needed.
- `/usr/sbin/diskutil image detach`: rejects the verb with exit status 64.

## Implementation

`script/package-test/disk-image-tools.js` probes the installed diskutil with the
no-argument `image attach` usage request. It chooses the new commands only when
the probe succeeds and prints the expected command usage. This probe cannot
mount an image because no image argument is passed. Older/unavailable commands
retain the previous hdiutil attach/detach pair.

`PackageTestInfo` uses the selected attachment command for the existing DMG path.
Smoke-test cleanup uses the corresponding `diskutil eject` or `hdiutil detach`
with its existing volume mount point. App quit and bounded cleanup retries are
unchanged. A real attachment failure remains a test failure; it never retries via
the deprecated tool. No electron-builder internals or publishing commands change.

## Validation

- Prepared the helper and capability tests in an isolated temporary directory
  before editing repository package scripts.
- `mise exec -- node --test test/package-test/disk-image-tools.cjs`: 4/4 pass.
  Covers supported usage from stdout/stderr, older help formats, missing tools,
  and unsuccessful capability probes. No volume is mounted by these tests.
- ESLint on the new helper and changed package-info/smoke scripts: pass.
- Real release-DMG attach/eject validation on macOS 27.0.1: pass. The selected
  `/usr/sbin/diskutil image attach` command mounted the existing universal DMG;
  its app executable existed at the expected volume path; `diskutil eject`
  returned zero and removed the mount point. No deprecation warning appeared.
  Raw local log: `.upgrade-artifacts/deprecation-warnings/disk-image-validation.log`.
- Full signed package and final package smoke: coordinated by the parent agent.

## Resume

Implementation and isolated real-DMG validation are complete. Add the focused
test file to the existing `test:package-runner` command if not already present.
The parent agent owns signed packaging and final package smoke. No disk image or
app process from this investigation remains mounted or running.
