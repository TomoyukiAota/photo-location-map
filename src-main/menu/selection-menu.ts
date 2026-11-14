import { ipcMain, MenuItemConstructorOptions } from 'electron';
import { Analytics } from '../../src-shared/analytics/analytics.js';
import { t } from '../../src-shared/i18n/i18n.js';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants.js';
import { IpcParams } from '../../src-shared/ipc/ipc-params.js';
import { Logger } from '../../src-shared/log/logger.js';
import { mainWindow } from '../electron-main.js';
import { assertFromMainWindow } from '../ipc/ipc-sender.js';
import { MenuId } from './menu-id.js';

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
  label: t('menu.selection.title'),
  submenu: [
    {
      label: t('menu.selection.undo'),
      id: MenuId.Selection.Undo,
      enabled: false,
      accelerator: 'CmdOrCtrl+Z',
      click: () => handleUndoClicked(),
    },
    {
      label: t('menu.selection.redo'),
      id: MenuId.Selection.Redo,
      enabled: false,
      accelerator: 'CmdOrCtrl+Y',
      click: () => handleRedoClicked(),
    },
  ]
};

export function configureIpcForSelectionUndoRedoMenus(menu: Electron.Menu) {
  ipcMain.handle(IpcConstants.PhotoSelection.UpdateUndoRedoMenus, (event, ipcParams: IpcParams.PhotoSelection.UpdateUndoRedoMenus) => {
    Logger.debug(`[IPC Main Received] ${IpcConstants.PhotoSelection.UpdateUndoRedoMenus}`);
    assertFromMainWindow(event, 'Updating the Selection menu');
    if (typeof ipcParams?.isUndoMenuEnabled !== 'boolean' || typeof ipcParams?.isRedoMenuEnabled !== 'boolean')
      throw new Error('Updating the Selection menu needs whether Undo and Redo are enabled.');
    const undoMenu = menu.getMenuItemById(MenuId.Selection.Undo);
    const redoMenu = menu.getMenuItemById(MenuId.Selection.Redo);
    undoMenu.enabled = ipcParams.isUndoMenuEnabled;
    redoMenu.enabled = ipcParams.isRedoMenuEnabled;
  });
}
