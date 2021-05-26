// This file is to initialize @electron/remote in the Electron main process
// before running electron-mocha's tests in the renderer process.
// Without this file, the tests will fail.

require('@electron/remote/main').initialize();
