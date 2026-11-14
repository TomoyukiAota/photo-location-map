import { BrowserWindow, MenuItemConstructorOptions } from 'electron';
import { Analytics } from '../../src-shared/analytics/analytics.js';
import { DevOrProd } from '../../src-shared/dev-or-prod/dev-or-prod.js';
import { t } from '../../src-shared/i18n/i18n.js';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants.js';
import { Logger } from '../../src-shared/log/logger.js';
import { mainWindow } from '../electron-main.js';
import { selectionMenuTemplate } from './selection-menu.js';

const handleOpenSettingsClicked = () => {
  // The versions in which the item was named "Manage Settings" recorded this event as 'Clicked "Manage Settings"':
  // add the two events when counting how often the item is clicked.
  Logger.info(`[Main Window Menu] Clicked "Open Settings".`);
  Analytics.trackEvent('Main Window Menu', 'Clicked "Open Settings"');

  if (!mainWindow)
    return;

  mainWindow.webContents.send(IpcConstants.ManageSettings.Name);
};

// An item with a role gets its label here too: Electron's own labels for roles are English in any language
// (shell/browser/api/electron_api_menu_roles.cc). In English, they are the labels that Electron gives.
export const commonMenuTemplate: MenuItemConstructorOptions[] = [
  {
    label: t('menu.view.title'),
    submenu: [
      {
        label: t('menu.view.reload'),
        visible: DevOrProd.isDev,
        accelerator: DevOrProd.isDev ? 'CmdOrCtrl+R' : '',
        click(item, focusedWindow) {
          if (focusedWindow instanceof BrowserWindow) {
            focusedWindow.reload();
          }
        },
      },
      { role: 'resetZoom', label: t('menu.view.actualSize') },
      { role: 'zoomIn', label: t('menu.view.zoomIn') },
      { role: 'zoomOut', label: t('menu.view.zoomOut') },
      { type: 'separator' },
      { role: 'togglefullscreen', label: t('menu.view.toggleFullScreen') }
    ]
  },
  selectionMenuTemplate,
  {
    label: t('menu.settings.title'),
    submenu: [
      {
        label: t('menu.settings.openSettings'),
        click: () => handleOpenSettingsClicked()
      }
    ]
  }
];
