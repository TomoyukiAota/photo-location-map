const path = require('node:path');
const { app } = require('electron');
const root = path.resolve(__dirname, '../..');
app.setAppPath(root);
// A bare .cjs entry has Electron's package version rather than the app manifest.
app.getVersion = () => require('../../package.json').version;
// Packaged launches use their own unchanged main entry and manifest instead.
require('../../src-main/electron-main.js');
