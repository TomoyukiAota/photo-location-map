import { recordUnhandledError } from '../analytics/record-error.js';
import { bridge } from '../bridge/plm-bridge.js';
import { Logger } from '../log/logger.js';
import { storageKeyOf } from './renderer-storage-access.js';
import type { UserDataStorageBackend } from './user-data-storage.js';
import { logged, shown } from '../log/logged-line.js';

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

  /** The page's copy of the settings, which the main process gives at its first use; throws if it refuses. */
  private get values(): Map<string, string> {
    if (!this.copy) {
      const entries = bridge().storage.snapshot();
      if (!entries)
        throw new Error('The main process refused the settings to this page.');
      this.copy = new Map(Object.entries(entries));
    }
    return this.copy;
  }

  /** The value at `storagePath` in the page's copy of the settings; throws when there is none. */
  public read(storagePath: ReadonlyArray<string>): string {
    const value = this.values.get(storageKeyOf(storagePath));
    if (value === undefined)
      throw new Error(`No value for ${storagePath.join(',')}`);
    return value;
  }

  public write(storagePath: ReadonlyArray<string>, value: string): Promise<void> {
    this.values.set(storageKeyOf(storagePath), value);
    const written = bridge().storage.write(storagePath, value);
    written.catch(error => {
      Logger.error(logged`[UserDataStorage] Failed to write "${value}" for "${shown(storagePath.join(','))}".`, error);
      recordUnhandledError(error, 'Renderer');
    });
    return written;
  }
}
