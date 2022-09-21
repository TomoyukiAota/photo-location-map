import { MenuItemConstructorOptions } from 'electron';
import { Analytics } from '../../src-shared/analytics/analytics';
import { DevOrProd } from '../../src-shared/dev-or-prod/dev-or-prod';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { Logger } from '../../src-shared/log/logger';
import { mainWindow } from '../electron-main';

const handleShowWelcomeDialogClicked = () => {
  Logger.info(`[Main Window Menu] Clicked "Show Welcome Dialog".`);
  Analytics.trackEvent('Main Window Menu', 'Clicked "Show Welcome Dialog"');

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
  Logger.info(`[Main Window Menu] Selected Map: ${ipcMapChangeArg}.`);
  Analytics.trackEvent('Main Window Menu', `Selected Map: ${ipcMapChangeArg}`);
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
