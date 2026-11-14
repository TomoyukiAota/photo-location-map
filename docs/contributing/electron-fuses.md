# Electron's fuses

Electron's fuses are switches in Electron's binary, set when the application is
packaged, which turn some of Electron's features on or off
([Electron's documentation](https://www.electronjs.org/docs/latest/tutorial/fuses)).
electron-builder sets them from `electronFuses` in `electron-builder.json`, just
before it signs a package. On every operating system, the package test reads
them from the package that it built (`script/package-test/electron-fuses.js`),
and fails when one differs from `electron-builder.json`, or when Electron has a
fuse that has not been decided here.

## How each is set

| Fuse | Electron's default | Here | Why |
| --- | --- | --- | --- |
| `runAsNode` | on | **off** | Nothing runs the application as Node.js: the workers of the HEIF thumbnails are Electron's utility processes, which do not need it, where `child_process.fork`, which they were started with before, does. |
| `enableCookieEncryption` | off | off | Nothing that needs protecting is in cookies. Turning it on cannot be undone: a package with it off again could not read them. |
| `enableNodeOptionsEnvironmentVariable` | on | **off** | Nothing reads `NODE_OPTIONS` or `NODE_EXTRA_CA_CERTS`, and no environment variable is to add code to the application's processes (`NODE_OPTIONS=--require …`). Electron ignores `NODE_OPTIONS` in the main process of a package by itself. |
| `enableNodeCliInspectArguments` | on | **off** | Nothing starts the application's inspector but Playwright, which controls a copy of the package with this fuse on ([below](#the-tests-of-a-package)). |
| `enableEmbeddedAsarIntegrityValidation` | off | **on** | On macOS and Windows, a changed `app.asar` does not run. A worker process takes about 4 ms more to load its code from the archive. |
| `onlyLoadAppFromAsar` | off | **on** | Electron loads no `app` folder in place of `app.asar`, which would get round the check above. |
| `loadBrowserProcessSpecificV8Snapshot` | off | off | The application has no V8 snapshot of its own. |
| `grantFileProtocolExtraPrivileges` | on | on | The main window's page is a `file:` URL in the package, and does not start with this fuse off. |
| `wasmTrapHandlers` | on | on | electron-builder 26 cannot set it. The workers of the thumbnails decode HEIC with WebAssembly, which it makes faster. |

[The task that set them](../tasks/20261114_electron-fuses/PLAN.md), and
[the one that turned off `runAsNode` and `enableNodeCliInspectArguments`](../tasks/20261114_close-node-fuses/STATUS.md),
have what was tried and measured.

## The tests of a package

The e2e suite and the performance harness control the application's main
process through Node's inspector, which Playwright starts with `--inspect`,
and which a package does not start. They run a copy of the package with
`enableNodeCliInspectArguments` on, which
`script/package-test/inspectable-package.js` makes in `release/e2e/` and whose
executable it prints: on macOS, a copy of the application signed again ad hoc,
without the hardened runtime; on Windows, a copy of the application that the installer installed; on Linux,
an AppImage of a copy of `release/linux-unpacked`. The package itself is
checked by the package test: its fuses, and its installation and launch,
which do not use the inspector.

## What is still open

With `runAsNode` and `enableNodeCliInspectArguments` off, other software can
no longer run its code as Photo Location Map, with `ELECTRON_RUN_AS_NODE=1` or
`--inspect`, which on macOS would have the application's permissions, such as
to the folders that the user let it read.

- `grantFileProtocolExtraPrivileges` can be turned off once the main window's
  page is served from a protocol of the application's own (`protocol.handle`)
  rather than from `file:`.

## When the package test fails on the fuses

- **A fuse differs from `electron-builder.json`**: electron-builder did not set
  it. Read its log for "executing @electron/fuses", and check whether an
  upgrade of electron-builder changed `electronFuses`.
- **`electronFuses` does not set a fuse**: every fuse that electron-builder can
  set is decided here, so that none is left to Electron's default, which a
  later Electron can change. Set it, and say why in the table above.
- **Electron has more fuses than the check knows**: an Electron upgrade added
  one. Read Electron's documentation of it and decide it. If electron-builder
  can set it, add it to `electronFuses`; if not, add it to `unsettableFuses`
  in `script/package-test/electron-fuses.js`, with Electron's default. Add it
  to `fuseNames` there and to the table above.
- **A fuse is removed**: Electron no longer has it. Take it out of
  `electronFuses` once electron-builder no longer sets it, and out of the table.

To read the fuses of a package:
`npx @electron/fuses read --app "release/mac-universal/Photo Location Map.app"`,
or the executable of `release/win-unpacked/` or `release/linux-unpacked/`.
