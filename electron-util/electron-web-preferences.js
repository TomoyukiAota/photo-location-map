/**
 * @type {Electron.WebPreferences}
 */
const electronWebPreferences = {
  contextIsolation: false,
  nodeIntegration: true,
  nodeIntegrationInWorker: true,
  webSecurity: false,
  worldSafeExecuteJavaScript: false,
};

module.exports = electronWebPreferences;
