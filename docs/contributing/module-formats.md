# Module formats

JavaScript has two module formats, ES modules (`import`) and CommonJS
(`require`). Everything in this repository is an ES module, except the preload
scripts, which Electron runs as CommonJS. This page says which part is which,
and the rules that keep it so.


## Which part has which

| Part | Written with | Runs as |
|:--|:--|:--|
| The renderer, `src/` | TypeScript, `import` | ES modules, which Angular's build bundles |
| The main process, `src-main/`, and what it shares with the renderer, `src-shared/` | TypeScript, `import` | ES modules, which `tsc` writes into `out/app` (`tsconfig.src-main.json`), with the modules of `electron-util/` that they import. The renderer bundles the files of `src-shared/` that it imports from their TypeScript. |
| The preload scripts, `electron-util/preload/*.cjs` | `require` | CommonJS: Electron runs the preload of a sandboxed page as CommonJS only |
| The Electron-Mocha tests, `test/**/*.spec.em.*.ts` | TypeScript, `import` | ES modules, which `tsc` writes into `out/em` (`test/em.tsconfig.json`) with the sources that they import. Electron-Mocha imports them in the main process, and loads them with `require()` in the renderer, which loads an ES module that awaits nothing at its top. |
| The scripts of the build and of a release, `script/**/*.js` | `import` | ES modules, run by Node; electron-builder imports `script/notarize/notarize.js` as its `afterSign` hook |
| The tests and tools that Node or Electron runs directly, and the configuration of ESLint and Playwright, `*.mjs` | `import` | ES modules |
| The configuration of Mocha, `test/em-*.mocharc.jsonc` | JSON with comments | Mocha loads a configuration in JavaScript with `require()`, so it is data |


## The rules

1. **`package.json` says `"type": "module"`.** A `.js` file is an ES module.
   A file is `.cjs` only where it must be CommonJS, as a preload script.
2. **A relative import names its file**, as Node asks of an ES module: `.js`
   for a `.ts` (`'../log/logger.js'`), `/index.js` for a folder, and a JSON
   file with `with { type: 'json' }`. `tsc` fails an import without it in
   `src-main/`, `src-shared/` and the tests. A file of `src/` that the
   Electron-Mocha tests load has the extensions too: the tests run it in Node.
3. **`tsc` writes into `out/`, not beside the sources.** The renderer's build
   bundles `src-shared/` from its TypeScript, and for an import of `./foo.js`,
   esbuild takes a `foo.js` beside `foo.ts` over the source. Before it
   compiles, `script/build/remove-stale-output.js` removes the folder that
   `tsc` writes, which keeps the output of a source that was removed, and what
   earlier builds wrote beside the sources.
4. **There is no `require`, `__dirname` or `__filename`.** Load a module with
   `import`, or with `import()` when it is loaded late or may be missing, as
   chokidar in development. A path beside a file is `import.meta.dirname`.
   `createRequire()` stays where a loader of CommonJS is what is wanted: the
   e2e suite loads modules in the main process with it
   (`electron-util/e2e-test-hooks.js`).
5. **A CommonJS package is imported by its default export**
   (`import _ from 'lodash'`), which is its `module.exports`. Node finds the
   named exports of a CommonJS package by reading its code, and finds none of
   lodash's, moment's or exifr's, only some of fs-extra's (not `existsSync`),
   and not electron-updater's `autoUpdater`, which is a getter. A named import
   of an export that Node does not find fails when the module is loaded, but a
   namespace import (`import * as fsExtra`) fails only when the missing export
   is used.
6. **A test that replaces a function of Node's modules**, as
   `child_process.spawn`, does so on the CommonJS module and calls
   `syncBuiltinESMExports()` of `node:module` after it, and after it puts the
   function back: the application reads the function from the ES module, whose
   exports follow the CommonJS module's only then.
7. **What must run before Electron's `ready` is imported, not loaded with
   `import()`.** Electron loads the main process as an ES module, and emits
   `ready` once the main module and what it imports have run; a module loaded
   with `import()` may run after it
   ([Electron's documentation](https://www.electronjs.org/docs/latest/tutorial/esm)).
   For the same reason, the main module does not `await app.whenReady()` at
   its top: `ready` waits for the module, which waits for `ready`, and the
   application hangs, as a check with Electron 45.2.1 did.
8. **A new script or tool is an ES module**: `.js` in `script/`, which ESLint
   checks as such, and `.mjs` elsewhere.
9. **The renderer prefers dependencies that are ES modules**, which the build
   can cut down to what is used. The build warns about a CommonJS one; the
   ones in use are listed in `angular.json` (`allowedCommonJsDependencies`),
   so that a new one stands out, and in
   [dependencies.md](./dependencies.md#commonjs-modules-in-the-renderer) with
   what each is there for.


## Why the preload scripts stay CommonJS

The main window and Photo Data Viewer's window are sandboxed
(`electron-util/electron-web-preferences.js`), as Electron recommends for
most applications. Electron runs the preload script of a sandboxed page as a
script, without the loader of ES modules, and gives it a `require` that loads
`electron` and none of the application's files
([Electron's documentation](https://www.electronjs.org/docs/latest/tutorial/esm)).
A preload script can be an ES module only without the sandbox, which would
give it Node.js. Each preload is a single file, so it needs no bundler either.


## In a package

The application's code is in `app.asar`, with the fuses that let it load only
from there (`docs/contributing/electron-fuses.md`). The main process, the
worker thread that reads the trees of folders, and the processes that make
the thumbnails of HEIF photos, which workerpool starts with
`child_process.fork`, load their ES modules from the archive.
