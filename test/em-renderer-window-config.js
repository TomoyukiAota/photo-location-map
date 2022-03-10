// The object exposed from this file follows the format of Electron's BrowserWindow options.
// See https://www.electronjs.org/docs/api/browser-window#new-browserwindowoptions

const electronWebPreferences = require('../electron-util/electron-web-preferences');

module.exports = {
  webPreferences: electronWebPreferences,
};
