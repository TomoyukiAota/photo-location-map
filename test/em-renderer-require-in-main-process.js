// This file is to initialize @electron/remote in the Electron main process
// before running electron-mocha's tests in the renderer process.
// Without this file, the tests will fail.

require('@electron/remote/main').initialize();

// Reference: https://github.com/electron/remote/issues/94#issuecomment-1024849702
require('electron').app.on('browser-window-created', (_, window) => {
  require('@electron/remote/main').enable(window.webContents);
});
