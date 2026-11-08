import { app, ipcMain } from 'electron';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { Logger } from '../../src-shared/log/logger';
import { addExplorerContextMenu, afterPreviousChange, removeExplorerContextMenu } from './explorer-context-menu';

// The OS tab of the settings dialog, shown on Windows only, asks for these. A rejection reaches the renderer's invoke.

/** Adds "Open with Photo Location Map" in the context menu of Explorer, for this application's exe. */
function handleAdd(): Promise<void> {
  Logger.debug(`[IPC Main Received] ${IpcConstants.ExplorerContextMenu.Add}`);
  return afterPreviousChange(() => addExplorerContextMenu(app.getPath('exe')));
}

/** Removes "Open with Photo Location Map" from the context menu of Explorer. */
function handleRemove(): Promise<void> {
  Logger.debug(`[IPC Main Received] ${IpcConstants.ExplorerContextMenu.Remove}`);
  return afterPreviousChange(() => removeExplorerContextMenu());
}

ipcMain.handle(IpcConstants.ExplorerContextMenu.Add, handleAdd);
ipcMain.handle(IpcConstants.ExplorerContextMenu.Remove, handleRemove);
