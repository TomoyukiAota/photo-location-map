import { ipcMain } from 'electron';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants.js';
import { assertFromMainWindow } from '../ipc/ipc-sender.js';
import { chooseDroppedItem, droppedItemTargetOf } from './dropped-item.js';

// A folder or a file that the user dropped on the main window, asked about before and after the user confirms that
// it opens (./dropped-item.ts).

ipcMain.handle(IpcConstants.DroppedItem.OpenTarget, (event, droppedPath: unknown) => {
  assertFromMainWindow(event, 'Opening a dropped item');
  return droppedItemTargetOf(droppedPath);
});

ipcMain.handle(IpcConstants.DroppedItem.Choose, (event, droppedPath: unknown) => {
  assertFromMainWindow(event, 'Opening a dropped item');
  return chooseDroppedItem(droppedPath);
});
