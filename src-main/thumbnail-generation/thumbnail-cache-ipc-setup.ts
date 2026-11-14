import { app, ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants.js';
import { Logger } from '../../src-shared/log/logger.js';
import { plmThumbnailCacheDir } from '../../src-shared/thumbnail/cache/thumbnail-cache-util.js';
import { assertFromMainWindow } from '../ipc/ipc-sender.js';
import { relaunchAndQuit } from '../process/relaunch-and-quit.js';
import { openWithAssociatedApp } from '../shell/open-with-os.js';

// The Cache tab of the settings dialog (src/app/settings-dialog/cache-settings/).

ipcMain.handle(IpcConstants.ThumbnailCache.Open, async event => {
  assertFromMainWindow(event, 'Opening the thumbnail cache');
  await fs.promises.mkdir(plmThumbnailCacheDir, { recursive: true });
  openWithAssociatedApp(plmThumbnailCacheDir);
});

ipcMain.handle(IpcConstants.ThumbnailCache.DeleteAndRestart, async event => {
  assertFromMainWindow(event, 'Deleting the thumbnail cache');
  // What the folder holds is removed, not the folder, which a file manager can have open.
  await fs.promises.mkdir(plmThumbnailCacheDir, { recursive: true });
  const entries = await fs.promises.readdir(plmThumbnailCacheDir);
  await Promise.all(entries.map(entry => fs.promises.rm(path.join(plmThumbnailCacheDir, entry), { recursive: true, force: true })));
  Logger.info(`Thumbnail cache is deleted, so the application will restart.`);
  relaunchAndQuit(app);
});
