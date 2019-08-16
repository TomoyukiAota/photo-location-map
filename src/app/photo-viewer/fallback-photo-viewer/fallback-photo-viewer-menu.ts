const electron = window.require('electron').remote.require('electron');

// buildFromTemplateFirstParameterType is the same as MenuItemConstructorOptions[] from electron.
type buildFromTemplateFirstParameterType = Parameters<typeof electron.Menu.buildFromTemplate>[0];

// menuItemConstructorOptions is the same as MenuItemConstructorOptions from electron.
type menuItemConstructorOptions = buildFromTemplateFirstParameterType[0];

const templateMenu: menuItemConstructorOptions[] = [
  {
    label: 'View',
    submenu: [
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click(item, focusedWindow) {
          if (focusedWindow) focusedWindow.reload();
        },
      },
      {
        role: 'togglefullscreen'
      }
    ]
  },
  {
    label: 'Tools',
    submenu: [
      {
        role: 'toggleDevTools'
      }
    ]
  }
];

export const fallbackPhotoViewerMenu = electron.Menu.buildFromTemplate(templateMenu);
