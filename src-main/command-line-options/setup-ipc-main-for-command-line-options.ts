import { ipcMain } from 'electron';
import { CommandLineOptions } from '../../src-shared/command-line-options/command-line-options';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';

export function setupIpcMainForCommandLineOptions(commandLineOptions: CommandLineOptions) {
  ipcMain.handle(IpcConstants.CommandLineOptions.Get, async () => {
    return commandLineOptions;
  });
}
