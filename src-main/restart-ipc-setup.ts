import { app, ipcMain } from 'electron';
import { IpcConstants } from '../src-shared/ipc/ipc-constants';
import { Logger } from '../src-shared/log/logger';
import { relaunchAndQuit } from '../src-shared/process/restart-app';

ipcMain.on(IpcConstants.AppRestart.Request, () => {
  Logger.info(`[IPC Main Received] ${IpcConstants.AppRestart.Request}`);
  relaunchAndQuit(app);
});
