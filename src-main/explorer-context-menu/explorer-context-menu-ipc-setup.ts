import { app, ipcMain } from 'electron';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { Logger } from '../../src-shared/log/logger';
import { addExplorerContextMenu, afterPreviousChange, removeExplorerContextMenu } from './explorer-context-menu';

// The OS tab of the settings dialog, shown on Windows only, asks for these. A rejection reaches the renderer's invoke.
ipcMain.handle(IpcConstants.ExplorerContextMenu.Add, () => {
  Logger.debug(`[IPC Main Received] ${IpcConstants.ExplorerContextMenu.Add}`);
  return afterPreviousChange(() => addExplorerContextMenu(app.getPath('exe')));
});

ipcMain.handle(IpcConstants.ExplorerContextMenu.Remove, () => {
  Logger.debug(`[IPC Main Received] ${IpcConstants.ExplorerContextMenu.Remove}`);
  return afterPreviousChange(() => removeExplorerContextMenu());
});
