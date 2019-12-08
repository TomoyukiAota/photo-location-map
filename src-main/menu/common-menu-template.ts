import { MenuItemConstructorOptions } from 'electron';
import { Analytics } from '../../src-shared/analytics/analytics';
import { DevOrProd } from '../../src-shared/dev-or-prod/dev-or-prod';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { Logger } from '../../src-shared/log/logger';
import { mainWindow } from '../electron-main';

const handleManageSettingsClicked = () => {
  Logger.info(`[Menu] Clicked "Manage Settings".`);
  Analytics.trackEvent('Clicked Menu', 'Manage Settings');

  if (!mainWindow)
    return;

  mainWindow.webContents.send(IpcConstants.ManageSettings.Name);
};

export const commonMenuTemplate: MenuItemConstructorOptions[] = [
  {
    label: 'View',
    submenu: [
      {
        label: 'Reload',
        visible: DevOrProd.isDev,
        accelerator: DevOrProd.isDev ? 'CmdOrCtrl+R' : '',
        click(item, focusedWindow) {
          if (focusedWindow) focusedWindow.reload();
        },
      },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  {
    label: 'Settings',
    submenu: [
      {
        label: 'Manage Settings',
        click: () => handleManageSettingsClicked()
      }
    ]
  }
];
