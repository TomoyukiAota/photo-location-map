const path = require('node:path');
const { app, session } = require('electron');
const root = path.resolve(__dirname, '../..');
globalThis.__plmTestRequire = require;
app.setAppPath(root);
// A bare .cjs entry has Electron's package version rather than the app manifest.
app.getVersion = () => require('../../package.json').version;
// Playwright places its debugging flags before the entry point. Commander
// should see only application arguments, as it does in a normal app launch.
process.argv = [process.execPath, root,
  ...(process.env.PLM_E2E_OPEN ? ['--open', process.env.PLM_E2E_OPEN] : [])];
require('../../electron-util/isolated-test-profile');
app.on('ready', () => {
  session.defaultSession.webRequest.onBeforeRequest({ urls: [
    '*://*.analytics.photo-location-map.tomoyukiaota.com/*',
    '*://*.analytics.photo-data-viewer.tomoyukiaota.com/*',
    '*://*.mixpanel.com/*', '*://*.amplitude.com/*',
    '*://*.google-analytics.com/*', '*://www.googletagmanager.com/*',
  ] }, (_, callback) => callback({ cancel: true }));
});
require('../../src-main/electron-main.js');
