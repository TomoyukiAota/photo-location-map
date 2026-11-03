# Contributing to this project

This page contains useful information to contribute to this project.


## CI Status

| OS      | Status                                       |
|:-------:|:--------------------------------------------:|
| Windows | [![ci-on-windows-image]][ci-on-windows-link] |
| macOS   | [![ci-on-macos-image]][ci-on-macos-link]     |
| Ubuntu  | [![ci-on-ubuntu-image]][ci-on-ubuntu-link]   |

[ci-on-windows-image]: https://github.com/TomoyukiAota/photo-location-map/workflows/CI%20on%20Windows/badge.svg
[ci-on-windows-link]: https://github.com/TomoyukiAota/photo-location-map/actions?query=workflow%3A%22CI+on+Windows%22
[ci-on-macos-image]: https://github.com/TomoyukiAota/photo-location-map/workflows/CI%20on%20macOS/badge.svg
[ci-on-macos-link]: https://github.com/TomoyukiAota/photo-location-map/actions?query=workflow%3A%22CI+on+macOS%22
[ci-on-ubuntu-image]: https://github.com/TomoyukiAota/photo-location-map/workflows/CI%20on%20Ubuntu/badge.svg
[ci-on-ubuntu-link]: https://github.com/TomoyukiAota/photo-location-map/actions?query=workflow%3A%22CI+on+Ubuntu%22

Ubuntu CI uses Ubuntu 26.04 LTS and reports the stable `test (ubuntu)` check name.
When this rename first reaches the pull request, the repository owner must replace
the old `test (ubuntu-24.04)` required check with `test (ubuntu)` in branch protection,
after confirming that the new check passes. The workflow and Mergify conditions
change together; the remote branch-protection setting is a separate owner action.

The macOS CI runs on Apple Silicon (`macos-26`). To run it on Intel (`macos-26-intel`), run the "CI on macOS" workflow manually: **Run workflow** in the Actions tab, or `gh workflow run ci-on-mac.yml --ref <branch>`. Do this before merging changes related to Intel Mac support, such as updating Electron and electron-builder.

A push or pull request that changes only documents (`docs/`, `README.md`, `CLAUDE.md`, `LICENSE` and `.github/ISSUE_TEMPLATE/`, as listed in [`.github/ci-filters.yml`](../.github/ci-filters.yml)) skips the tests.


## Prerequisite

 - Node.js (64-bit), with the version specified in [`mise.toml`](../mise.toml)
   - [mise](https://mise.jdx.dev/) is the recommended way to install it. `mise.toml` is the single source of truth for the Node.js version, and CI installs the same version from it.
   - Node.js can also be installed however you prefer, as long as the version matches.
   - Use the npm bundled with that Node installation; do not upgrade npm separately.
     `npm run verify:runtime` checks the version and executable identity.
 - More than 2GB of RAM
   - Application packaging frequently fails on a PC with 1GB of RAM. Add more RAM depending on the available memory for application packaging on your PC.


## Build and run for development

After cloning this repository, run these commands to start the application: 

``` bash
mise trust    # Only needed once per clone, to allow mise to read mise.toml
mise install  # Install Node.js with the version in mise.toml
mise exec -- npm ci
mise exec -- npm start
```

Without mise, install the specified Node.js and its bundled npm, then run `npm ci` and `npm start`.

Dependency install scripts are reviewed in `allowScripts` in `package.json`.
When upgrading a package with an install script, inspect that script and update
its exact-version entry. `.npmrc` rejects unreviewed scripts during installation.
Electron downloads its binary on its first invocation; `npm run verify:electron`
checks that binary and the Node types used to compile for it.


## Frequently Used Commands

|Command|Description|
|--|--|
|`npm start`| Build and run the application for development. |
|`npm run test:all`| Run lint, unit tests, development watcher lifecycle checks, and package creation/smoke tests. |
|`npm run test:live-reload`| Build the main process and check watcher quit, reload, and relaunch. |
|`npm run test:e2e`| Run application regressions after a production build; see [test/e2e/README.md](../test/e2e/README.md). |
|`npm run package:windows`| Create an installer for Windows. |
|`npm run package:mac`| Create signed/notarized universal macOS `.dmg` and update `.zip` artifacts. |
|`npm run package:linux`| Create an application for Linux. |


## HTML template formatting

The workspace sets VS Code's built-in HTML formatter to
[`preserve-aligned`](https://code.visualstudio.com/docs/languages/html#_formatting).
It keeps existing attribute line breaks and realigns incorrectly indented
continuation attributes with the first attribute. For a local alignment fix, select the opening tag and use
**Format Selection** with the built-in HTML formatter. Other formatters may not
use this HTML-specific setting.

The built-in formatter does not preserve Angular `@if`/`@for` block indentation
when formatting a whole document. The workspace therefore does not force a
default formatter or enable format-on-save. Do not reformat the whole repository
to make an attribute-alignment change.


## Using npm modules

### Electron renderer process

npm modules which are 1) used only in Electron renderer process and 2) imported by `import` (not `require`) should be configured in `devDependencies` (not `dependencies`) in `package.json`.

Angular build system creates a bundle file from `.ts` files. The bundle file will have the copy of `import`ed (not `require` d) npm module, and the copy is used at run time. Also, electron-builder will copy npm modules listed in `dependencies` (not `devDependencies`) to create an application package. Therefore, configuring `import`ed (again, not `require`d) npm modules used only in Electron renderer process with `devDependencies` saves the size of application package.



### Electron main process

npm modules used in Electron main process need to be configured in `dependencies` in `package.json`. 


## Sidenote

Development of this application is started by using [maximegris/angular-electron](https://github.com/maximegris/angular-electron). [The contents of the respository as of commit 7618abcea496a26656be11f31542713b728919e9 (on Dec 31, 2018)](https://github.com/maximegris/angular-electron/tree/7618abcea496a26656be11f31542713b728919e9) are used with some modification and removal.
