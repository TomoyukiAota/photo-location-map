import { app, ipcMain } from 'electron';
import { IpcConstants } from '../src-shared/ipc/ipc-constants.js';
import { Logger } from '../src-shared/log/logger.js';
import { useMainProcessRestart } from '../src-shared/process/restart-app.js';
import { isFromMainWindow } from './ipc/ipc-sender.js';
import { relaunchAndQuit } from './process/relaunch-and-quit.js';
import { logged, shown } from '../src-shared/log/logged-line.js';

useMainProcessRestart(() => relaunchAndQuit(app));

ipcMain.on(IpcConstants.AppRestart.Request, event => {
  Logger.info(`[IPC Main Received] ${IpcConstants.AppRestart.Request}`);
  if (!isFromMainWindow(event)) {
    Logger.warn(logged`Refused ${shown(IpcConstants.AppRestart.Request)}, which only the main window may send.`);
    return;
  }
  relaunchAndQuit(app);
});
