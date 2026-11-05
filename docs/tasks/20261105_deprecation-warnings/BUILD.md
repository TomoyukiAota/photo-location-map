# Angular build tooling migration

## Current implementation

- Replace custom webpack build/serve/Karma and extract-i18n builders with
  `@angular/build` 22.2.5 equivalents. Remove obsolete webpack config and options.
- Keep the package entry point at `dist/index.html` using
  `outputPath: { base: "dist", browser: "" }`.
- Disable Vite dependency prebundling and HMR for the existing Electron
  development flow. Renderer-specific module mappings must reach the application
  bundler, and live reload should continue to reload the application as before.
- Share `tsconfig.renderer.json` between app, Angular tests, and the standalone
  worker typecheck config. The application builder compiles the worker using
  the app's configuration; it no longer accepts `webWorkerTsConfig`.
- Add small typed CommonJS bridges under `electron-util/renderer-modules` for
  Node/Electron APIs and Node-only packages. See that directory's README for
  rationale, production dependency requirements, and runtime validation needs.
  The main-process tsconfig has no alias changes.
- Keep `typecheck:build-config`, now checking the `.cjs` bridge implementations
  instead of the deleted TypeScript webpack config.
- Karma uses Jasmine without the obsolete webpack framework/plugin. Remove
  karma-electron's CommonJS preprocessor: it wraps native ES module statements
  inside a function and causes syntax errors. The Electron launcher and its
  main-process remote fixtures remain configured.

## ECharts compatibility

The previous webpack alias to `echarts/dist/echarts.min` is deliberately removed.
Webpack selected the official theme's AMD branch, whose `echarts` import picked
the package's CommonJS development bundle. Esbuild selects the theme's CommonJS
branch, whose `echarts/lib/echarts` import shares the normal ESM root's core.
Production optimization removes `process.env.NODE_ENV !== 'production'` checks
in those ESM sources.

Evidence from the successful production build's `dist/browser-stats.json`:
one `node_modules/echarts/lib/core/echarts.js`, normal `echarts/index.js`, and
`echarts/theme/v5.js`; no `echarts/dist/*` bundle. The ECharts chunks remain lazy.
The emitted chunks do not contain the known development warning text
`There is a chart instance already initialized`. Existing chart palette/API E2E
assertions must still pass before treating this as verified behavior.

Rejected approach: a CommonJS alias to the minified bundle exports only a
default value under native dynamic import and the theme can load a second core.
The normal ESM graph avoids both problems without a custom builder, copied
theme, or dependency source patches.

## Validation and troubleshooting

Local logs are under `.upgrade-artifacts/deprecation-warnings/` and ignored.

| Command / log | Result |
| --- | --- |
| `npm run build:prod`, `angular-prod-1.log` | Initial migration failure: Sass absolute imports, absent Electron ambient types, Node imports reached through Node-only dependencies, and Zone.js top-level await restriction. |
| `npm run build:prod`, `angular-prod-2.log` | Remaining failures were Electron typeRoots and top-level await. |
| `tsc -p src/tsconfig.app.json --noEmit`, `angular-types.log` | Pass after explicitly loading Electron ambient types from node_modules. |
| `npm run build:prod -- --stats-json`, `angular-prod-3.log` | Pass in 4.5 seconds; output paths, lazy chart chunks, module worker emitted. No deprecation warnings. CommonJS optimization notices are separate and remain visible. |
| `npm run test:unit:ng`, `angular-tests.log` | First test run failed because the old CommonJS preprocessor wrapped native ES modules. |
| `npm run test:unit:ng`, `angular-tests-2.log` | Pass, all 57 tests after removing the preprocessor. |

The Angular API/style migration separately replaces the top-level await with
configuration readiness awaited before bootstrap and changes Sass imports to
relative module syntax. Coordinate changes to those sources with their owner.

## Required next checks

1. Re-run Angular unit tests with the removed CommonJS preprocessor. Check that
   both `process` and `window.process` plus `window.require` retain the Electron
   semantics tested by the existing shared-process/require specs.
2. Run the existing production photo/map/chart E2E suite. This must exercise the
   emitted module worker, directory-tree runtime package, lazy ECharts theme,
   settings dialogs, and translation loading.
3. Test `npm start` and the development build. Confirm native require module
   resolution under Vite and the configured live-reload lifecycle.
4. Run package creation/smoke tests so installed dependency bridges are verified
   inside the packaged resources (the repository uses `asar: false`), not only
   from a checkout.

The supported application builder does not type-check worker code as the former
webpack setup did. `typecheck:worker` explicitly checks `tsconfig.worker.json`
before `ng build`, retaining this development safeguard without webpack.

No build or test process owned by this investigation remains running. Parent
agent coordinates shared-output tests and will append integrated results.

## Primary references

- [Angular build migration](https://angular.dev/tools/cli/build-system-migration)
- [Angular build configuration](https://angular.dev/reference/configs/workspace-config)
- [Electron ESM loading](https://www.electronjs.org/docs/latest/tutorial/esm)
- [Electron Node-enabled workers](https://www.electronjs.org/docs/latest/tutorial/multithreading)
- Installed `@angular/build` application/Karma schemas and implementation at
  version 22.2.5; installed ECharts 6.1.0 root/theme module source.
