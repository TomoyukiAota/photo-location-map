// This file is to configure @electron/remote in the Electron main process
// before running electron-mocha's tests in the renderer process.
// Without this file, the tests will fail.

require('../electron-util/configure-electron-remote-in-main-process');
