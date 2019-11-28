import { MenuItemConstructorOptions } from 'electron';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { Logger } from '../../src-shared/log/logger';
import { mainWindow } from '../electron-main';

const handleManageSettingsClicked = () => {
    Logger.info(`[Menu] Clicked "Manage Settings".`);

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
        accelerator: 'CmdOrCtrl+R',
        click(item, focusedWindow) {
          if (focusedWindow) focusedWindow.reload();
        },
      },
      { type: 'separator' },
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
