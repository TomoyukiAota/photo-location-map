import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as windowStateKeeper from 'electron-window-state';
import { setUserAgentForAnalytics } from '../src-shared/analytics/analytics';
import { Logger } from '../src-shared/log/logger';
import { LogFileConfig } from '../src-shared/log/log-file-config';
import './menu';
import { recordAtAppLaunch } from './record-at-app-launch';


Logger.info(`Log File Location: ${LogFileConfig.filePath}`);

let browserWindow: BrowserWindow;
const args = process.argv.slice(1);
const isLiveReloadMode = args.some(val => val === '--serve');

const createWindow = () => {
  // Load the previous state with fallback to defaults
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 800
  });

  // Create the browser window using the state information.
  browserWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    webPreferences: {
      nodeIntegration: true
    }
  });

  const userAgent = browserWindow.webContents.getUserAgent();
  setUserAgentForAnalytics(userAgent);

  if (isLiveReloadMode) {
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/../node_modules/electron`)
    });
    browserWindow.loadURL('http://localhost:4200');
  } else {
    browserWindow.loadURL(url.format({
      pathname: path.join(__dirname, '..', 'dist', 'index.html'),
      protocol: 'file:',
      slashes: true
    }));
  }

  if (isLiveReloadMode) {
    browserWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed.
  browserWindow.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    browserWindow = null;
  });

  mainWindowState.manage(browserWindow);

  recordAtAppLaunch();
  Logger.info('Launching the main window.');
};


try {
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
    if (browserWindow === null) {
      createWindow();
    }
  });
} catch (e) {
  Logger.error(e);
  Logger.error('Fatal error occurred in main process. Photo Location Map is closing.');
  process.exitCode = 1;
}
