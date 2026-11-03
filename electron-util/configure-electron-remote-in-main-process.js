require('@electron/remote/main').initialize();

// Electron 45's bootstrap is the root of the CommonJS parent chain. Resolve
// the app's existing remote imports here rather than from that synthetic module.
require('electron').app.on('remote-require', (event, _contents, name) => {
  if (['fs-extra', 'electron', 'os', 'path', 'exifr'].includes(name)) {
    event.returnValue = require(name);
  }
});

// Reference: https://github.com/electron/remote/issues/94#issuecomment-1024849702
require('electron').app.on('browser-window-created', (_, browserWindow) => {
  require('@electron/remote/main').enable(browserWindow.webContents);
});
