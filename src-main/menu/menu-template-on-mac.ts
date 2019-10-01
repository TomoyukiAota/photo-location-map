import { MenuItemConstructorOptions } from 'electron';
import { commonMenuTemplate } from './common-menu-template';
import { commonHelpSubmenuTemplate } from './common-help-submenu-template';
import { handleAboutMenuClicked } from './handle-about-menu-clicked';

export const menuTemplateOnMac: MenuItemConstructorOptions[] = [
  {
    label: 'The name of the first menu item is the application name on macOS',
    submenu: [
      {
        label: 'About Photo Location Map',
        click: () => handleAboutMenuClicked()
      },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  },
  ...commonMenuTemplate,
  {
    label: 'Help',
    submenu: [
      ...commonHelpSubmenuTemplate
    ]
  }
];
