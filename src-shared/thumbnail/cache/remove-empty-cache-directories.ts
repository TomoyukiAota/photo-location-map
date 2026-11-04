import * as fs from 'fs';
import * as path from 'path';

// Preserve delete-empty's default treatment of macOS/Windows metadata files.
const ignoredEntry = /(?:Thumbs\.db|\.DS_Store)$/i;

export function removeEmptyCacheDirectories(directory: string): void {
  if (!fs.existsSync(directory))
    return;

  // Cache cleanup must not traverse links into directories outside the cache.
  if (!fs.lstatSync(directory).isDirectory())
    return;

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && !ignoredEntry.test(entry.name))
      removeEmptyCacheDirectories(path.join(directory, entry.name));
  }

  if (fs.readdirSync(directory).every(entry => ignoredEntry.test(entry)))
    fs.rmSync(directory, { recursive: true, force: true });
}
