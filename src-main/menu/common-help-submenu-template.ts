import { MenuItemConstructorOptions } from 'electron';
import { Analytics } from '../../src-shared/analytics/analytics';
import { DevOrProd } from '../../src-shared/dev-or-prod/dev-or-prod';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { Logger } from '../../src-shared/log/logger';
import { mainWindow } from '../electron-main';

const handleShowWelcomeDialogClicked = () => {
  Logger.info(`[Menu] Clicked "Show Welcome Dialog".`);
  Analytics.trackEvent('Clicked Menu', 'Show Welcome Dialog');

  if (!mainWindow)
    return;

  mainWindow.webContents.send(IpcConstants.WelcomeDialog.Name);
};

const changeMap = (ipcMapChangeArg: string) => {
  if (!mainWindow)
    return;

  mainWindow.webContents.send(IpcConstants.Map.ChangeEvent.Name, ipcMapChangeArg);
};

const selectMap = (ipcMapChangeArg: string) => {
  Logger.info(`[Menu] Selected ${ipcMapChangeArg}.`);
  Analytics.trackEvent('Clicked Menu', `Selected Map: ${ipcMapChangeArg}`);
  changeMap(ipcMapChangeArg);
};

export const commonHelpSubmenuTemplate: MenuItemConstructorOptions[] = [
  {
    label: 'Show Welcome Dialog',
    click: () => handleShowWelcomeDialogClicked()
  },
  { type: 'separator' },
  {
    label: 'Advanced Menu',
    submenu: [
      { role: 'toggleDevTools' },
      {
        label: 'Map',
        visible: DevOrProd.isDev,
        submenu: [
          {
            label: 'OpenStreetMap',
            type: 'radio',
            checked: true,
            click: () => selectMap(IpcConstants.Map.ChangeEvent.Arg.OpenStreetMap)
          },
          {
            label: '[Experimental] Google Maps (Your API key is required. See Developer Tools console.)',
            type: 'radio',
            click: () => selectMap(IpcConstants.Map.ChangeEvent.Arg.GoogleMaps)
          }
        ]
      }
    ]
  }
];
