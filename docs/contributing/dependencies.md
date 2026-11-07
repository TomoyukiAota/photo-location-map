# Dependencies

Read this before adding or upgrading a dependency.


## Using npm modules

### Electron renderer process

npm modules which are 1) used only in Electron renderer process and 2) imported
by `import` (not `require`) should be configured in `devDependencies` (not
`dependencies`) in `package.json`.

Angular build system creates a bundle file from `.ts` files. The bundle file
will have the copy of `import`ed (not `require`d) npm module, and the copy is
used at run time. Also, electron-builder will copy npm modules listed in
`dependencies` (not `devDependencies`) to create an application package.
Therefore, configuring `import`ed (again, not `require`d) npm modules used only
in Electron renderer process with `devDependencies` saves the size of
application package.


### Electron main process

npm modules used in Electron main process need to be configured in
`dependencies` in `package.json`.


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

Remove the patch when an Electron-Mocha release starts Electron without a shell.
Until then, the patch checks Electron-Mocha's version and source before writing,
so an upgrade fails installation until the patch is reviewed.
`npm run test:dependency-compat` checks the patched spawn calls with simulated
Windows paths that contain spaces, and the Windows CI job runs both suites from a
second checkout whose path contains a space. Keep that CI step after removing the
patch.


## Electron binary

Electron downloads its binary on its first invocation; `npm run verify:electron`
checks that binary and the Node types used to compile for it.
