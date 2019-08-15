import { dialog, MenuItemConstructorOptions } from 'electron';
import { commonMenuTemplate } from './common-menu-template';

export const menuTemplateOnWindowsLinux: MenuItemConstructorOptions[] = [
  ...commonMenuTemplate
];
