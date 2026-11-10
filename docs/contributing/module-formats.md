# Module formats

JavaScript has two module formats, ES modules (`import`) and CommonJS
(`require`), and this repository has both. This page says which part has
which, the rules that keep them apart, and why the main process is not turned
into ES modules.


## Which part has which

| Part | Written with | Runs as |
|:--|:--|:--|
| The renderer, `src/` | TypeScript, `import` | ES modules, which Angular's build bundles |
| The main process, `src-main/`, and what it shares with the renderer, `src-shared/` | TypeScript, `import` | CommonJS, which `tsc` writes next to each file (`tsconfig.src-main.json`). The renderer bundles the files of `src-shared/` that it imports as ES modules. |
| The preload scripts, `electron-util/preload/*.cjs` | `require` | CommonJS: Electron loads the preload script of a sandboxed page as CommonJS only |
| What the main process and the tests load at run time, `electron-util/*.js` and `*.cjs` | `require` | CommonJS |
| The scripts of the build and of a release, `script/**/*.js` | `require` | CommonJS, run by Node; electron-builder loads `script/notarize/notarize.js` as its `afterSign` hook |
| The tests that Node or Electron runs directly, `test/**/*.cjs` and `test/*.js` | `require` | CommonJS |
| The configuration of ESLint and Playwright, the e2e suite and the performance harness, `*.mjs` | `import` | ES modules |

So the application's own code is written with `import` everywhere. What differs
is what it runs as, and CommonJS is left to the files that something loads with
`require`.


## The rules

1. **`package.json` says `"type": "commonjs"`.** A `.js` file of this
   repository is CommonJS. That is Node's default without the field, and Node's
   documentation asks for the field anyway: it says what the files are without
   reading them, to Node and to every tool.
2. **An ES module has the extension `.mjs`.** A CommonJS file is `.js`, or
   `.cjs` where it must stay CommonJS whatever the package says, as a preload
   script must.
3. **TypeScript loads a module with `import`.** `npm run lint:main` fails a
   `require()` in `src-main/` and `src-shared/`
   (`@typescript-eslint/no-require-imports`), as `ng lint` does in `src/`. An
   import has the module's types, and is checked when the file is compiled.
4. **A `require()` that stays says why**, in the comment that switches the rule
   off. There are three reasons:
   - a module of Node (`fs`, `electron`) in a file of `src-shared/` that the
     renderer bundles too, where an import at the top would fail the renderer's
     build: it is loaded where the main process calls;
   - a module that only a development build has (`chokidar6`, for live
     reload), which an import at the top would look for in a package as well;
   - a module that would start something too early when it is imported at the
     top (`src-shared/analytics/record-error.ts`).
5. **A new script or tool is an ES module**, `.mjs`, unless something loads it
   with `require`.
6. **The renderer prefers dependencies that are ES modules**, which the build
   can cut down to what is used. The build warns about a CommonJS one; the
   ones in use are listed in `angular.json` (`allowedCommonJsDependencies`),
   so that a new one stands out, and in
   [dependencies.md](./dependencies.md#commonjs-modules-in-the-renderer) with
   what each is there for.


## Why the main process stays CommonJS

Electron has run a main process of ES modules since version 28, so
`src-main/` could be compiled to them. It is not, on purpose.

- **What it would take.** `"type": "module"` in `package.json`; the `.js`
  extension on every relative import of `src-main/` and `src-shared/`, about
  145 files, as Node asks of ES modules; `__dirname` and the remaining
  `require()` calls replaced; `with { type: 'json' }` on the imports of the
  translation files; another way to run the Electron-Mocha tests, which
  ts-node compiles to CommonJS; and the hooks through which the e2e suite and
  the performance harness load modules of the application with `require`.
- **What Electron says about it.** A main process of ES modules has to `await`
  what it imports before the `ready` event, and the preload script of a
  sandboxed page stays CommonJS, so the application would still have both
  formats.
- **What it would give.** One format for what `tsc` writes, and `await` at the
  top of a module. Nothing that a user sees.
- **Where the risk is.** In the part that ships: the package, the updater and
  the worker processes, which the tests cover least.

The source already has the form of ES modules, so the step stays possible.
Take it when something needed exists only as an ES module that `require()`
cannot load, or when Electron or a tool of the build stops supporting CommonJS.
