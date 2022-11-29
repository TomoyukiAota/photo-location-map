import { MenuItemConstructorOptions } from 'electron';
import * as fsExtra from 'fs-extra';
import { Analytics } from '../../src-shared/analytics/analytics';
import { openWithAssociatedApp } from '../../src-shared/command/command';
import { DevOrProd } from '../../src-shared/dev-or-prod/dev-or-prod';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { LogFileConfig } from '../../src-shared/log/file-config/log-file-config';
import { Logger } from '../../src-shared/log/logger';
import { mainWindow } from '../electron-main';

const handleShowWelcomeDialogClicked = () => {
  Logger.info(`[Main Window Menu] Clicked "Show Welcome Dialog".`);
  Analytics.trackEvent('Main Window Menu', 'Clicked "Show Welcome Dialog"');

  if (!mainWindow)
    return;

  mainWindow.webContents.send(IpcConstants.WelcomeDialog.Name);
};

const handleOpenLogFolderClicked = () => {
  Logger.info(`[Main Window Menu] Clicked "Open Log Folder".`);
  Analytics.trackEvent('Main Window Menu', 'Clicked "Open Log Folder"');
  fsExtra.ensureDirSync(LogFileConfig.dirName); // The log folder is created when the app starts, but ensuring the directory just in case.
  openWithAssociatedApp(LogFileConfig.dirName);
};

const changeMap = (ipcMapChangeArg: string) => {
  if (!mainWindow)
    return;

  mainWindow.webContents.send(IpcConstants.Map.ChangeEvent.Name, ipcMapChangeArg);
};

const selectMap = (ipcMapChangeArg: string) => {
  Logger.info(`[Main Window Menu] Selected Map: ${ipcMapChangeArg}.`);
  Analytics.trackEvent('Main Window Menu', `[Main Window Menu] Selected Map`, `Selected Map: ${ipcMapChangeArg}`);
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
      {
        label: 'Open Log Folder',
        click: () => handleOpenLogFolderClicked(),
      },
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
