// The main process of electron-mocha's renderer tests: the app's isolated test profile and the main-process side of
// the IPC that the tested renderer code uses, from the app's own sources. Its window stands in for the app's main
// window, which alone may make these requests (src-main/ipc/ipc-sender.ts), and has the main window's preload
// (test/em-renderer-window-config.ts). Electron-Mocha loads it with require() (--require-main), compiled in out/em.
import '../electron-util/isolated-test-profile.js';
import '../src-main/log/log-setup.js';
import '../src-main/startup/startup-metadata-setup.js';
import '../src-main/user-data-storage/user-data-storage-setup.js';
import '../src-main/exif/exif-ipc-setup.js';
import { app } from 'electron';
import * as fs from 'fs';
import * as os from 'os';
import { setMainWindow } from '../src-main/ipc/ipc-sender.js';
import { rememberUserChosenFolder } from '../src-main/ipc/user-chosen-folders.js';
import { repositoryPath } from './test-util/repository.js';

app.on('browser-window-created', (_event, window) => setMainWindow(window.webContents));
// The tests read photos of their own folders, which the user would have chosen in the app: the temporary folder, as
// it is named and as it resolves (/var is /private/var on macOS), and the tests' own.
for (const folder of new Set([os.tmpdir(), fs.realpathSync.native(os.tmpdir()), repositoryPath('test')])) rememberUserChosenFolder(folder);
