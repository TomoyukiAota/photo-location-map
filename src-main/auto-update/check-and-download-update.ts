import type { AppUpdater } from 'electron-updater';
import { autoUpdateLogger } from './auto-update-logger.js';

/**
 * Checks for an update, which electron-updater then downloads, and handles the failures of both, which its error event
 * records (configure-auto-update.ts).
 * TL;DR: The download's promise is handled too, so that a download that fails is not also an unhandled rejection.
 * Details: With autoDownload, which is on by default, checkForUpdates() starts the download and resolves with its
 * promise as the result's downloadPromise. When the download fails, electron-updater emits the error event and rejects
 * that promise. Nothing handled it, so every failed download was also an unhandled rejection: recorded a second time,
 * and shown in the dialog of unhandled errors (src-main/unhandled-errors.ts). Two processes of the app that download
 * the same update at once fail so: both write it to the same file in electron-updater's cache folder, and the one that
 * finishes second finds the file renamed by the first, with ENOENT. The download is not awaited, as before.
 */
export async function checkAndDownloadUpdate(updater: AppUpdater): Promise<void> {
  const result = await updater.checkForUpdates().catch(reason => {
    // The same failure as the error event's, which records it.
    autoUpdateLogger.warnNotRecorded(`Promise from autoUpdater.checkForUpdates() is rejected. ${reason}`);
    return null;
  });

  result?.downloadPromise?.catch(reason => {
    // The same failure as the error event's, which records it.
    autoUpdateLogger.warnNotRecorded(`Promise of the update's download is rejected. ${reason}`);
  });
}
