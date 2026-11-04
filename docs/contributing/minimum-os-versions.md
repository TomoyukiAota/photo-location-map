# Minimum macOS and Windows versions

Read this before upgrading Electron, or before raising the oldest macOS or
Windows that the app supports.

Electron follows Chromium in dropping old OS versions: Electron 23 needs
Windows 10, and Electron 45 needs macOS 13.0. Before downloading an update,
auto-update compares the minimum declared for the release with the computer's
OS version, and skips an update that the computer cannot run
([`configure-auto-update.ts`](../../src-main/auto-update/configure-auto-update.ts)).
That computer stays on the version it has, and analytics records
`Auto-update: Skipped for OS version`. Neither electron-updater nor the NSIS
installer checks the OS version otherwise.


## Where the minimums are declared

[`electron-builder.json`](../../electron-builder.json) declares the minimums:

- macOS: `mac.minimumSystemVersion` becomes `LSMinimumSystemVersion` in
  `Info.plist`, which macOS checks when the app is opened.
  `mac.releaseInfo.vendor.minimumSystemVersion` goes into `latest-mac.yml`. Both
  values must be the same.
- Windows: `win.releaseInfo.vendor.minimumSystemVersion` goes into `latest.yml`.
  It is compared with the version that Windows reports, such as `10.0.19045`;
  Windows 11 is `10.0.22000` or later.


## When upgrading Electron

1. Find the oldest macOS and Windows that the new Electron supports.
   - macOS: run `npm run test:package` on macOS; the macOS CI runs it too. It
     fails when Electron is built for a newer macOS than the declared minimum,
     and names the version to declare.
   - Windows: no test can tell. Read
     ["Platform support"](https://github.com/electron/electron#platform-support)
     in Electron's README and the "Removed:" entries in its
     [breaking changes](https://github.com/electron/electron/blob/main/docs/breaking-changes.md).
2. Raise the values in `electron-builder.json` to those versions, or higher.
3. Release it only after a release containing the auto-update check has been out
   long enough for computers below the new minimum to update to it. The check
   protects only installs that already have it: a computer still on an older
   version installs the update anyway, and is left with an app that does not
   start.
4. State in the release notes which OS versions the release needs, and which
   version of the app is the last one for older ones.
