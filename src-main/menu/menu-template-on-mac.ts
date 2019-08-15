import { dialog, MenuItemConstructorOptions } from 'electron';
import { commonMenuTemplate } from './common-menu-template';

export const menuTemplateOnMac: MenuItemConstructorOptions[] = [
  {
    label: 'The name of the first menu item is the application name on macOS',
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideothers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  },
  ...commonMenuTemplate,
  {
    label: 'Help',
    submenu: [
      {
        label: 'Welcome'
      },
      { type: 'separator' },
      { role: 'toggledevtools' },
      { type: 'separator' },
      {
        label: 'Privacy Statement'
      }
    ]
  }
];
