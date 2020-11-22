# Contributing to this project

This page contains useful information to contribute to this project.


## CI Status

| OS             | Status                             |
|:--------------:|:----------------------------------:|
| Windows        | [![appveyor-image]][appveyor-link] |
| macOS & Ubuntu | [![travisci-image]][travisci-link] |

[appveyor-image]: https://ci.appveyor.com/api/projects/status/5v9p3ccw0jj0pgwn/branch/master?svg=true
[appveyor-link]: https://ci.appveyor.com/project/TomoyukiAota/photo-location-map/branch/master
[travisci-image]: https://travis-ci.org/TomoyukiAota/photo-location-map.svg?branch=master
[travisci-link]: https://travis-ci.org/TomoyukiAota/photo-location-map


## Prerequisite

 - Node.js (64-bit, version 12+)
 - More than 2GB of RAM
   - Application packaging frequently fails on a PC with 1GB of RAM. Add more RAM depending on the available memory for application packaging on your PC.


## Build and run for development

After cloning this repository, run these commands to start the application: 

``` bash
npm install
npm start
```


## Frequently Used Commands

|Command|Description|
|--|--|
|`npm start`| Build and run the application for development. |
|`npm run test:all`| Run all tests. Linting, unit tests, e2e tests, and package creation/smoke tests are included. |
|`npm run package:windows`| Create an installer for Windows. |
|`npm run package:mac`| Create a `.dmg` file which contains a `.app` file for macOS. |
|`npm run package:linux`| Create an application for Linux. |


## Using npm modules

### Electron renderer process

npm modules which are 1) used only in Electron renderer process and 2) imported by `import` (not `require`) should be configured in `devDependencies` (not `dependencies`) in `package.json`.

Angular build system creates a bundle file from `.ts` files. The bundle file will have the copy of `import`ed (not `require` d) npm module, and the copy is used at run time. Also, electron-builder will copy npm modules listed in `dependencies` (not `devDependencies`) to create an application package. Therefore, configuring `import`ed (again, not `require`d) npm modules used only in Electron renderer process with `devDependencies` saves the size of application package.



### Electron main process

npm modules used in Electron main process need to be configured in `dependencies` in `package.json`. 


## Sidenote

Development of this application is started by using [maximegris/angular-electron](https://github.com/maximegris/angular-electron). [The contents of the respository as of commit 7618abcea496a26656be11f31542713b728919e9 (on Dec 31, 2018)](https://github.com/maximegris/angular-electron/tree/7618abcea496a26656be11f31542713b728919e9) are used with some modification and removal.
