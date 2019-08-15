import { dialog, MenuItemConstructorOptions } from 'electron';
import { commonMenuTemplate } from './common-menu-template';

export const menuTemplateOnWindowsLinux: MenuItemConstructorOptions[] = [
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
