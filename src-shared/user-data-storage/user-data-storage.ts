import * as fsExtra from 'fs-extra';
import * as path from 'path';
import { Logger } from '../log/logger';
import { startupMetadata } from '../startup/startup-metadata';

// Each process reads and writes the files itself: the main process, and the renderer, which has Node.js.
export class UserDataStorage {
  private static readonly fsExtra = fsExtra;
  private static readonly path = path;

  // 'PhotoLocationMapStorage' is named like this to be unique without collision in 'userData' directory.
  private static readonly subDirForStorage = 'PhotoLocationMapStorage';
  private static get storageRootPath(): string {
    return UserDataStorage.path.join(startupMetadata().userDataPath, UserDataStorage.subDirForStorage);
  }

  public static read(storagePath: ReadonlyArray<string>): string {
    this.log(storagePath, 'Attempt to read');
    const {filePath, key} = this.getFilePathAndKey(storagePath);

    if (!this.fsExtra.existsSync(filePath))
      throw new Error(`File for ${key} does not exist in ${filePath}`);

    const fileContent = this.fsExtra.readFileSync(filePath, 'utf8');
    const jsonObject = JSON.parse(fileContent);
    const value = jsonObject[key];
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

  public static write(storagePath: ReadonlyArray<string>, value: string): void {
    this.log(storagePath, `Attempt to write "${value}"`);
    const {filePath, key} = this.getFilePathAndKey(storagePath);
    const jsonObject = {};
    jsonObject[key] = value;
    const fileContent = JSON.stringify(jsonObject);
    this.fsExtra.ensureFileSync(filePath);
    this.fsExtra.writeFileSync(filePath, fileContent);
    this.log(storagePath, `Finished writing "${value}"`);
  }

  public static getFilePath(storagePath: ReadonlyArray<string>): string {
    const {filePath} = this.getFilePathAndKey(storagePath);
    return filePath;
  }

  private static getFilePathAndKey(storagePath: ReadonlyArray<string>): { filePath: string; key: string } {
    if (!storagePath || !storagePath.length) {
      throw new Error('storagePath needs to be a string array which contains at least 1 element.');
    }

    const copiedStoragePath = Array.from(storagePath);
    const lastElement = copiedStoragePath.pop();
    const filePath = this.path.join(this.storageRootPath, ...copiedStoragePath, `${lastElement}.json`);
    return {filePath: filePath, key: lastElement};
  }

  private static log(storagePath: ReadonlyArray<string>, message: string) {
    Logger.debug(`[UserDataStorage] Path: "${storagePath.join(',')}" | ${message}`);
  }
}
