// Component construction must not read or modify the owner's persisted settings.
import * as path from 'node:path';
import { temporaryRoot } from './electron-double';

const values = new Map<string, string>();
export class UserDataStorage {
  public static read(storagePath: ReadonlyArray<string>): string {
    const value = values.get(JSON.stringify(storagePath));
    if (value === undefined) throw new Error('No value in test storage');
    return value;
  }

  public static readOrDefault(storagePath: ReadonlyArray<string>, defaultValue: string): string {
    return values.get(JSON.stringify(storagePath)) ?? defaultValue;
  }

  public static write(storagePath: ReadonlyArray<string>, value: string): void {
    values.set(JSON.stringify(storagePath), value);
  }

  public static getFilePath(storagePath: ReadonlyArray<string>): string {
    return path.join(temporaryRoot, 'storage', ...storagePath);
  }

  public static reset(): void {
    values.clear();
  }
}
