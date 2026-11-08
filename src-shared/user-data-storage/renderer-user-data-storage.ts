import { recordUnhandledError } from '../analytics/record-error';
import { IpcConstants } from '../ipc/ipc-constants';
import { Logger } from '../log/logger';
import { ProxyRequire } from '../require/proxy-require';
import { storageKeyOf } from './renderer-storage-access';
import type { UserDataStorageBackend } from './user-data-storage';

/**
 * A renderer's settings: a copy, which it gets once from the main process, and writes that the main process makes.
 * TL;DR: Reads are synchronous, from the copy; a write changes the copy at once, then the main process writes it.
 * Details: Components read settings while they are built, so reads cannot wait for IPC. The main process handles
 * one renderer's requests in the order they were sent, so the writes keep their order, and a write sent before the
 * window closes is handled before the window is gone. Saving settings that need a restart waits for its writes
 * before it asks for the restart (src-shared/user-settings/).
 */
export class RendererUserDataStorage implements UserDataStorageBackend {
  private copy: Map<string, string> | undefined;

  private get values(): Map<string, string> {
    if (!this.copy) {
      const entries: Record<string, string> = ProxyRequire.electron.ipcRenderer.sendSync(IpcConstants.UserDataStorage.Snapshot);
      this.copy = new Map(Object.entries(entries));
    }
    return this.copy;
  }

  public read(storagePath: ReadonlyArray<string>): string {
    const value = this.values.get(storageKeyOf(storagePath));
    if (value === undefined)
      throw new Error(`No value for ${storagePath.join(',')}`);
    return value;
  }

  public write(storagePath: ReadonlyArray<string>, value: string): Promise<void> {
    this.values.set(storageKeyOf(storagePath), value);
    const written: Promise<void> = ProxyRequire.electron.ipcRenderer.invoke(IpcConstants.UserDataStorage.Write, storagePath, value);
    written.catch(error => {
      Logger.error(`[UserDataStorage] Failed to write "${value}" for "${storagePath.join(',')}".`, error);
      recordUnhandledError(error, 'Renderer');
    });
    return written;
  }
}
