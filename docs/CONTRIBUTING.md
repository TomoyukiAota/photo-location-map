# Contributing to this project

This page contains useful information to contribute to this project.


## CI

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

See also [ci.md](contributing/ci.md).


## Prerequisite

 - [mise](https://mise.jdx.dev/)
   - It installs the Node.js version in [`mise.toml`](../mise.toml) and the npm bundled with it. Do not upgrade npm separately.
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


## Frequently Used Commands

Prefix these with `mise exec --`, as above, unless your shell activates mise with `mise activate`.

|Command|Description|
|--|--|
|`npm start`| Build and run the application for development. |
|`npm run test:all`| Run lint, unit tests, development watcher lifecycle checks, and package creation/smoke tests. |
|`npm run test:live-reload`| Build the main process and check watcher quit, reload, and relaunch. |
|`npm run test:e2e`| Run application regressions after a production build; see [test/e2e/README.md](../test/e2e/README.md). |
|`npm run package:windows`| Create an installer for Windows. |
|`npm run package:mac`| Create signed/notarized universal macOS `.dmg` and update `.zip` artifacts. |
|`npm run package:linux`| Create an application for Linux. |


## Dependencies

See [dependencies.md](contributing/dependencies.md).


## Sidenote

Development of this application is started by using [maximegris/angular-electron](https://github.com/maximegris/angular-electron). [The contents of the respository as of commit 7618abcea496a26656be11f31542713b728919e9 (on Dec 31, 2018)](https://github.com/maximegris/angular-electron/tree/7618abcea496a26656be11f31542713b728919e9) are used with some modification and removal.
