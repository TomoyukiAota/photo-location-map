import { app, ipcMain } from 'electron';
import { IpcConstants } from '../src-shared/ipc/ipc-constants';
import { Logger } from '../src-shared/log/logger';
import { relaunchAndQuit, useMainProcessRestart } from '../src-shared/process/restart-app';
import { isFromMainWindow } from './ipc/ipc-sender';

useMainProcessRestart(() => relaunchAndQuit(app));

ipcMain.on(IpcConstants.AppRestart.Request, event => {
  Logger.info(`[IPC Main Received] ${IpcConstants.AppRestart.Request}`);
  if (!isFromMainWindow(event)) {
    Logger.warn(`Refused ${IpcConstants.AppRestart.Request}, which only the main window may send.`);
    return;
  }
  relaunchAndQuit(app);
});
