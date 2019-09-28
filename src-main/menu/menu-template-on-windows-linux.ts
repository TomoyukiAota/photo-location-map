import { MenuItemConstructorOptions } from 'electron';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { Logger } from '../../src-shared/log/logger';
import { commonMenuTemplate } from './common-menu-template';
import { commonHelpSubmenuTemplate } from './common-help-submenu-template';
import { mainWindow } from '../electron-main';

const handleAboutMenuClicked = () => {
  Logger.info(`[Menu] Clicked "About Photo Location Map".`);

  if (!mainWindow)
    return;

  mainWindow.webContents.send(IpcConstants.AboutBox.Name);
};

export const menuTemplateOnWindowsLinux: MenuItemConstructorOptions[] = [
  ...commonMenuTemplate,
  {
    label: 'Help',
    submenu: [
      {
        label: 'About Photo Location Map',
        click: () => handleAboutMenuClicked()
      },
      ...commonHelpSubmenuTemplate
    ]
  }
];
