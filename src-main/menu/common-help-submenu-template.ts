import { Menu, MenuItemConstructorOptions } from 'electron';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { Logger } from '../../src-shared/log/logger';
import { mainWindow } from '../electron-main';
import { MenuId } from './menu-id';

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
    label: 'Show Welcome Dialog'
  },
  { type: 'separator' },
  {
    label: ' ----- Advanced Menu ----- ',
    enabled: false
  },
  { role: 'toggleDevTools' },
  {
    label: 'Map',
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
