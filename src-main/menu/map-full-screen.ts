import { BrowserWindow, ipcMain, Menu, MenuItem, MenuItemConstructorOptions } from 'electron';
import { Analytics } from '../../src-shared/analytics/analytics.js';
import { t } from '../../src-shared/i18n/i18n.js';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants.js';
import { Logger } from '../../src-shared/log/logger.js';
import { mainWindow } from '../electron-main.js';
import { assertFromMainWindow } from '../ipc/ipc-sender.js';
import { mapFullScreenState } from '../map-full-screen/map-full-screen-window.js';
import { MenuId } from './menu-id.js';

// The View menu's Map in Full Screen, and the page's requests to put the map in full screen, which the window follows
// (src-main/map-full-screen/map-full-screen-window.ts).

const handleMapFullScreenClicked = (item: MenuItem) => {
  // Electron has checked or unchecked the item: it says what the page says, which answers with IpcConstants.MapFullScreen.Set.
  item.checked = mapFullScreenState.on;
  Logger.info(`[Main Window Menu] Clicked "View -> Map in Full Screen".`);
  Analytics.trackEvent('Main Window Menu', 'Clicked "View -> Map in Full Screen"');
  mainWindow?.webContents.send(IpcConstants.MapFullScreen.Toggle);
};

/** The View menu's Map in Full Screen, checked while the map is in full screen. */
export const mapFullScreenMenuItemTemplate: MenuItemConstructorOptions = {
  label: t('menu.view.mapFullScreen'),
  id: MenuId.View.MapFullScreen,
  type: 'checkbox',
  checked: false,
  click: item => handleMapFullScreenClicked(item),
};

/** The page puts the map in full screen, or takes it out: the window and the View menu's item follow. */
export function configureIpcForMapFullScreen(menu: Menu): void {
  ipcMain.handle(IpcConstants.MapFullScreen.Set, (event, on: unknown) => {
    Logger.debug(`[IPC Main Received] ${IpcConstants.MapFullScreen.Set}`);
    assertFromMainWindow(event, 'Putting the map in full screen');
    if (typeof on !== 'boolean')
      throw new Error('Putting the map in full screen needs whether the map is in full screen.');
    const item = menu.getMenuItemById(MenuId.View.MapFullScreen);
    if (item)
      item.checked = on;
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window)
      mapFullScreenState.set(on, window);
  });
}
