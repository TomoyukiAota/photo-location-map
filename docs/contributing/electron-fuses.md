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
| `runAsNode` | on | on | workerpool starts the workers of the HEIF thumbnails with `child_process.fork`, which Electron refuses with this fuse off. |
| `enableCookieEncryption` | off | off | Nothing that needs protecting is in cookies. Turning it on cannot be undone: a package with it off again could not read them. |
| `enableNodeOptionsEnvironmentVariable` | on | **off** | Nothing reads `NODE_OPTIONS` or `NODE_EXTRA_CA_CERTS`. Electron ignores `NODE_OPTIONS` in the main process of a package, but `NODE_OPTIONS=--require …` would add code to the processes that it runs as Node.js, such as the workers of the thumbnails. |
| `enableNodeCliInspectArguments` | on | on | Playwright starts the application with `--inspect` to control its main process: the e2e suite against a package, and the performance harness, do. |
| `enableEmbeddedAsarIntegrityValidation` | off | **on** | On macOS and Windows, a changed `app.asar` does not run. A worker process takes about 4 ms more to load its code from the archive. |
| `onlyLoadAppFromAsar` | off | **on** | Electron loads no `app` folder in place of `app.asar`, which would get round the check above. |
| `loadBrowserProcessSpecificV8Snapshot` | off | off | The application has no V8 snapshot of its own. |
| `grantFileProtocolExtraPrivileges` | on | on | The main window's page is a `file:` URL in the package, and does not start with this fuse off. |
| `wasmTrapHandlers` | on | on | electron-builder 26 cannot set it. The workers of the thumbnails decode HEIC with WebAssembly, which it makes faster. |

[The task that set them](../tasks/20261114_electron-fuses/PLAN.md) has what was
tried and measured.

## What is still open

With `runAsNode` and `enableNodeCliInspectArguments` on, other software can
still run code as Photo Location Map, with `ELECTRON_RUN_AS_NODE=1` or
`--inspect`. On macOS, such code has the application's permissions, such as
to the folders that the user let it read. Turning off one without the other
closes little.

- `runAsNode` can be turned off once the workers of the thumbnails are started
  with Electron's `utilityProcess` rather than `child_process.fork`.
- `enableNodeCliInspectArguments` can be turned off once the tests control the
  application without the inspector, or test a package other than the one
  released.
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
