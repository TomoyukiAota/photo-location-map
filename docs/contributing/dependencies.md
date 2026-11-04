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


## Electron binary

Electron downloads its binary on its first invocation; `npm run verify:electron`
checks that binary and the Node types used to compile for it.
