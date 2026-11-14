# Turn off runAsNode and enableNodeCliInspectArguments: status

Done on 2026-11-14. [electron-fuses.md](../../contributing/electron-fuses.md)
has how each fuse is set, and why.

## What was asked

When the fuses were set ([the previous task](../20261114_electron-fuses/PLAN.md)),
two were left on, `runAsNode` and `enableNodeCliInspectArguments`: turning
them off needed the thumbnails' workers to be started otherwise, and the
tests to control a package otherwise. The owner asked for that to be weighed,
and done if it is worth doing.

## Whether it is worth doing

It is, for these reasons.

- **What it closes.** With either fuse on, other software can run its code as
  Photo Location Map: `ELECTRON_RUN_AS_NODE=1` runs a script in the
  application's executable, and `--inspect` opens the main process to a
  debugger. On macOS such code has the application's permissions, such as to
  the folders that the user let it read, which hold the user's photos and
  where they were taken. Turning off one without the other closes little, as
  either is enough. The templates of Electron Forge, Electron's own tool to
  package an application, turn both off
  (`packages/template/base/tmpl/forge.config.js` of `electron/forge`).
- **What the workers cost.** Electron refuses `child_process.fork` with
  `runAsNode` off, and offers `utilityProcess.fork` in its place. A check
  with Electron 45.2.1 started a process of each kind, sent it a message and
  waited for the answer and the end: 42 ms each, one at a time, and 7.7 ms
  (fork) and 9.6 ms (utility process) each, eight at once: a utility process
  costs a thumbnail 2 ms at most.
- **What the tests cost.** Playwright controls the main process through
  Node's inspector, and the e2e suite evaluates code there 63 times, so the
  suite cannot do without it. It runs a copy of the package whose only
  difference is that fuse, which electron-builder can make on each operating
  system, AppImage included: it packs a folder given with `--prepackaged` as
  it is, without setting fuses. The package itself stays checked by the
  package test: its fuses, and its installation and launch.

## What changed

- `electron-builder.json` turns off `runAsNode` and
  `enableNodeCliInspectArguments`; the package test checks the package's
  fuses against it, as before.
- **The thumbnails' workers** are utility processes
  (`generateThumbnailInProcess` in
  `src-main/thumbnail-generation/thumbnail-generation.ts`). As before, each
  thumbnail gets a process of its own, as a process's memory grows with each
  that it makes, and at most one less than the physical cores run at once.
  The worker answers through `process.parentPort`. A worker that ends without
  answering, as when it crashes, fails its file as `worker-failed`, as
  before. workerpool, which only started the processes, is removed.
- **The copy for the tests**: `script/package-test/inspectable-package.js`
  makes it in `release/e2e/` with `@electron/fuses`, the version that
  electron-builder uses, and prints its executable. On macOS it copies the
  application and signs it again ad hoc, as the fuse is in the signed
  framework of Electron, and without the hardened runtime. Signed again as
  `@electron/fuses` does (`resetAdHocDarwinSignature`), which keeps the
  hardened runtime, the copy did not start: the runtime's library validation
  refused the framework, "mapping process and mapped file (non-platform) have
  different Team IDs", as a signature made ad hoc has no team. On Windows it copies the application as the installer installed it;
  on Linux it copies `release/linux-unpacked` and packs an AppImage of it,
  so that the e2e suite still runs the application from an AppImage, and
  relaunches it from one. The three CI workflows run the e2e suite against
  it, and the READMEs of the e2e suite and of the performance harness say to.

## Checks

On macOS (Apple Silicon), 2026-11-14.

| Check | Result |
| --- | --- |
| `npm run lint:all`, `npm run typecheck:build-config` | passed |
| `npm run test:unit:em:main` | 264 passing, 2 pending: with a test of `generateThumbnailInProcess` against stand-in workers, which answer, crash, or end without answering |
| `npm run test:package-runner` | 28 tests passed, with the new settings of the fuses |
| `npm run test:package`, in a clone made for it, as it stops before its smoke test in a worktree (`AGENTS.md`) | passed: the signed universal package (not notarized) has `runAsNode` and `enableNodeCliInspectArguments` off in both halves of its binary, and the application started from the DMG and wrote the log of both processes |
| `npm run test:e2e` with `PLM_VISUAL=1`, against the copy that `inspectable-package.js` made of that package | 48 passed, 2 skipped (the OS tab, on Windows only, and the website, which is not part of a package), as against a package before. The thumbnails of HEIC photos were made in utility processes, which loaded their modules from `app.asar`, and the cases that relaunch the application passed. |

Windows and Linux, the copy of the installed application and the AppImage of the copy, are checked by CI.
