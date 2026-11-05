# Node modules in renderer bundles

`tsconfig.renderer.json` maps Electron/Node imports to the CommonJS bridges in
this directory. Angular's application builder emits browser ES
modules. Chromium cannot resolve a bare `import 'fs'` or `import 'electron'` at
runtime, whereas Electron's existing `globalThis.require` can load them.
Keeping that call as a property access also prevents esbuild from bundling
Electron's binary locator or replacing Node APIs with browser fallbacks.

The bridges preserve full Node module objects. In particular, `fs-extra`'s ESM
entry point exports only its extra helpers, whereas the app also needs the core
`fs` functions from its CommonJS entry point. `directory-tree` also runs in the
Node-enabled directory worker. Every non-builtin bridged package must remain in
`dependencies` so it is present inside a packaged app.

Adjacent `.d.cts` files keep the original module types. Electron's ambient types
are loaded explicitly in the renderer tsconfig. The main-process tsconfig does
not inherit these mappings and continues to resolve Node modules directly.
`npm run typecheck:build-config` checks the bridge implementations.

Use the genuine Electron unit tests and photo-loading E2E regressions when
changing these bridges. Angular's Vitest/jsdom tests isolate platform boundaries
and do not validate the production bridges. A browser build alone cannot prove that Node APIs,
workers, or installed production dependencies can be loaded by Electron.

References: [Electron ESM loading](https://www.electronjs.org/docs/latest/tutorial/esm),
[Node-enabled workers](https://www.electronjs.org/docs/latest/tutorial/multithreading),
[Angular build migration](https://angular.dev/tools/cli/build-system-migration).
