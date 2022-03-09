// This file is for karma-electron to initialize @electron/remote in the Electron main process.
// Without this file, karma-electron hangs.

require('@electron/remote/main').initialize();

// Reference: https://github.com/electron/remote/issues/94#issuecomment-1024849702
require('electron').app.on('browser-window-created', (_, window) => {
  require('@electron/remote/main').enable(window.webContents);
});
