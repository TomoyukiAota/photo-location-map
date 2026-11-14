import { MenuItemConstructorOptions } from 'electron';
import fsExtra from 'fs-extra';
import { Analytics } from '../../src-shared/analytics/analytics.js';
import { openWithAssociatedApp } from '../shell/open-with-os.js';
import { t } from '../../src-shared/i18n/i18n.js';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants.js';
import { LogFileConfig } from '../../src-shared/log/file-config/log-file-config.js';
import { Logger } from '../../src-shared/log/logger.js';
import { mainWindow } from '../electron-main.js';

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
