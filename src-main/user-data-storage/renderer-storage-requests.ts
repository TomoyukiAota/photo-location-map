import { AnalyticsConfig } from '../../src-shared/analytics/config/analytics-config.js';
import { Logger } from '../../src-shared/log/logger.js';
import { isOneOf, rendererReadableStoragePaths, rendererWritableStoragePaths, storageKeyOf } from '../../src-shared/user-data-storage/renderer-storage-access.js';
import { UserDataStorage, UserDataStorageBackend } from '../../src-shared/user-data-storage/user-data-storage.js';

/**
 * The settings that a renderer reads, from the files, for its copy (src-shared/user-data-storage/). The analytics user
 * ID is made first if this is the app's first launch, so that the renderer never makes one of its own.
 */
export function rendererStorageSnapshot(files: UserDataStorageBackend): Record<string, string> {
  try {
    void AnalyticsConfig.userId;
  } catch (error) {
    Logger.warn('[UserDataStorage] Could not make the analytics user ID for the renderer.', error);
  }
  const entries: Record<string, string> = {};
  for (const storagePath of rendererReadableStoragePaths) {
    try {
      const value = files.read(storagePath);
      if (typeof value === 'string') entries[storageKeyOf(storagePath)] = value;
    } catch {
      // Not saved yet: the renderer uses its default.
    }
  }
  return entries;
}

/** Writes a setting that a renderer saved. Refuses anything but a string for one of the renderer's own settings. */
export function writeFromRenderer(storagePath: unknown, value: unknown): Promise<void> {
  if (!isOneOf(storagePath, rendererWritableStoragePaths) || typeof value !== 'string')
    throw new Error(`A renderer cannot write ${JSON.stringify(value)} for ${JSON.stringify(storagePath)}.`);
  return UserDataStorage.write(storagePath, value);
}
