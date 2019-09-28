import { Menu } from 'electron';
import { ProxyRequire } from '../../src-shared/require/proxy-require';
import { Logger } from '../../src-shared/log/logger';
import { menuTemplateOnWindowsLinux } from './menu-template-on-windows-linux';
import { menuTemplateOnMac } from './menu-template-on-mac';

const os = ProxyRequire.os;

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
