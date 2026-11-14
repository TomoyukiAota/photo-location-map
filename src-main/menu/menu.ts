import { Menu } from 'electron';
import * as os from 'os';
import { Logger } from '../../src-shared/log/logger.js';
import { menuTemplateOnWindowsLinux } from './menu-template-on-windows-linux.js';
import { menuTemplateOnMac } from './menu-template-on-mac.js';
import { configureIpcForSelectionUndoRedoMenus } from './selection-menu.js';

const getMenuTemplate = () => {
  switch (os.platform()) {
    case 'win32':
      return menuTemplateOnWindowsLinux;
    case 'darwin':
      return menuTemplateOnMac;
    case 'linux':
      return menuTemplateOnWindowsLinux;
    default:
      const message = 'Unsupported platform for Application Menu.';
      Logger.error(message);
      throw new Error(message);
  }
};

const menu = Menu.buildFromTemplate(getMenuTemplate());
Menu.setApplicationMenu(menu);
configureIpcForSelectionUndoRedoMenus(menu);
