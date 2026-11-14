import { app, ipcMain } from 'electron';
import fsExtra from 'fs-extra';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants.js';
import { Logger } from '../../src-shared/log/logger.js';
import { plmThumbnailCacheDir } from '../../src-shared/thumbnail/cache/thumbnail-cache-util.js';
import { assertFromMainWindow } from '../ipc/ipc-sender.js';
import { relaunchAndQuit } from '../process/relaunch-and-quit.js';
import { openWithAssociatedApp } from '../shell/open-with-os.js';

// The Cache tab of the settings dialog (src/app/settings-dialog/cache-settings/).

ipcMain.handle(IpcConstants.ThumbnailCache.Open, async event => {
  assertFromMainWindow(event, 'Opening the thumbnail cache');
  await fsExtra.ensureDir(plmThumbnailCacheDir);
  openWithAssociatedApp(plmThumbnailCacheDir);
});

ipcMain.handle(IpcConstants.ThumbnailCache.DeleteAndRestart, async event => {
  assertFromMainWindow(event, 'Deleting the thumbnail cache');
  await fsExtra.emptyDir(plmThumbnailCacheDir);
  Logger.info(`Thumbnail cache is deleted, so the application will restart.`);
  relaunchAndQuit(app);
});
