import { MenuItemConstructorOptions } from 'electron';
import * as fsExtra from 'fs-extra';
import { Analytics } from '../../src-shared/analytics/analytics';
import { openWithAssociatedApp } from '../shell/open-with-os';
import { t } from '../../src-shared/i18n/i18n';
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

export const commonHelpSubmenuTemplate: MenuItemConstructorOptions[] = [
  {
    label: t('menu.help.showWelcomeDialog'),
    click: () => handleShowWelcomeDialogClicked()
  },
  { type: 'separator' },
  {
    label: t('menu.help.advancedMenu'),
    submenu: [
      {
        label: t('menu.help.openLogFolder'),
        click: () => handleOpenLogFolderClicked(),
      },
      { role: 'toggleDevTools', label: t('menu.help.toggleDeveloperTools') }
    ]
  }
];
