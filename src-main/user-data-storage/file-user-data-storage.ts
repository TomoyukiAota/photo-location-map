import * as fs from 'fs';
import * as path from 'path';
import type { UserDataStorageBackend } from '../../src-shared/user-data-storage/user-data-storage.js';

/**
 * The settings' files, in the main process, which owns them: one JSON file per setting, under
 * `<userData>/PhotoLocationMapStorage`, as before.
 */
export class FileUserDataStorage implements UserDataStorageBackend {
  // 'PhotoLocationMapStorage' is named like this to be unique without collision in 'userData' directory.
  private static readonly subDirForStorage = 'PhotoLocationMapStorage';

  constructor(private readonly app: Pick<Electron.App, 'getPath'>) {
  }

  private get storageRootPath(): string {
    return path.join(this.app.getPath('userData'), FileUserDataStorage.subDirForStorage);
  }

  /** The value at `storagePath`, from its JSON file; throws when the file is not there. */
  public read(storagePath: ReadonlyArray<string>): string {
    const { filePath, key } = this.getFilePathAndKey(storagePath);

    if (!fs.existsSync(filePath))
      throw new Error(`File for ${key} does not exist in ${filePath}`);

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const jsonObject = JSON.parse(fileContent);
    return jsonObject[key];
  }

  /** Writes at once; throws, rather than rejects, when the file cannot be written, as it did before. */
  public write(storagePath: ReadonlyArray<string>, value: string): Promise<void> {
    const { filePath, key } = this.getFilePathAndKey(storagePath);
    const jsonObject = {};
    jsonObject[key] = value;
    const fileContent = JSON.stringify(jsonObject);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, fileContent);
    return Promise.resolve();
  }

  /** The file of `storagePath` and the key in it: its last segment names both, in the folders that the others name. */
  private getFilePathAndKey(storagePath: ReadonlyArray<string>): { filePath: string; key: string } {
    if (!storagePath || !storagePath.length) {
      throw new Error('storagePath needs to be a string array which contains at least 1 element.');
    }

    const copiedStoragePath = Array.from(storagePath);
    const lastElement = copiedStoragePath.pop();
    const filePath = path.join(this.storageRootPath, ...copiedStoragePath, `${lastElement}.json`);
    return { filePath: filePath, key: lastElement };
  }
}
