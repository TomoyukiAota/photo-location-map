import { app, ipcMain } from 'electron';
import * as os from 'os';
import * as path from 'path';
import { DevOrProd } from '../../src-shared/dev-or-prod/dev-or-prod.js';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants.js';
import { LogFileConfig } from '../../src-shared/log/file-config/log-file-config.js';
import { setStartupMetadata, startupMetadata, StartupMetadata } from '../../src-shared/startup/startup-metadata.js';
import { plmThumbnailCacheDir } from '../../src-shared/thumbnail/cache/thumbnail-cache-util.js';
import { isFromMainWindow } from '../ipc/ipc-sender.js';
import { userNameOrEmpty } from '../os/user-name.js';

/**
 * The operating system's preferred languages, the most preferred first, which answer before the app is ready.
 * TL;DR: A test does not follow the machine's languages: with a test profile or in a unit test, they are `en-US`, or
 * what PLM_TEST_SYSTEM_LANGUAGES gives, separated by commas.
 * Details: The suites find elements by their English text and compare screenshots, so on a machine in another
 * language, such as Japanese, they would fail there and pass on CI. A test of another language asks for it.
 */
export function systemLanguagesOf(electronApp: Pick<Electron.App, 'getPreferredSystemLanguages'>, env: NodeJS.ProcessEnv): string[] {
  const isTest = !!env.PLM_TEST_ROOT || !!env.PLM_EM_MAIN || !!env.PLM_EM_RENDERER;
  if (!isTest)
    return electronApp.getPreferredSystemLanguages();
  return (env.PLM_TEST_SYSTEM_LANGUAGES || 'en-US').split(',').map(tag => tag.trim()).filter(tag => tag !== '');
}

/** The startup metadata of this process: of `electronApp`, the computer and `env`. */
export function createStartupMetadata(electronApp: Pick<Electron.App, 'getVersion' | 'getPath' | 'getPreferredSystemLanguages'>,
                                      env: NodeJS.ProcessEnv): StartupMetadata {
  return {
    version: electronApp.getVersion(),
    userDataPath: electronApp.getPath('userData'),
    platform: process.platform,
    systemLanguages: systemLanguagesOf(electronApp, env),
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
