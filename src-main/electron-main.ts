// TL;DR: The order of the first imports matters: each sets up what the next ones use while they are evaluated.
// Details: The test profile moves the app's folders; errors are scrubbed, and handled from the start, so that an error
// of the setups that follow is recorded; the launch's file is written before them too, so that a launch whose setup
// fails and stops it before analytics are set is told at the next, which sends its error (src-main/launch/); the
// startup metadata needs the log's location; the settings hold the analytics user ID, which the crash reporter's dumps
// carry, and the language, which the texts of the menu and the dialogs are in; analytics then sends what was tracked
// before.
import '../electron-util/isolated-test-profile.js';
import './analytics/error-scrubbing-setup.js';
import './configure-electron-unhandled.js';
import './launch/launch-file-setup.js';
import './log/log-setup.js';
import './startup/startup-metadata-setup.js';
import './user-data-storage/user-data-storage-setup.js';
import './crash-reporter-setup.js';
import './i18n/i18n-setup.js';
import { withHeadlessTestOptions } from '../electron-util/e2e-test-hooks.js';
import './command-line-options/configure-command-line-options.js';
import './analytics/analytics-setup.js';
import { app, BrowserWindow, protocol } from 'electron';
import { mainWindowWebPreferences } from '../electron-util/electron-web-preferences.js';
import { recordUnhandledError } from '../src-shared/analytics/record-error.js';
import { LogFileConfig } from '../src-shared/log/file-config/log-file-config.js';
import { Logger } from '../src-shared/log/logger.js';
import { perfMark } from '../src-shared/perf/perf-mark.js';
import './auto-update/configure-auto-update.js';
import { getUrlForMainWindow } from './file-server/file-server.js';
import './menu/menu.js';
import './explorer-context-menu/explorer-context-menu-ipc-setup.js';
import './photo-data-viewer/photo-data-viewer-ipc-setup.js';
// Before the app is ready, which registering its scheme requires.
import './photo-data-viewer/photo-delivery-setup.js';
import './exif/exif-ipc-setup.js';
import './folder-dialog/folder-dialog-ipc-setup.js';
import './directory-tree/directory-tree-ipc-setup.js';
import './restart-ipc-setup.js';
import './shell/shell-ipc-setup.js';
import './thumbnail-generation/thumbnail-generation-ipc-setup.js';
import './thumbnail-generation/thumbnail-cache-ipc-setup.js';
import { startDirectoryTreeWorker } from './directory-tree/directory-tree-requests.js';
import { setMainWindow } from './ipc/ipc-sender.js';
import { keepOnAppPage } from './ipc/main-window-pages.js';
import { configureMainWindowForAnalytics } from './configure-main-window-for-analytics.js';
import { handleAppQuit } from './handle-app-quit.js';
import { LiveReload } from './live-reload.js';
import { configureLiveReload } from './configure-live-reload.js';
import { recordAtAppLaunch } from './record-at-app-launch.js';
import { recordConsoleErrors } from './record-console-errors.js';
import { configureRecordAtAppQuit } from './record-at-app-quit.js';
import { configureRecordProcessGone } from './record-process-gone.js';
import { recordWindowFailures } from './record-window-failures.js';
import { StartupTime } from './startup-time.js';
import { createMainWindowState } from './window-config.js';


Logger.info(`Log File Location: ${LogFileConfig.filePath}`);

export let mainWindow: BrowserWindow;

/** Creates the main window, with its isolated page, keeps it on the app's page, and loads that page. */
const createWindow = async () => {
  perfMark('main:create-window');
  StartupTime.markAppReady();
  const mainWindowState = createMainWindowState();

  mainWindow = new BrowserWindow(withHeadlessTestOptions({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    webPreferences: mainWindowWebPreferences(app.getAppPath()),
  }));

  perfMark('main:window-created');
  configureMainWindowForAnalytics(mainWindow);

  if (process.platform === 'win32') {
    // TL;DR: Restore the original Windows fullscreen menu on the next event-loop turn.
    // Details: Electron 45 emits enter-full-screen before its native SetFullScreen
    // hides the menu, overwriting a synchronous setter. setImmediate runs after
    // that native call; the guards also handle a quick exit or window close.
    // https://github.com/electron/electron/blob/v45.2.1/shell/browser/native_window_views.cc
    const window = mainWindow;
    window.on('enter-full-screen', () => setImmediate(() => {
      if (!window.isDestroyed() && window.isFullScreen()) window.setMenuBarVisibility(true);
    }));
  }

  mainWindow.webContents.once('did-finish-load', () => {
    perfMark('main:did-finish-load');
    // For the first folder that the user opens not to wait for the worker to start (src-main/directory-tree/).
    startDirectoryTreeWorker();
  });
  mainWindow.on('ready-to-show', () => {
    perfMark('main:ready-to-show');
    // Call recordAtAppLaunch on ready-to-show event so that
    // recordAtAppLaunch is called after IPC setup for analytics in the renderer process is done.
    // This is because recordAtAppLaunch calls Analytics.trackEvent which requires the IPC setup to be done.
    recordAtAppLaunch();
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  if (LiveReload.enabled) {
    await configureLiveReload(import.meta.filename);
  }

  const url = await getUrlForMainWindow();
  // Before the page loads: its preload asks for the startup metadata at once (src-main/ipc/ipc-sender.ts).
  setMainWindow(mainWindow.webContents);
  keepOnAppPage(mainWindow.webContents, url);
  // A preload that throws leaves the page without its bridge, so that the page cannot write to the log itself.
  recordWindowFailures(mainWindow, 'Main Window');
  recordConsoleErrors(mainWindow.webContents);
  mainWindow.loadURL(url);

  // Keep automated development checks on the application's CDP target.
  if (LiveReload.enabled && process.env.PLM_E2E !== '1') {
    mainWindow.webContents.openDevTools();
  }

  mainWindowState.manage(mainWindow);

  Logger.info('Launching the main window.');
};


try {
  // Disable hardware acceleration to address the error printed
  // as "Passthrough is not supported, GL is disabled, ANGLE is".
  app.disableHardwareAcceleration();

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', createWindow);

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
      createWindow();
    }
  });

  configureRecordAtAppQuit();
  configureRecordProcessGone();

  app.on('quit', () => handleAppQuit());

  // Below is a workaround for the issue that displaying a file with "file://" protocol
  // on the browser using development server results in an error like
  // -------------------------------
  // GET file:///C:/temp/temp.JPG
  // net::ERR_UNKNOWN_URL_SCHEME
  // -------------------------------
  // This issue happens from Electron 9.
  // See https://github.com/electron/electron/issues/23757#issuecomment-640146333
  app.whenReady().then(() => {
    protocol.registerFileProtocol('file', (request, callback) => {
      const pathname = decodeURI(request.url.replace('file:///', ''));
      callback(pathname);
    });
  });
} catch (e) {
  Logger.errorNotRecorded(e);
  Logger.errorNotRecorded('Fatal error occurred in main process. Photo Location Map is closing.');
  recordUnhandledError(e, 'Main');
  process.exitCode = 1;
}
