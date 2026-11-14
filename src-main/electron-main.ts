// TL;DR: The order of the first imports matters: each sets up what the next ones use while they are evaluated.
// Details: The test profile moves the app's folders; errors are scrubbed, and handled from the start, so that an error
// of the setups that follow is recorded; the launch's file is written before them too, so that a launch whose setup
// fails and stops it before analytics are set is told at the next, which sends its error (src-main/launch/); the
// startup metadata needs the log's location; the settings hold the analytics user ID, which the crash reporter's dumps
// carry, and the language, which the texts of the menu and the dialogs are in; analytics then sends what was tracked
// before.
import '../electron-util/isolated-test-profile';
import './analytics/error-scrubbing-setup';
import './configure-electron-unhandled';
import './launch/launch-file-setup';
import './log/log-setup';
import './startup/startup-metadata-setup';
import './user-data-storage/user-data-storage-setup';
import './crash-reporter-setup';
import './i18n/i18n-setup';
import { withHeadlessTestOptions } from '../electron-util/e2e-test-hooks';
import './command-line-options/configure-command-line-options';
import './analytics/analytics-setup';
import { app, BrowserWindow, protocol } from 'electron';
import { mainWindowWebPreferences } from '../electron-util/electron-web-preferences';
import { recordUnhandledError } from '../src-shared/analytics/record-error';
import { LogFileConfig } from '../src-shared/log/file-config/log-file-config';
import { Logger } from '../src-shared/log/logger';
import { perfMark } from '../src-shared/perf/perf-mark';
import './auto-update/configure-auto-update';
import { getUrlForMainWindow } from './file-server/file-server';
import './menu/menu';
import './explorer-context-menu/explorer-context-menu-ipc-setup';
import './photo-data-viewer/photo-data-viewer-ipc-setup';
// Before the app is ready, which registering its scheme requires.
import './photo-data-viewer/photo-delivery-setup';
import './exif/exif-ipc-setup';
import './folder-dialog/folder-dialog-ipc-setup';
import './directory-tree/directory-tree-ipc-setup';
import './restart-ipc-setup';
import './shell/shell-ipc-setup';
import './thumbnail-generation/thumbnail-generation-ipc-setup';
import './thumbnail-generation/thumbnail-cache-ipc-setup';
import { startDirectoryTreeWorker } from './directory-tree/directory-tree-requests';
import { setMainWindow } from './ipc/ipc-sender';
import { keepOnAppPage } from './ipc/main-window-pages';
import { configureMainWindowForAnalytics } from './configure-main-window-for-analytics';
import { handleAppQuit } from './handle-app-quit';
import { LiveReload } from './live-reload';
import { configureLiveReload } from './configure-live-reload';
import { recordAtAppLaunch } from './record-at-app-launch';
import { recordConsoleErrors } from './record-console-errors';
import { configureRecordAtAppQuit } from './record-at-app-quit';
import { configureRecordProcessGone } from './record-process-gone';
import { recordWindowFailures } from './record-window-failures';
import { StartupTime } from './startup-time';
import { createMainWindowState } from './window-config';


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
    configureLiveReload(__filename);
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
