import { app, BrowserWindow, protocol } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as windowStateKeeper from 'electron-window-state';
import { setUserAgentForAnalytics } from '../src-shared/analytics/analytics';
import { Logger } from '../src-shared/log/logger';
import { LogFileConfig } from '../src-shared/log/log-file-config';
import './auto-update/configure-auto-update';
import './menu/menu';
import './thumbnail-generation/thumbnail-generation';
import { recordAtAppLaunch } from './record-at-app-launch';


Logger.info(`Log File Location: ${LogFileConfig.filePath}`);

export let mainWindow: BrowserWindow;
const args = process.argv.slice(1);
const isLiveReloadMode = args.some(val => val === '--serve');

const createWindow = () => {
  // Load the previous state with fallback to defaults
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 800
  });

  // Create the main window using the state information.
  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: true,
      webSecurity: false,
      worldSafeExecuteJavaScript: false
    }
  });

  const userAgent = mainWindow.webContents.userAgent;
  setUserAgentForAnalytics(userAgent);

  if (isLiveReloadMode) {
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/../node_modules/electron`)
    });
    mainWindow.loadURL('http://localhost:4200');
  } else {
    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, '..', 'dist', 'index.html'),
      protocol: 'file:',
      slashes: true
    }));
  }

  if (isLiveReloadMode) {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  mainWindowState.manage(mainWindow);

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
    if (mainWindow === null) {
      createWindow();
    }
  });

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
  process.exitCode = 1;
}
