import { app, dialog } from 'electron';
import { autoUpdater, UpdateInfo } from 'electron-updater';
import { Logger } from '../src-shared/log/logger';
import { mainWindow } from './electron-main';

autoUpdater.logger = Logger;
Logger.info('App starting...');

function sendStatusToWindow(text) {
  Logger.info(text);
}

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('Update available.');
});

autoUpdater.on('update-not-available', (info) => {
  sendStatusToWindow('Update not available.');
});

autoUpdater.on('error', (err) => {
  sendStatusToWindow('Error in auto-updater. ' + err);
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = 'Download speed: ' + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ')';
  sendStatusToWindow(log_message);
});

const createMessage = (info: UpdateInfo) => {
  return `A new version of Photo Location Map is available and will be installed after restart.
Do you want to restart this application now?

Current version: ${app.getVersion()}
Latest version: ${info.version}`;
};

autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
  sendStatusToWindow('Update downloaded');

  dialog.showMessageBox(mainWindow, {
    title: 'A new version of Photo Location Map is available!',
    type: 'info',
    message: createMessage(info),
    buttons: ['Yes', 'No'],
  }).then(result => {
    const yes = result.response === 0;
    sendStatusToWindow(`User clicked "${yes ? 'Yes' : 'No'}" on the dialog to restart this application to install a new version ${info.version}.`);
    if (yes) {
      autoUpdater.quitAndInstall(true, true);
    }
  });
});

app.on('ready', async () => {
  autoUpdater.checkForUpdates();
});
