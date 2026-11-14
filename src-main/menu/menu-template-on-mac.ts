import { MenuItemConstructorOptions } from 'electron';
import { t } from '../../src-shared/i18n/i18n.js';
import { commonMenuTemplate } from './common-menu-template.js';
import { commonHelpSubmenuTemplate } from './common-help-submenu-template.js';
import { handleAboutMenuClicked } from './handle-about-menu-clicked.js';

export const menuTemplateOnMac: MenuItemConstructorOptions[] = [
  {
    label: 'The name of the first menu item is the application name on macOS',
    submenu: [
      {
        label: t('menu.app.about'),
        click: () => handleAboutMenuClicked()
      },
      { type: 'separator' },
      { role: 'services', label: t('menu.app.services') },
      { type: 'separator' },
      { role: 'hide', label: t('menu.app.hide') },
      { role: 'hideOthers', label: t('menu.app.hideOthers') },
      { role: 'unhide', label: t('menu.app.showAll') },
      { type: 'separator' },
      { role: 'quit', label: t('menu.app.quit') }
    ]
  },
  ...commonMenuTemplate,
  {
    label: t('menu.help.title'),
    submenu: [
      ...commonHelpSubmenuTemplate
    ]
  }
];
