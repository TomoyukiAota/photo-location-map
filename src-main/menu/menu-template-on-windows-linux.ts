import { MenuItemConstructorOptions } from 'electron';
import { commonMenuTemplate } from './common-menu-template';
import { commonHelpSubmenuTemplate } from './common-help-submenu-template';

export const menuTemplateOnWindowsLinux: MenuItemConstructorOptions[] = [
  ...commonMenuTemplate,
  {
    label: 'Help',
    submenu: [
      {
        label: 'About Photo Location Map'
      },
      ...commonHelpSubmenuTemplate
    ]
  }
];
