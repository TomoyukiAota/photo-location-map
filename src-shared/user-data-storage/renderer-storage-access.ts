import { UserDataStoragePath } from './user-data-stroage-path.js';

/**
 * The settings that a renderer writes. The main process refuses to write any other for it: the launch history, the
 * viewer's window state and the analytics user ID are its own, and a renderer's copy of them could be out of date.
 */
export const rendererWritableStoragePaths: ReadonlyArray<ReadonlyArray<string>> = [
  UserDataStoragePath.FolderDialog.LastConfirmedDirectory,
  UserDataStoragePath.LeafletMap.SelectedBaseLayer,
  UserDataStoragePath.DirectoryTreeView.SortKey,
  UserDataStoragePath.DirectoryTreeView.SortDirection,
  UserDataStoragePath.History.ClickedOkOnWelcomeDialog,
  UserDataStoragePath.History.ClickedOkOnLanguageDialog,
  UserDataStoragePath.UserSettings.ShowStatusBar,
  UserDataStoragePath.UserSettings.DateFormat,
  UserDataStoragePath.UserSettings.ClockSystemFormat,
  UserDataStoragePath.UserSettings.Language,
];

/** What a renderer reads: what it writes, and the analytics user ID, which the main process makes. */
export const rendererReadableStoragePaths: ReadonlyArray<ReadonlyArray<string>> = [
  ...rendererWritableStoragePaths,
  UserDataStoragePath.Analytics.UserId,
];

/** The key of a storage path in the renderer's copy and in IPC. */
export function storageKeyOf(storagePath: ReadonlyArray<string>): string {
  return storagePath.join('/');
}

/**
 * Whether `storagePath` is one of `allowed`, segment by segment: `['LeafletMap/SelectedBaseLayer']` is not
 * `['LeafletMap', 'SelectedBaseLayer']`, though their keys are the same. Anything else from IPC is not either.
 */
export function isOneOf(storagePath: unknown, allowed: ReadonlyArray<ReadonlyArray<string>>): storagePath is ReadonlyArray<string> {
  return Array.isArray(storagePath) && storagePath.every(part => typeof part === 'string')
    && allowed.some(path => path.length === storagePath.length && path.every((part, index) => part === storagePath[index]));
}
