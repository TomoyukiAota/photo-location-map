# Dependencies

Read this before adding or upgrading a dependency.


## Using npm modules

### Electron renderer process

npm modules used only in Electron renderer process should be configured in
`devDependencies` (not `dependencies`) in `package.json`.

Angular build system creates a bundle file from `.ts` files, with a copy of each
npm module that they import, and the copy is used at run time. The main window's
page has no Node.js, so it cannot `require` a module from the package at run
time: it reaches the main process only through its preload's bridge
(`src-shared/bridge/plm-bridge.ts`). electron-builder copies the npm modules
listed in `dependencies` (not `devDependencies`) to create an application
package, so configuring the renderer's modules in `devDependencies` saves the
size of application package. A Node.js module, such as `fs` or `electron`,
cannot be used in the renderer: use it in the main process, and add to the bridge
the narrow operation that the page needs.


### Electron main process

npm modules used in Electron main process need to be configured in
`dependencies` in `package.json`.


### CommonJS modules in the renderer

Angular's build warns about a dependency of the renderer that is a CommonJS
module, as it cannot cut such a module down to what is used. The ones in use
are listed in `angular.json` (`allowedCommonJsDependencies`), which ends the
warning for them, so that a new one stands out. Prefer a dependency that is an
ES module; when a CommonJS one is needed, add it to that list and to this
table. [module-formats.md](./module-formats.md) has the rules for the
repository's own files.

| Module | What it is there for |
|:--|:--|
| `moment`, `moment-timezone`, `moment-duration-format` | Dates and durations. moment is published as CommonJS; only another date library would end these. |
| `lodash` | `debounce`, `throttle`, `isEqual`, `isObject` and `chunk`. `src-shared/` uses it in the main process too. |
| `reflect-metadata` | Loaded for its effect, the metadata that decorators read. |
| `zen-observable`, `safe-json-stringify` | Dependencies of `@amplitude/analytics-browser`. |
| `@turf/jsts`, `concaveman`, `earcut`, `fast-deep-equal`, `rbush`, `skmeans` | Dependencies of `@turf/turf`, which the map's regions use. |


## Install scripts

Dependency install scripts are reviewed in `allowScripts` in `package.json`.
When upgrading a package with an install script, inspect that script and update
its exact-version entry. `.npmrc` rejects unreviewed scripts during installation.


## Stay on the documented setup

Use each tool the way its documentation sets it up, such as electron-builder with
the dependency versions it requires, and Angular's unit-test builder with
Vitest. Depart from that setup — with npm `overrides`, a patch to an installed
package or a custom environment — only for a specific reason: a feature that
cannot be built otherwise, or avoiding a serious security vulnerability.

Removing a deprecation warning is not such a reason. Upstream updates to the
standard setup resolve it over time, and it is not urgent. Record the warning in
the next section instead.


### Known deprecation warnings

A clean `npm ci` prints these deprecation warnings. Each comes from the latest
stable release of a package in the standard setup.

| Warning | Comes from | Revisit when |
|:--|:--|:--|
| `glob@7.2.3`, `inflight@1.0.6`, `rimraf@2.6.3`, `boolean@3.2.0` | electron-builder 26: `@electron/asar` 3.4.1, `@electron/get` 3 → `global-agent` 3, and the Squirrel.Windows tooling's `electron-winstaller` 5.4.0 → `temp` 0.9.4 → `rimraf` 2.6.3. | electron-builder 27 is released as stable. Its prereleases use `@electron/asar` 4 and `@electron/get` 5 and drop `electron-winstaller`; the maintainer does not plan to backport the `electron-winstaller` removal to 26 ([upstream issue](https://github.com/electron-userland/electron-builder/issues/10016)). |
| `lodash.isequal@4.5.0` | `electron-updater` 6.8.12 | An `electron-updater` 6 release includes the [backported replacement](https://github.com/electron-userland/electron-builder/pull/10502). |
| `glob@10.5.0` | `electron-mocha` 13.1.0 → Mocha 11 | `electron-mocha` supports Mocha 12, which [moved to glob 13](https://github.com/mochajs/mocha/pull/5546). |

After dependency changes, check that a clean `npm ci` prints no other
`npm warn deprecated` lines. The
[override removal record](../tasks/20261107_remove-dependency-overrides/STATUS.md)
describes how these were checked.


### Departures kept for a needed feature

**`script/patch-electron-mocha.js`**, run by `postinstall`, lets the
Electron-Mocha suites (`npm run test:unit:em:main` and `test:unit:em:renderer`)
start on Windows from a checkout whose path contains a space. Electron-Mocha
13.1.0 starts Electron through a shell on Windows, which it added for a Node
security change
([upstream pull request](https://github.com/jprichardson/electron-mocha/pull/213)).
Node passes the Electron path to that shell unquoted, so the path splits at the
space. The patch makes both spawn calls start Electron directly. It also avoids
Node's DEP0190 warnings, which alone would not justify it.

Remove the patch when an Electron-Mocha release stops using a Windows shell at
both sites the patch changes: the Electron launch, and the quit hook that starts
a separate process to remove the temporary profile. Until then, the patch checks Electron-Mocha's version and source before writing,
so an upgrade fails installation until the patch is reviewed.
`npm run test:dependency-compat` checks the patched spawn calls with simulated
Windows paths that contain spaces, and the Windows CI job runs both suites from a
second checkout whose path contains a space. Keep that CI step after removing the
patch. It checks only the launch: the quit hook's process is detached and its
output discarded, so a failure there would only leave the temporary profile
behind. Check that site in the release's source.


## Electron binary

Electron downloads its binary on its first invocation; `npm run verify:electron`
checks that binary and the Node types used to compile for it.
