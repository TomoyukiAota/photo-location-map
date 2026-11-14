import { app, dialog } from 'electron';
import { autoUpdater, UpdateInfo } from 'electron-updater';
import { Analytics } from '../../src-shared/analytics/analytics';
import { scrubbedErrorLabel } from '../../src-shared/analytics/record-error';
import { DevOrProd } from '../../src-shared/dev-or-prod/dev-or-prod';
import { t } from '../../src-shared/i18n/i18n';
import { isPrereleaseVersion } from '../../src-shared/version/is-prerelease-version';
import { mainWindow } from '../electron-main';
import { autoUpdateLogger } from './auto-update-logger';
import { currentSystemVersion, isVersionAtLeast, minimumSystemVersionOf } from './minimum-system-version';
import { logged, shown } from '../../src-shared/log/logged-line';

autoUpdater.logger = autoUpdateLogger;

// TL;DR: Skip an update that needs a newer macOS or Windows than this computer has, instead of installing an app that
// cannot start.
// Details: Electron follows Chromium in dropping old OS versions: Electron 23 needs Windows 10, and Electron 45 needs
// macOS 13. The NSIS installer does not check the Windows version, and electron-updater checks only a top-level
// minimumSystemVersion, which electron-builder cannot write and which is compared with os.release(), the Darwin version on
// macOS (21.x for macOS 12). electron-builder.json therefore declares the minimum for latest-mac.yml and latest.yml
// (mac.releaseInfo.vendor and win.releaseInfo.vendor), and electron-updater calls isUpdateSupported with it before
// downloading anything. This protects only installs that already have this check; see
// docs/contributing/minimum-os-versions.md.
const isUpdateSupportedByDefault = autoUpdater.isUpdateSupported;
autoUpdater.isUpdateSupported = async updateInfo => {
  if (!await isUpdateSupportedByDefault(updateInfo))
    return false;

  const minimumVersion = minimumSystemVersionOf(updateInfo);
  const system = currentSystemVersion();
  if (minimumVersion === undefined || system === undefined)
    return true;

  const supported = isVersionAtLeast(system.version, minimumVersion);
  if (supported === undefined) {
    autoUpdateLogger.warnRecorded(logged`Cannot compare ${shown(system.name)} ${shown(system.version)} with ${shown(minimumVersion)}, the minimum of ${shown(updateInfo.version)}, so the update is not skipped.`);
    return true;
  }

  if (!supported) {
    autoUpdateLogger.info(`Skipping ${updateInfo.version}, which requires ${system.name} ${minimumVersion}. This computer has ${system.name} ${system.version}.`);
    Analytics.trackEvent('Auto-update', 'Auto-update: Skipped for OS version', `Skipped ${updateInfo.version}, which requires ${system.name} ${minimumVersion}, on ${system.name} ${system.version}`);
  }
  return supported;
};

// Whether some users never receive updates. The message can contain paths, which are removed.
autoUpdater.on('error', error => {
  autoUpdateLogger.warnNotRecorded(`Auto-update failed: ${error}`);  // Recorded as "Auto-update: Error", below.
  Analytics.trackEvent('Auto-update', 'Auto-update: Error', scrubbedErrorLabel(error));
});

autoUpdater.on('download-progress', progress => {
  const progressPercentage = `Download progress: ${progress.percent.toFixed(1)}%`;
  const transferredOutOfTotal = `Downloaded ${progress.transferred} bytes out of ${progress.total} bytes`;
  const downloadSpeed = `Download speed: ${progress.bytesPerSecond} B/s`;
  const message = `${progressPercentage}, ${transferredOutOfTotal}, ${downloadSpeed}.`;
  autoUpdateLogger.info(message);
});

const createMessageForMessageBox = (info: UpdateInfo) => {
  return t('autoUpdate.message', { currentVersion: app.getVersion(), latestVersion: info.version });
};

autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
  autoUpdateLogger.info(`Update downloaded. Updating from ${app.getVersion()} to ${info.version}.`);
  Analytics.trackEvent('Auto-update', `Auto-update`, `Updating from ${app.getVersion()} to ${info.version}`);

  dialog.showMessageBox(mainWindow, {
    title: t('autoUpdate.title'),
    type: 'info',
    message: createMessageForMessageBox(info),
    buttons: [t('autoUpdate.yes'), t('autoUpdate.no')],
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
    // The same failure as the error event's, which records it.
    autoUpdateLogger.warnNotRecorded(`Promise from autoUpdater.checkForUpdates() is rejected. ${reason}`);
  });
});
