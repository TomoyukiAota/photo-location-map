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

const handleSelectPreviousClicked = () => {
  Logger.info(`[Main Window Menu] Clicked "Selection -> Photo Taken Before".`);
  Analytics.trackEvent('Main Window Menu', 'Clicked "Selection -> Photo Taken Before"');
  mainWindow?.webContents.send(IpcConstants.PhotoSelection.SelectPrevious);
};

const handleSelectNextClicked = () => {
  Logger.info(`[Main Window Menu] Clicked "Selection -> Photo Taken After".`);
  Analytics.trackEvent('Main Window Menu', 'Clicked "Selection -> Photo Taken After"');
  mainWindow?.webContents.send(IpcConstants.PhotoSelection.SelectNext);
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
    { type: 'separator' },
    // Select Previous and Select Next, shown as Photo Taken Before and Photo Taken After: the photo taken just before
    // or just after the one selected photo, which the renderer enables these for
    // (src/app/shared/service/select-previous-next.service.ts).
    // TL;DR: Cmd+Left and Cmd+Right on macOS, Ctrl+Left and Ctrl+Right on Windows and Linux: the arrows that photo
    // viewers go through photos with, earlier to the left as the chart lays the time out, with a modifier that lets
    // the page have them first, so that a text field keeps them.
    // Details:
    // - Electron gives an accelerator only a key that the page leaves unhandled, as Electron 45.3 and Chromium 156
    //   have it. On Windows and Linux, the page's views::WebView takes every key to the page first. On macOS,
    //   Chromium takes a key with Cmd to the page first, an arrow key too: its Function flag, which macOS sets for an
    //   arrow, does not count (RenderWidgetHostViewCocoa's keyEvent:wasKeyEquivalent:,
    //   ui::cocoa::ModifierMaskForKeyEvent).
    // - In a text field, the page moves the caret with them, to the start or the end of the line on macOS and by a
    //   word on Windows and Linux, so the menu does not get them there: the Language dialog's search, a text on the
    //   map and the filter of the thumbnails' errors keep them.
    // - Leaflet leaves a key with Ctrl or Cmd to others: its arrows, which pan the map, are without one. The folder
    //   tree's key manager would take them for its arrows, which it does not, unlike the CDK's
    //   (src/app/directory-tree-view/dir-tree-view-key-manager.ts).
    // - Not the system's: macOS moves between spaces with Ctrl+Left and Ctrl+Right, hence Cmd there, and Windows
    //   snaps a window with Win+Left and Win+Right.
    {
      label: t('menu.selection.selectPrevious'),
      id: MenuId.Selection.SelectPrevious,
      enabled: false,
      accelerator: 'CmdOrCtrl+Left',
      click: () => handleSelectPreviousClicked(),
    },
    {
      label: t('menu.selection.selectNext'),
      id: MenuId.Selection.SelectNext,
      enabled: false,
      accelerator: 'CmdOrCtrl+Right',
      click: () => handleSelectNextClicked(),
    },
  ]
};

/** The renderer enables the items of the Selection menu that apply to the selection (src/app/shared/service/). */
export function configureIpcForSelectionMenu(menu: Electron.Menu) {
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

  ipcMain.handle(IpcConstants.PhotoSelection.UpdateSelectPreviousNextMenus,
                 (event, ipcParams: IpcParams.PhotoSelection.UpdateSelectPreviousNextMenus) => {
    Logger.debug(`[IPC Main Received] ${IpcConstants.PhotoSelection.UpdateSelectPreviousNextMenus}`);
    assertFromMainWindow(event, 'Updating the Selection menu');
    if (typeof ipcParams?.isSelectPreviousMenuEnabled !== 'boolean' || typeof ipcParams?.isSelectNextMenuEnabled !== 'boolean')
      throw new Error('Updating the Selection menu needs whether Select Previous and Select Next are enabled.');
    menu.getMenuItemById(MenuId.Selection.SelectPrevious).enabled = ipcParams.isSelectPreviousMenuEnabled;
    menu.getMenuItemById(MenuId.Selection.SelectNext).enabled = ipcParams.isSelectNextMenuEnabled;
  });
}
