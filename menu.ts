import { BrowserWindow, dialog, Menu, MenuItemConstructorOptions } from 'electron';

const templateMenu: MenuItemConstructorOptions[] = [
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
        type: 'separator',
      },
      {
        role: 'resetzoom',
      },
      {
        role: 'zoomin',
      },
      {
        role: 'zoomout',
      },
      {
        type: 'separator',
      },
      {
        role: 'togglefullscreen',
      }
    ]
  },
  {
    label: 'Option',
    submenu: [
      {
        label: 'Show Log',
        click(item, focusedWindow) {
          const browserWindow = new BrowserWindow({
            width: 400,
            height: 400
          });
          // TODO: Prepare html file and call "browerWindow.loadURL(urlToHtmlFile);"
          if (process.platform !== 'darwin') {
            // On Window and Linux, there is no menu bar for the log window.
            // On macOS, both main and log windows share the same menu bar. (And browserWindow.setMenu function is not available.)
            browserWindow.setMenu(null);
          }
          browserWindow.show();
        }
      }
    ]
  }
];

const menu = Menu.buildFromTemplate(templateMenu);
Menu.setApplicationMenu(menu);
