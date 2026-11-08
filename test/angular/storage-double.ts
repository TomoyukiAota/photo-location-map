// Component construction must not read or modify the owner's persisted settings.
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

  public static write(storagePath: ReadonlyArray<string>, value: string): Promise<void> {
    values.set(JSON.stringify(storagePath), value);
    return Promise.resolve();
  }

  public static reset(): void {
    values.clear();
  }
}
