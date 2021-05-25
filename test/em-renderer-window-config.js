// The object exposed from this file follows the format of Electron's BrowserWindow options.
// See https://www.electronjs.org/docs/api/browser-window#new-browserwindowoptions
// To run tests with the same Electron configuration as the production app, it needs to follow BrowserWindow options passed in electron-main.ts
// As of Dec 2020, "enableRemoteModule: true" is especially required.

module.exports = {
  webPreferences: {
    contextIsolation: false,
    enableRemoteModule: true,
    nodeIntegration: true,
    webSecurity: false,
    worldSafeExecuteJavaScript: false
  }
};
