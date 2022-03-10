require('@electron/remote/main').initialize();

// Reference: https://github.com/electron/remote/issues/94#issuecomment-1024849702
require('electron').app.on('browser-window-created', (_, browserWindow) => {
  require('@electron/remote/main').enable(browserWindow.webContents);
});
