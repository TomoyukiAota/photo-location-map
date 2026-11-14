# The move to ES modules: status

Done on 2026-11-14. See [module-formats.md](../../contributing/module-formats.md)
for the rules that follow from it.

## What was asked

Whether the main process should be turned into ES modules, if that is the best
practice. ES modules are JavaScript's standard format, and the one that new
code is written in; since Node can `require()` an ES module, a CommonJS
application is no longer stuck on the packages that are ES modules only, so
moving one is not urgent. The owner decided to move now, while the work is on
what users do not see, so that the work on features can follow it, and not to
force what has to stay CommonJS, such as the preload scripts.

The move waited for the changes to the package that were under way, which
touched the same files: the application in an asar archive (#702) and
Electron's fuses (#703).

## What changed

| Part | Before | Now |
| --- | --- | --- |
| `package.json` | `"type": "commonjs"` | `"type": "module"`, and `main` in `out/app` |
| The main process, `src-main/` and `src-shared/` | CommonJS, which `tsc` wrote beside each `.ts` | ES modules, which `tsc` writes into `out/app` |
| What a package holds | `dist/`, `electron-util/`, `src-main/` and `src-shared/`, sources and output | `dist/`, `out/app/` and `electron-util/preload/` |
| The Electron-Mocha tests | Compiled into CommonJS by ts-node, without checking their types | Compiled into ES modules in `out/em` by `tsc`, without checking their types (`noCheck`). ts-node is removed. |
| Mocha's configuration | `test/em-*.mocharc.js` | `test/em-*.mocharc.jsonc`: Mocha loads a configuration in JavaScript with `require()` |
| The scripts, `script/` | CommonJS | ES modules; electron-builder imports the `afterSign` hook |
| The tests and tools that Node or Electron runs, `test/**/*.cjs` | CommonJS | ES modules, `.mjs` |
| The preload scripts, `electron-util/preload/*.cjs` | CommonJS | CommonJS |

## What was decided, and why

- **`tsc` writes into `out/`, not beside the sources.** The renderer's build
  bundles `src-shared/` from its TypeScript, and an import in an ES module
  names its file, `./foo.js` for `foo.ts`. esbuild, which Angular's build uses,
  takes a `foo.js` that is there over `foo.ts`: a check with both files bundled
  the `.js`. With `tsc`'s output beside the sources, the renderer would have
  bundled the main process's output of the last build in place of the
  sources, and a module that `src/` imports without an extension twice, once
  from each. Nothing is written beside the sources now.
- **`script/build/remove-stale-output.js`** runs before `tsc` and before the
  builds and tests of the renderer. It removes the `.js` and `.js.map` that
  earlier builds wrote beside a `.ts`, which a checkout keeps, as they are
  ignored, and the folder of `out/` that `tsc` writes again, as `tsc` leaves
  there the output of a source that was removed, which a package would ship.
- **The page's path comes from `app.getAppPath()`**, as the preload scripts'
  do, rather than from the folder of the file that asks, which is in `out/app`
  now.
- **A CommonJS package is imported by its default export.** Node finds the
  named exports of a CommonJS package by reading its code. Asked, it found
  none of lodash, moment or exifr, and 33 of fs-extra, without `existsSync`,
  which the application uses: a namespace import gives `undefined` for it, and
  fails only when it is called. electron-updater makes `autoUpdater` with a
  getter, which Node does not find either; electron-builder's documentation of
  auto-update reads it from the default export too.
- **The `require()` calls that loaded a module late are imports**, as each
  reason for them had gone:
  - `record-error.ts` imports `analytics.ts`, which sets nothing up when it
    is imported since the main window was isolated: each process sets its
    analytics, and an event tracked before is kept.
  - The analytics backend's wrapper and its file of unsent events import
    Electron and Node's modules: the renderer no longer loads them, as the
    files of its program say (`tsc -p src/tsconfig.app.json --listFilesOnly`).
  - `managed-exifr` is an ES module, which imports exifr's CommonJS build,
    the one that it required: exifr has no `exports`, and Node does not read
    its `module` field. Its type is the module's, as exifr's declarations type
    `Exifr` in their default export as an instance rather than the class.
  - chokidar, which only development has, is loaded with `import()`, so
    `configureLiveReload` returns a promise. What the watcher does is in
    `src-main/live-reload-watcher.ts`, which imports neither Electron nor
    chokidar, so that the test of live reload runs it with stand-ins, as it
    ran the compiled CommonJS in a VM before.
- **A test that replaces a function of Node's modules syncs their ES modules**
  (`syncBuiltinESMExports()`): the application reads `child_process.spawn` or
  `os.userInfo` from the ES module, which keeps the function that it had
  otherwise. Without it, the e2e suite's stand-in for the command that opens a
  file would not be called, and the file would open.
- **The e2e suite loads the application's modules with `require()` as
  before**: `__plmTestRequire` is made with `createRequire()`, and `require()`
  loads an ES module. The paths are in `out/app`. Its entry, `test/e2e/main.mjs`,
  imports the application once it has set the app's folder and version.
- **The Electron-Mocha tests in the renderer** are loaded with `require()`,
  as Electron-Mocha does in a page without context isolation. Before the
  change, a hidden window checked that a page with Node.js loads ES modules
  that way, with `electron`, `import.meta.dirname` and p-queue, which the
  tests already loaded so. The tests find the repository's files from its
  folder (`test/test-util/repository.ts`), as they run in `out/em`.
- **The tests are not type-checked**, as with ts-node's `transpileOnly`: they
  have no types of Mocha, and use the DOM's. Checking them is a change of its
  own.
- **The package-test runner** takes what its test replaces as parameters
  (`runPackageTest`), rather than being run in a VM with a stand-in for
  `require`, and imports its modules once it has set the test profile, which
  they read when they are loaded.
- **The updater tool** (`test/updater/`) runs the application's update
  checks with stand-ins in a VM. As an ES module is loaded once, it compiles
  their TypeScript into CommonJS for each run, with TypeScript's
  `transpileModule`. It had not run since the texts were translated: its
  stand-ins lacked the new imports, which it has now.
- **A script runs its own code when Node starts it** (`import.meta.main`),
  rather than by comparing its path with `process.argv[1]`, which a different
  case of a Windows drive letter would make it skip, without an error.

## Not done

- TypeScript's recommended `verbatimModuleSyntax`, which an ES module output
  makes possible: it would ask for `import type` wherever only a type is
  imported.
- The checks of the tests' types.

## Checks

On macOS (Apple Silicon), 2026-11-14, in a worktree.

| Check | Result |
| --- | --- |
| `npm run lint:all` | passed |
| `npm run typecheck:build-config` | passed |
| `npm run test:unit:ng` | 59 files, 440 tests passed |
| `npm run test:unit:em:main` | 262 passing, 2 pending |
| `npm run test:unit:em:renderer` | 95 passing |
| `npm run test:dependency-compat` | 4 tests passed |
| `npm run test:package-runner` | 28 tests passed |
| `npm run test:live-reload` | passed: the burst of changes and the five launches |
| `node test/updater/run.mjs` | passed, with the synthetic ZIP |
| `npm run test:e2e` with `PLM_VISUAL=1`, against a production build | 49 passed, 1 skipped (Windows only); no screenshot changed |
| `npm run test:package`, in a clone made for it, as it stops before its smoke test in a worktree (`AGENTS.md`) | passed: the signed universal package (not notarized) has the fuses of `electron-builder.json`, `"type": "module"` in its `package.json`, and in `app.asar` `dist/`, `out/app/`, the two preload scripts and `node_modules/`; the application started from the DMG and wrote the log of both processes |

The cases of the e2e suite open folders, which start the worker thread of the
trees, make thumbnails of HEIC photos in the processes that workerpool forks,
relaunch the application, and open Photo Data Viewer: each loads its ES
modules.
