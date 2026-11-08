import { IpcConstants } from '../ipc/ipc-constants';
import { ProcessIdentifier } from '../process/process-identifier';
import { ProxyRequire } from '../require/proxy-require';

/** What the renderer needs to know about the app from the main process; none of it changes while the app runs. */
export interface StartupMetadata {
  /** app.getVersion() */
  version: string;
  /** app.getPath('userData'), the directory of the settings (src-shared/user-data-storage/). */
  userDataPath: string;
}

/** The metadata of `app`, which the main process answers the renderer's request with. */
export function createStartupMetadata(app: Pick<Electron.App, 'getVersion' | 'getPath'>): StartupMetadata {
  return { version: app.getVersion(), userDataPath: app.getPath('userData') };
}

let metadata: StartupMetadata | undefined;

/**
 * The startup metadata, in either process.
 *
 * The renderer asks the main process once, synchronously, when it first needs the metadata, and keeps the answer.
 * TL;DR: Synchronously, so that a module can read it while it is evaluated, before Angular starts.
 * Details: UserDataStorage and currentUserSettings read the settings, and is-prerelease-version the version, while
 * src/main.ts's static imports are evaluated, before its bootstrap function runs, so an answer awaited there would come
 * too late. One request at the first use replaces the many synchronous calls that @electron/remote made for these.
 */
export function startupMetadata(): StartupMetadata {
  if (!metadata) {
    metadata = ProcessIdentifier.isElectronMain
      ? createStartupMetadata(ProxyRequire.electron.app)
      : ProxyRequire.electron.ipcRenderer.sendSync(IpcConstants.StartupMetadata.Get);
  }
  return metadata;
}
