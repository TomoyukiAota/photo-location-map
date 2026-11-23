import * as fs from 'fs';
import * as path from 'path';

// Preserve delete-empty's default treatment of macOS/Windows metadata files.
const ignoredEntry = /(?:Thumbs\.db|\.DS_Store)$/i;

/**
 * Removes the folders in `directory` that hold nothing but the files of a file manager, and `directory` itself when
 * it is then one of them. Asynchronous, as the invalid cache's removal that calls it (remove-invalid-thumbnail-cache.ts).
 */
export async function removeEmptyCacheDirectories(directory: string): Promise<void> {
  // Cache cleanup must not traverse links into directories outside the cache.
  const isDirectory = await fs.promises.lstat(directory).then(stats => stats.isDirectory(), () => false);
  if (!isDirectory)
    return;

  for (const entry of await fs.promises.readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && !ignoredEntry.test(entry.name))
      await removeEmptyCacheDirectories(path.join(directory, entry.name));
  }

  if ((await fs.promises.readdir(directory)).every(entry => ignoredEntry.test(entry)))
    await fs.promises.rm(directory, { recursive: true, force: true });
}
