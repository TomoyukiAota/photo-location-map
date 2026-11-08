// The main process of electron-mocha's renderer tests: the app's isolated test profile and the main-process side of
// the IPC that the tested renderer code uses, from the app's own sources. Its window stands in for the app's main
// window, which alone may make these requests (src-main/ipc/ipc-sender.ts), and has the main window's preload
// (test/em-renderer-window-config.js).
require('../electron-util/isolated-test-profile');
require('ts-node').register({ transpileOnly: true, project: require('node:path').join(__dirname, 'em-main.tsconfig.json') });
require('../src-main/log/log-setup');
require('../src-main/startup/startup-metadata-setup');
require('../src-main/user-data-storage/user-data-storage-setup');
require('../src-main/exif/exif-ipc-setup');

const { app } = require('electron');
const os = require('node:os');
const path = require('node:path');
const { setMainWindow } = require('../src-main/ipc/ipc-sender');
const { rememberUserChosenFolder } = require('../src-main/ipc/user-chosen-folders');
app.on('browser-window-created', (_event, window) => setMainWindow(window.webContents));
// The tests read photos of their own folders, which the user would have chosen in the app: every folder counts.
for (const folder of [os.tmpdir(), __dirname]) rememberUserChosenFolder(path.parse(path.resolve(folder)).root);
