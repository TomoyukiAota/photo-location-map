import { ipcMain } from 'electron';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { commandLineOptionsValue } from './command-line-options-value';

export function setupIpcMainForCommandLineOptions() {
  ipcMain.handle(IpcConstants.CommandLineOptions.Get, async () => {
    return commandLineOptionsValue.get();
  });
}
