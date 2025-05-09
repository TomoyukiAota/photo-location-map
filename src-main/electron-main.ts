import './configure-electron-unhandled';
import './command-line-options/configure-command-line-options';
import { app, BrowserWindow, protocol } from 'electron';
import * as electronWebPreferences from '../electron-util/electron-web-preferences';
import '../electron-util/configure-electron-remote-in-main-process';
import { LogFileConfig } from '../src-shared/log/file-config/log-file-config';
import { Logger } from '../src-shared/log/logger';
import './auto-update/configure-auto-update';
import { getUrlForMainWindow } from './file-server/file-server';
import './menu/menu';
import './photo-data-viewer/photo-data-viewer-ipc-setup';
import './thumbnail-generation/thumbnail-generation-ipc-setup';
import { configureMainWindowForAnalytics } from './configure-main-window-for-analytics';
import { handleAppQuit } from './handle-app-quit';
import { LiveReload } from './live-reload';
import { recordAtAppLaunch } from './record-at-app-launch';
import { createMainWindowState } from './window-config';


Logger.info(`Log File Location: ${LogFileConfig.filePath}`);

export let mainWindow: BrowserWindow;

const createWindow = async () => {
  const mainWindowState = createMainWindowState();

  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    webPreferences: electronWebPreferences,
  });

  configureMainWindowForAnalytics(mainWindow);

  mainWindow.on('ready-to-show', () => {
    // Call recordAtAppLaunch on ready-to-show event so that
    // recordAtAppLaunch is called after IPC setup for analytics in the renderer process is done.
    // This is because recordAtAppLaunch calls Analytics.trackEvent which requires the IPC setup to be done.
    recordAtAppLaunch();
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  if (LiveReload.enabled) {
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/../node_modules/electron`)
    });
  }

  const url = await getUrlForMainWindow();
  mainWindow.loadURL(url);

  if (LiveReload.enabled) {
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
  Logger.error(e);
  Logger.error('Fatal error occurred in main process. Photo Location Map is closing.');

  // TODO: Handle error with electron-unhandled

  process.exitCode = 1;
}
