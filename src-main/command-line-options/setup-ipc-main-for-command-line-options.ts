import { ipcMain } from 'electron';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { Logger } from '../../src-shared/log/logger';
import { commandLineOptionsValue } from './command-line-options-value';

export function setupIpcMainForCommandLineOptions() {
  ipcMain.handle(IpcConstants.CommandLineOptions.Get, () => {
    Logger.info(`Received the IPC invoke request about getting commang line options.`);
    return commandLineOptionsValue.get();
  });
}
