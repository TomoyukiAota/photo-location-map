// The webPreferences of the app's windows: https://www.electronjs.org/docs/latest/api/structures/web-preferences
import path from 'path';

/**
 * The main window's page runs without Node.js, sandboxed, with context isolation: it reaches the main process only
 * through its preload's bridge, window.plm (preload/main-window.cjs). With webSecurity, it loads no file: URL, and
 * gets the user's photos from plm-file:, which answers only for those of the folders that the user opened
 * (src-main/file-server/photo-files.ts). Its Content Security Policy comes with the page
 * (src-main/file-server/content-security-policy.ts).
 * @param {string} appPath app.getAppPath(): the app's folder, in a checkout or a package, where the preload is.
 * @returns {Electron.WebPreferences}
 */
export function mainWindowWebPreferences(appPath) {
  return {
    preload: path.join(appPath, 'electron-util', 'preload', 'main-window.cjs'),
    contextIsolation: true,
    nodeIntegration: false,
    nodeIntegrationInWorker: false,
    sandbox: true,
    webSecurity: true,
  };
}

/**
 * Photo Data Viewer's window, whose page is served apart from the app: without Node.js, sandboxed, with context
 * isolation, as the main window's, with a bridge of its own (preload/photo-data-viewer.cjs). Only a viewer that knows
 * the bridge shows its photo; none is ever given Node.js instead.
 * @param {string} appPath app.getAppPath(): the app's folder, in a checkout or a package, where the preload is.
 * @returns {Electron.WebPreferences}
 */
export function photoDataViewerWebPreferences(appPath) {
  return {
    preload: path.join(appPath, 'electron-util', 'preload', 'photo-data-viewer.cjs'),
    contextIsolation: true,
    nodeIntegration: false,
    nodeIntegrationInWorker: false,
    sandbox: true,
  };
}

/**
 * electron-mocha's renderer tests: mocha needs Node.js in the page. Its own preload runs the main window's preload,
 * given to it with --preload (package.json), in the page's world, so that the app's renderer code finds window.plm as
 * it does in the app (test/em-renderer-window-config.ts).
 * @returns {Electron.WebPreferences}
 */
export function rendererTestWebPreferences() {
  return {
    contextIsolation: false,
    nodeIntegration: true,
    sandbox: false,
  };
}
