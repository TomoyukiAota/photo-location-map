import { MenuItemConstructorOptions } from 'electron';
import { t } from '../../src-shared/i18n/i18n.js';
import { commonMenuTemplate } from './common-menu-template.js';
import { commonHelpSubmenuTemplate } from './common-help-submenu-template.js';
import { handleAboutMenuClicked } from './handle-about-menu-clicked.js';

export const menuTemplateOnWindowsLinux: MenuItemConstructorOptions[] = [
  ...commonMenuTemplate,
  {
    label: t('menu.help.title'),
    submenu: [
      {
        label: t('menu.app.about'),
        click: () => handleAboutMenuClicked()
      },
      ...commonHelpSubmenuTemplate
    ]
  }
];
