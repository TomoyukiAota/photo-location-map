import * as path from 'path';

// The folders that the user chose in this launch, in the folder picker or with --open. The main window's page may read
// the tree of such a folder, and open the files and folders in it with the OS, but not those of any other folder.
// A relative path, which --open can give, is relative to the main process's working directory, as for the tree.

const chosenFolders = new Set<string>();

/** A path resolved, and compared as the file systems of macOS and Windows do by default: without regard to case. */
function comparable(filePath: string): string {
  const resolved = path.resolve(filePath);
  return process.platform === 'darwin' || process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

function isPath(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

export function rememberUserChosenFolder(folderPath: string): void {
  if (isPath(folderPath))
    chosenFolders.add(comparable(folderPath));
}

/** Whether the user chose the folder at `folderPath`. */
export function isUserChosenFolder(folderPath: unknown): folderPath is string {
  return isPath(folderPath) && chosenFolders.has(comparable(folderPath));
}

/** Whether `filePath` is a folder that the user chose, or is in one. */
export function isInUserChosenFolder(filePath: unknown): filePath is string {
  if (!isPath(filePath))
    return false;
  const target = comparable(filePath);
  for (const folder of chosenFolders) {
    const prefix = folder.endsWith(path.sep) ? folder : folder + path.sep;
    if (target === folder || target.startsWith(prefix))
      return true;
  }
  return false;
}

/** Forgets every folder, for tests. */
export function forgetUserChosenFolders(): void {
  chosenFolders.clear();
}
