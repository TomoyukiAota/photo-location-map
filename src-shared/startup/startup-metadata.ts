import { plmBridge } from '../bridge/plm-bridge.js';

/** What the renderer needs to know about the app and the computer from the main process; none of it changes. */
export interface StartupMetadata {
  /** app.getVersion() */
  version: string;
  /** app.getPath('userData'), the directory of the settings (src-shared/user-data-storage/). */
  userDataPath: string;
  /** process.platform of the main process. */
  platform: string;
  /**
   * The operating system's preferred languages, the most preferred first, such as `ja-JP`; in a test, what the test
   * gave instead (src-main/startup/). The application's language is decided from them (src-shared/i18n/).
   */
  systemLanguages: string[];
  /** The separator of this platform's paths, path.sep. */
  pathSeparator: string;
  /** os.homedir() and os.userInfo().username, which errors are scrubbed of before analytics records them. */
  homeDir: string;
  userName: string;
  /** DevOrProd of the main process (src-shared/dev-or-prod/). */
  devOrProd: 'Dev' | 'Prod';
  /** The app runs for the e2e suite (PLM_E2E), which the page's e2e hooks are for. */
  isE2e: boolean;
  /** Where the log file is (src-shared/log/file-config/). */
  logFile: { dirName: string, fileName: string, filePath: string };
  /** Where the HEIF thumbnails are kept (src-shared/thumbnail/cache/). */
  thumbnailCacheDir: string;
}

let metadata: StartupMetadata | undefined;

/** Sets the metadata, in the main process, at its start (src-main/startup/). */
export function setStartupMetadata(newMetadata: StartupMetadata): void {
  metadata = newMetadata;
}

/**
 * The startup metadata, in either process: what the main process set, or, in a renderer, what its preload asked for
 * synchronously before the page's modules ran (electron-util/preload/main-window.cjs).
 * TL;DR: Available while a module is evaluated.
 * Details: UserDataStorage and currentUserSettings read the settings, and is-prerelease-version the version, while
 * src/start-app.ts's static imports are evaluated, before its bootstrap function runs, so an answer awaited there would come
 * too late.
 */
export function startupMetadata(): StartupMetadata {
  if (!metadata)
    metadata = plmBridge()?.startup;
  if (!metadata)
    throw new Error('The startup metadata is not available yet: the main process sets it at its start (src-main/startup/).');
  return metadata;
}

/** The platform the app runs on, in either process, as process.platform. */
export function currentPlatform(): string {
  return typeof process !== 'undefined' && process.type === 'browser' ? process.platform : startupMetadata().platform;
}
