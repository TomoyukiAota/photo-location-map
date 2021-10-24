/**
 * @type {Electron.WebPreferences}
 */
const electronWebPreferences = {
  contextIsolation: false,
  enableRemoteModule: true,
  nodeIntegration: true,
  nodeIntegrationInWorker: true,
  webSecurity: false,
  worldSafeExecuteJavaScript: false,
};

module.exports = electronWebPreferences;
