import { MenuItemConstructorOptions } from 'electron';

export const commonHelpSubmenuTemplate: MenuItemConstructorOptions[] = [
  {
    label: 'Welcome'
  },
  { type: 'separator' },
  { role: 'toggledevtools' }
];
