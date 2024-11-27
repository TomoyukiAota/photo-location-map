import { ipcMain } from 'electron';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { Logger } from '../../src-shared/log/logger';
import { commandLineOptionsValue } from './command-line-options-value';

export function setupIpcMainForCommandLineOptions() {
  ipcMain.handle(IpcConstants.CommandLineOptions.Get, () => {
    Logger.debug(`[IPC Main Received] ${IpcConstants.CommandLineOptions.Get}`);
    return commandLineOptionsValue.get();
  });
}
