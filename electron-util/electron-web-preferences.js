// The webPreferences of the app's windows: https://www.electronjs.org/docs/latest/api/structures/web-preferences
const path = require('path');

/**
 * The main window's page runs without Node.js, sandboxed, with context isolation: it reaches the main process only
 * through its preload's bridge, window.plm (preload/main-window.cjs). webSecurity stays off, as it was.
 * @param {string} appPath app.getAppPath(): the app's folder, in a checkout or a package, where the preload is.
 * @returns {Electron.WebPreferences}
 */
function mainWindowWebPreferences(appPath) {
  return {
    preload: path.join(appPath, 'electron-util', 'preload', 'main-window.cjs'),
    contextIsolation: true,
    nodeIntegration: false,
    nodeIntegrationInWorker: false,
    sandbox: true,
    webSecurity: false,
  };
}

/**
 * Photo Data Viewer's window, whose page, served apart from the app, still reads the photo with Node.js. It is
 * isolated with a bridge of its own in stage C2 of the remote removal (docs/tasks/20261106_remove-electron-remote/).
 * @type {Electron.WebPreferences}
 */
const legacyPhotoDataViewerWebPreferences = {
  nodeIntegration: true,
  contextIsolation: false,
};

/**
 * electron-mocha's renderer tests: mocha needs Node.js in the page. Its own preload runs the main window's preload,
 * given to it with --preload (package.json), in the page's world, so that the app's renderer code finds window.plm as
 * it does in the app (test/em-renderer-window-config.js).
 * @returns {Electron.WebPreferences}
 */
function rendererTestWebPreferences() {
  return {
    contextIsolation: false,
    nodeIntegration: true,
    sandbox: false,
  };
}

module.exports = { mainWindowWebPreferences, legacyPhotoDataViewerWebPreferences, rendererTestWebPreferences };
