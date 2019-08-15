import { dialog, MenuItemConstructorOptions } from 'electron';
import { commonHelpSubmenuTemplate, commonMenuTemplate } from './common-menu-template';

export const menuTemplateOnWindowsLinux: MenuItemConstructorOptions[] = [
  ...commonMenuTemplate,
  {
    label: 'Help',
    submenu: [
      ...commonHelpSubmenuTemplate
    ]
  }
];
