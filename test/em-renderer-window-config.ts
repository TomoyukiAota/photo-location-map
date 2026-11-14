// The options of the window of electron-mocha's renderer tests, in the format of Electron's BrowserWindow options.
// See https://www.electronjs.org/docs/api/browser-window#new-browserwindowoptions
// Electron-Mocha loads it with require() (--window-config), compiled in out/em, which gives this module's exports.
import { rendererTestWebPreferences } from '../electron-util/electron-web-preferences.js';

export const webPreferences = rendererTestWebPreferences();
