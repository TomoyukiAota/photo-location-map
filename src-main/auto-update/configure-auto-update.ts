import { app, dialog } from 'electron';
import { autoUpdater, UpdateInfo } from 'electron-updater';
import { Analytics } from '../../src-shared/analytics/analytics';
import { DevOrProd } from '../../src-shared/dev-or-prod/dev-or-prod';
import { isPrereleaseVersion } from '../../src-shared/version/is-prerelease-version';
import { mainWindow } from '../electron-main';
import { autoUpdateLogger } from './auto-update-logger';

autoUpdater.logger = autoUpdateLogger;

autoUpdater.on('download-progress', progress => {
  const progressPercentage = `Download progress: ${progress.percent.toFixed(1)}%`;
  const transferredOutOfTotal = `Downloaded ${progress.transferred} bytes out of ${progress.total} bytes`;
  const downloadSpeed = `Download speed: ${progress.bytesPerSecond} B/s`;
  const message = `${progressPercentage}, ${transferredOutOfTotal}, ${downloadSpeed}.`;
  autoUpdateLogger.info(message);
});

const createMessageForMessageBox = (info: UpdateInfo) => {
  return `A new version of Photo Location Map is available and will be installed after restart.
Do you want to restart this application now?

Current version: ${app.getVersion()}
Latest version: ${info.version}`;
};

autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
  autoUpdateLogger.info(`Update downloaded. Updating from ${app.getVersion()} to ${info.version}.`);
  Analytics.trackEvent('Auto-update', `Auto-update`, `Updating from ${app.getVersion()} to ${info.version}`);

  dialog.showMessageBox(mainWindow, {
    title: 'A new version of Photo Location Map is available!',
    type: 'info',
    message: createMessageForMessageBox(info),
    buttons: ['Yes', 'No'],
  }).then(result => {
    const yes = result.response === 0;
    autoUpdateLogger.info(`User clicked "${yes ? 'Yes' : 'No'}" on the dialog to restart this application to install the new version ${info.version}.`);
    if (yes) {
      autoUpdater.quitAndInstall(true, true);
    }
  });
});

app.on('ready', async () => {
  if (DevOrProd.isDev) {
    autoUpdateLogger.info(`Auto-update is disabled in development environment.`);
    return;
  }

  if (isPrereleaseVersion()) {
    autoUpdateLogger.info(`Auto-update is disabled in prerelease versions (i.e. alpha, beta, and rc).`);
    return;
  }

  await autoUpdater.checkForUpdates().catch(reason => {
    autoUpdateLogger.warn(`Promise from autoUpdater.checkForUpdates() is rejected. ${reason}`);
  });
});
