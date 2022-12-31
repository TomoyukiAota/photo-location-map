import { ipcMain, MenuItemConstructorOptions } from 'electron';
import { Analytics } from '../../src-shared/analytics/analytics';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { IpcParams } from '../../src-shared/ipc/ipc-params';
import { Logger } from '../../src-shared/log/logger';
import { mainWindow } from '../electron-main';
import { MenuId } from './menu-id';

const handleUndoClicked = () => {
  Logger.info(`[Main Window Menu] Clicked "Selection -> Undo".`);
  Analytics.trackEvent('Main Window Menu', 'Clicked "Selection -> Undo"');
  mainWindow?.webContents.send(IpcConstants.PhotoSelection.Undo);
};

const handleRedoClicked = () => {
  Logger.info(`[Main Window Menu] Clicked "Selection -> Redo".`);
  Analytics.trackEvent('Main Window Menu', 'Clicked "Selection -> Redo"');
  mainWindow?.webContents.send(IpcConstants.PhotoSelection.Redo);
};

export const selectionMenuTemplate: MenuItemConstructorOptions = {
  label: 'Selection',
  submenu: [
    {
      label: 'Undo',
      id: MenuId.Selection.Undo,
      enabled: false,
      accelerator: 'CmdOrCtrl+Z',
      click: () => handleUndoClicked(),
    },
    {
      label: 'Redo',
      id: MenuId.Selection.Redo,
      enabled: false,
      accelerator: 'CmdOrCtrl+Y',
      click: () => handleRedoClicked(),
    },
  ]
};

export function configureIpcForSelectionUndoRedoMenus(menu: Electron.Menu) {
  ipcMain.handle(IpcConstants.PhotoSelection.UpdateUndoRedoMenus, (event, ipcParams: IpcParams.PhotoSelection.UpdateUndoRedoMenus) => {
    Logger.info(`Received the IPC invoke request about updating Undo/Redo menus.`);
    const undoMenu = menu.getMenuItemById(MenuId.Selection.Undo);
    const redoMenu = menu.getMenuItemById(MenuId.Selection.Redo);
    undoMenu.enabled = ipcParams.isUndoMenuEnabled;
    redoMenu.enabled = ipcParams.isRedoMenuEnabled;
  });
}
