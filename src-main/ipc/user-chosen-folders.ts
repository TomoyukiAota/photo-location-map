import * as path from 'path';

// The folders that the user chose in this launch, in the folder picker or with --open. The main window's page may read
// the tree of such a folder, and open the files and folders in it with the OS, but not those of any other folder.
// A relative path, which --open can give, is relative to the main process's working directory, as for the tree.

// Each folder by its comparable path, with its path as resolved.
const chosenFolders = new Map<string, string>();

/** A path resolved, and compared as the file systems of macOS and Windows do by default: without regard to case. */
function comparable(filePath: string): string {
  const resolved = path.resolve(filePath);
  return process.platform === 'darwin' || process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

/** Whether `value` can be a path: a string that is not empty. */
function isPath(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/** Remembers that the user chose the folder at `folderPath`, whose tree the main window's page may then read. */
export function rememberUserChosenFolder(folderPath: string): void {
  if (isPath(folderPath))
    chosenFolders.set(comparable(folderPath), path.resolve(folderPath));
}

/** The folders that the user chose, as resolved. */
export function userChosenFolderPaths(): string[] {
  return [...chosenFolders.values()];
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
  for (const folder of chosenFolders.keys()) {
    if (isComparableInFolder(target, folder))
      return true;
  }
  return false;
}

function isComparableInFolder(target: string, folder: string): boolean {
  const prefix = folder.endsWith(path.sep) ? folder : folder + path.sep;
  return target === folder || target.startsWith(prefix);
}

/** Forgets every folder, for tests. */
export function forgetUserChosenFolders(): void {
  chosenFolders.clear();
}
