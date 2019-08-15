import { dialog, MenuItemConstructorOptions } from 'electron';

export const menuTemplateOnMac: MenuItemConstructorOptions[] = [
  {
    label: 'The name of the first menu item is the application name on macOS',
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideothers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  },
  {
    label: 'Selection',
    submenu: [
      {
        label: 'Undo',
        click(item, focusedWindow) {
          const options = {
            type: 'info',
            buttons: ['OK'],
            title: 'Undo Menu Clicked',
            message: 'Undo menu is clicked!',
            detail: 'This will be replaced with undo selection of item(s) in treeview.'
          };
          dialog.showMessageBox(focusedWindow, options);
        }
      },
      {
        label: 'Redo',
        click(item, focusedWindow) {
          const options = {
            type: 'info',
            buttons: ['OK'],
            title: 'Redo Menu Clicked',
            message: 'Redo menu is clicked!',
            detail: 'This will be replaced with redo selection of item(s) in treeview.'
          };
          dialog.showMessageBox(focusedWindow, options);
        }
      }
    ]
  },
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
        type: 'separator'
      },
      {
        role: 'resetzoom'
      },
      {
        role: 'zoomin'
      },
      {
        role: 'zoomout'
      },
      {
        type: 'separator'
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
        role: 'toggledevtools'
      }
    ]
  }
];
