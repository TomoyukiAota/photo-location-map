import { Menu, MenuItemConstructorOptions } from 'electron';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { Logger } from '../../src-shared/log/logger';
import { MenuId } from './menu-id';
import { mainWindow } from '../electron-main';

const changeMap = (ipcMapChangeArg: string) => {
  if (!mainWindow)
    return;

  mainWindow.webContents.send(IpcConstants.Map.ChangeEvent.Name, ipcMapChangeArg);
};

const selectMap = (ipcMapChangeArg: string) => {
  Logger.info(`[Menu] Selected ${ipcMapChangeArg}.`);
  changeMap(ipcMapChangeArg);
};

export const commonHelpSubmenuTemplate: MenuItemConstructorOptions[] = [
  {
    label: 'Welcome'
  },
  { type: 'separator' },
  { role: 'toggleDevTools' },
  { type: 'separator' },
  {
    label: 'Advanced Mode',
    type: 'checkbox',
    checked: false,
    click: menuItem => {
      const isAdvancedModeOn = menuItem.checked;
      const mapMenu = Menu.getApplicationMenu().getMenuItemById(MenuId.Map);
      mapMenu.visible = isAdvancedModeOn;
      Logger.info(`[Menu] Changed Advanced Mode to "${isAdvancedModeOn}".`);
    }
  },
  {
    label: 'Map',
    id: MenuId.Map,
    visible: false,
    submenu: [
      {
        label: 'OpenStreetMap',
        type: 'radio',
        checked: true,
        click: () => selectMap(IpcConstants.Map.ChangeEvent.Arg.OpenStreetMap)
      },
      {
        label: 'Google Maps (Your API key is required)',
        type: 'radio',
        click: () => selectMap(IpcConstants.Map.ChangeEvent.Arg.GoogleMaps)
      }
    ]
  }
];
