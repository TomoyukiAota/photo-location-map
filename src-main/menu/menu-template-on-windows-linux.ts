import { MenuItemConstructorOptions } from 'electron';
import { t } from '../../src-shared/i18n/i18n';
import { commonMenuTemplate } from './common-menu-template';
import { commonHelpSubmenuTemplate } from './common-help-submenu-template';
import { handleAboutMenuClicked } from './handle-about-menu-clicked';

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
