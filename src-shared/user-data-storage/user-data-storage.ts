import { RequireFromMainProcess } from '../require/require-from-main-process';

export class UserDataStorage {
  private static readonly fsExtra = RequireFromMainProcess.fsExtra;
  private static readonly path = RequireFromMainProcess.path;
  private static readonly userDataPath = RequireFromMainProcess.electron.app.getPath('userData');

  // 'PhotoLocationMapStorage' is named like this to be unique without collision in 'userData' directory.
  private static readonly subDirForStorage = 'PhotoLocationMapStorage';
  private static readonly storageRootPath = UserDataStorage.path.join(UserDataStorage.userDataPath, UserDataStorage.subDirForStorage);

  public static read(storagePath: ReadonlyArray<string>): string {
    const {filePath, key} = this.getFilePathAndKey(storagePath);

    if (!this.fsExtra.existsSync(filePath))
      throw new Error(`File for ${key} does not exist in ${filePath}`);

    const fileContent = this.fsExtra.readFileSync(filePath, 'utf8');
    const jsonObject = JSON.parse(fileContent);
    const value = jsonObject[key];
    return value;
  }

  public static write(storagePath: ReadonlyArray<string>, value: string): void {
    const {filePath, key} = this.getFilePathAndKey(storagePath);
    const jsonObject = {};
    jsonObject[key] = value;
    const fileContent = JSON.stringify(jsonObject);
    this.fsExtra.ensureFileSync(filePath);
    this.fsExtra.writeFileSync(filePath, fileContent);
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
}
