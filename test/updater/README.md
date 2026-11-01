# Isolated Mac updater integration

Run after the normal build has generated the current main/shared JavaScript:

```sh
mise exec -- npm run build:src-main
mise exec -- node test/updater/run.cjs --report .upgrade-artifacts/updater-transport.json
```

The default ZIP is a deterministic, synthetic transport fixture. It contains no
application and cannot establish installation, signing or rollback behavior.
To repeat the download checks with the final signed universal ZIP:

```sh
mise exec -- node test/updater/run.cjs \
  --artifact 'release/Photo Location Map-1.12.2-alpha-universal-mac.zip' \
  --report .upgrade-artifacts/updater-final-zip.json
```

`PLM_UPDATER_ARTIFACT` is an alternative to `--artifact`. Explicit artifacts must
be inside this checkout's `release/` or `.upgrade-artifacts/`. Reports are limited
to `.upgrade-artifacts/`. The launcher creates and removes its own temporary
profile, and passes no signing or publishing credentials to Electron.

The test executes the actual compiled application version/startup guards in a
VM with controlled dependencies. It separately exercises electron-updater 6's
real `MacUpdater`, HTTP executor, generic loopback feed, availability policy,
full ZIP download, SHA-512 verification, persistent cache reuse and corrupt
checksum rejection. The generic provider does not apply GitHub's prerelease
filter; application prerelease gating is checked separately.

App data, user data, session data, logs, crash dumps, temporary files and the
updater's independent cache all stay in the test-owned directory. Non-loopback
updater traffic is blocked. Native feed initialization is captured in memory;
native checks/install calls and adapter quit/relaunch fail immediately. Thus
Squirrel never initializes or accesses its operating-system cache. The internal
executor injection is a version-checked test seam, not application configuration.

Even when given a signed application ZIP, this is a **download-only** check. It
does not install, restart, roll back, validate a code signature or prove that a
public release feed offers the right release. Verify those separately and retain
the prerelease production guard. The final JSON explicitly records these limits.
