import { app, ipcMain } from 'electron';
import * as os from 'os';
import * as path from 'path';
import { DevOrProd } from '../../src-shared/dev-or-prod/dev-or-prod';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { LogFileConfig } from '../../src-shared/log/file-config/log-file-config';
import { setStartupMetadata, startupMetadata, StartupMetadata } from '../../src-shared/startup/startup-metadata';
import { plmThumbnailCacheDir } from '../../src-shared/thumbnail/cache/thumbnail-cache-util';
import { isFromMainWindow } from '../ipc/ipc-sender';

/** os.userInfo() throws where the user has no name, such as in some containers. */
function userNameOrEmpty(): string {
  try {
    return os.userInfo().username;
  } catch {
    return '';
  }
}

/** The startup metadata of this process: of `electronApp`, the computer and `env`. */
export function createStartupMetadata(electronApp: Pick<Electron.App, 'getVersion' | 'getPath'>,
                                      env: NodeJS.ProcessEnv): StartupMetadata {
  return {
    version: electronApp.getVersion(),
    userDataPath: electronApp.getPath('userData'),
    platform: process.platform,
    pathSeparator: path.sep,
    homeDir: os.homedir(),
    userName: userNameOrEmpty(),
    devOrProd: DevOrProd.toString(),
    isE2e: env.PLM_E2E === '1',
    logFile: { dirName: LogFileConfig.dirName, fileName: LogFileConfig.fileName, filePath: LogFileConfig.filePath },
    thumbnailCacheDir: plmThumbnailCacheDir,
  };
}

// Set at the start, after the log (src-main/electron-main.ts): modules read it while they are evaluated.
setStartupMetadata(createStartupMetadata(app, process.env));

// The main window's preload asks for it synchronously, before the page's modules run (src-shared/startup/).
ipcMain.on(IpcConstants.StartupMetadata.Get, event => {
  event.returnValue = isFromMainWindow(event) ? startupMetadata() : null;
});
