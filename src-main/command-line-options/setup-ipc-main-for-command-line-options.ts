import { ipcMain } from 'electron';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants.js';
import { Logger } from '../../src-shared/log/logger.js';
import { assertFromMainWindow } from '../ipc/ipc-sender.js';
import { chooseFolderOf, openTargetOf } from '../open-target/open-target.js';
import { commandLineOptionsValue } from './command-line-options-value.js';

export function setupIpcMainForCommandLineOptions() {
  ipcMain.handle(IpcConstants.CommandLineOptions.OpenTarget, async event => {
    Logger.debug(`[IPC Main Received] ${IpcConstants.CommandLineOptions.OpenTarget}`);
    assertFromMainWindow(event, 'Reading --open');
    const target = await openTargetOf(commandLineOptionsValue.get()?.open);
    // The user chose this folder, or the folder of this file, by opening the app with it.
    chooseFolderOf(target);
    return target;
  });
}
