import { Logger } from '../log/logger.js';
import { ProcessIdentifier } from '../process/process-identifier.js';
import { RendererUserDataStorage } from './renderer-user-data-storage.js';

/**
 * Where the settings are kept. The main process owns them: its backend reads and writes their files
 * (src-main/user-data-storage/). A renderer reads its copy, which it gets once from the main process, and asks the main
 * process to write (renderer-user-data-storage.ts).
 */
export interface UserDataStorageBackend {
  /** The value of `storagePath`. Throws when there is none. */
  read(storagePath: ReadonlyArray<string>): string;
  /**
   * Saves `value` for `storagePath`. Later reads give `value` at once. The promise settles once it is written, and
   * rejects if it could not be; a failure is also logged, so that a caller may ignore the promise.
   */
  write(storagePath: ReadonlyArray<string>, value: string): Promise<void>;
}

let backend: UserDataStorageBackend | undefined;

export class UserDataStorage {
  /** Sets where the settings are kept: in the main process, its files, before anything reads them. */
  public static useBackend(newBackend: UserDataStorageBackend): void {
    backend = newBackend;
  }

  /** Where the settings are kept: set by the main process at its startup, and a copy from it in a renderer. */
  private static get backend(): UserDataStorageBackend {
    if (!backend) {
      if (ProcessIdentifier.isElectronMain)
        throw new Error('The main process reads its settings before src-main/user-data-storage/ set where they are kept.');
      backend = new RendererUserDataStorage();
    }
    return backend;
  }

  public static read(storagePath: ReadonlyArray<string>): string {
    this.log(storagePath, 'Attempt to read');
    const value = this.backend.read(storagePath);
    this.log(storagePath, `Read result is "${value}"`);
    return value;
  }

  public static readOrDefault(storagePath: ReadonlyArray<string>, defaultValue: string): string {
    let result: string;

    try {
      result = UserDataStorage.read(storagePath);
    } catch (error) {
      this.log(storagePath, `Failed to read. Instead, "${defaultValue}" will be the read result. Error Message: ${error.toString()}`);
      result = defaultValue;
    }

    return result;
  }

  public static write(storagePath: ReadonlyArray<string>, value: string): Promise<void> {
    this.log(storagePath, `Attempt to write "${value}"`);
    const written = this.backend.write(storagePath, value);
    written.then(() => this.log(storagePath, `Finished writing "${value}"`), () => {});
    return written;
  }

  private static log(storagePath: ReadonlyArray<string>, message: string) {
    Logger.debug(`[UserDataStorage] Path: "${storagePath.join(',')}" | ${message}`);
  }
}
