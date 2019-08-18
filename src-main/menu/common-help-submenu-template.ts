import { Menu, MenuItemConstructorOptions } from 'electron';
import { Logger } from '../../src-shared/log/logger';
import { MenuId } from './menu-id';

export const commonHelpSubmenuTemplate: MenuItemConstructorOptions[] = [
  {
    label: 'Welcome'
  },
  { type: 'separator' },
  { role: 'toggleDevTools' },
  { type: 'separator' },
  {
    label: 'Advanced Mode',
    type: 'checkbox',
    checked: false,
    click: menuItem => {
      const isAdvancedModeOn = menuItem.checked;
      const mapMenu = Menu.getApplicationMenu().getMenuItemById(MenuId.Map);
      mapMenu.visible = isAdvancedModeOn;
      Logger.info(`Changed Advanced Mode to "${isAdvancedModeOn}".`);
    }
  },
  {
    label: 'Map',
    id: MenuId.Map,
    visible: false,
    submenu: [
      {
        label: 'OpenStreetMap',
        type: 'radio',
        checked: true,
        click: () => {
          Logger.info(`Changed to use OpenStreetMap.`);
        }
      },
      {
        label: 'Google Maps (Your API key is required)',
        type: 'radio',
        click: () => {
          Logger.info(`Changed to use Google Maps.`);
        }
      }
    ]
  }
];
