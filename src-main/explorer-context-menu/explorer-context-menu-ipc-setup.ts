import { app, ipcMain } from 'electron';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants.js';
import { Logger } from '../../src-shared/log/logger.js';
import { assertFromMainWindow } from '../ipc/ipc-sender.js';
import { addExplorerContextMenu, afterPreviousChange, removeExplorerContextMenu } from './explorer-context-menu.js';

// The OS tab of the settings dialog, shown on Windows only, asks for these. A rejection reaches the renderer's invoke.

/** Adds "Open with Photo Location Map" in the context menu of Explorer, for this application's exe. */
function handleAdd(event: Electron.IpcMainInvokeEvent): Promise<void> {
  Logger.debug(`[IPC Main Received] ${IpcConstants.ExplorerContextMenu.Add}`);
  assertFromMainWindow(event, 'Adding to the context menu of Explorer');
  return afterPreviousChange(() => addExplorerContextMenu(app.getPath('exe')));
}

/** Removes "Open with Photo Location Map" from the context menu of Explorer. */
function handleRemove(event: Electron.IpcMainInvokeEvent): Promise<void> {
  Logger.debug(`[IPC Main Received] ${IpcConstants.ExplorerContextMenu.Remove}`);
  assertFromMainWindow(event, 'Removing from the context menu of Explorer');
  return afterPreviousChange(() => removeExplorerContextMenu());
}

ipcMain.handle(IpcConstants.ExplorerContextMenu.Add, handleAdd);
ipcMain.handle(IpcConstants.ExplorerContextMenu.Remove, handleRemove);
