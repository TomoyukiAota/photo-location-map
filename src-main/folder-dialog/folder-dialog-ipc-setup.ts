import { ipcMain } from 'electron';
import * as fs from 'fs';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants.js';
import { UserDataStorage } from '../../src-shared/user-data-storage/user-data-storage.js';
import { UserDataStoragePath } from '../../src-shared/user-data-storage/user-data-stroage-path.js';
import { assertFromMainWindow } from '../ipc/ipc-sender.js';
import { isUserChosenFolder, rememberUserChosenFolder } from '../ipc/user-chosen-folders.js';
import { showFolderDialog } from './show-folder-dialog.js';

// The folder picker for Open Folder (src/app/sidebar/upper-pane/sidebar-upper-pane.component.ts). The folder that the
// user chooses is one the page may then read (src-main/directory-tree/).
ipcMain.handle(IpcConstants.FolderDialog.Show, async (event, request) => {
  assertFromMainWindow(event, 'The folder picker');
  const result = await showFolderDialog(event.sender, request);
  if (!result.canceled) result.filePaths.forEach(rememberUserChosenFolder);
  return result;
});

/**
 * Whether the folder where the picker would start is still a folder: the one last chosen, in this launch or saved. Any
 * other path is answered false, so that the page cannot find out about other paths.
 */
ipcMain.handle(IpcConstants.FolderDialog.IsDirectory, async (event, directoryPath: unknown) => {
  assertFromMainWindow(event, 'The folder picker');
  const lastConfirmed = UserDataStorage.readOrDefault(UserDataStoragePath.FolderDialog.LastConfirmedDirectory, null);
  if (!isUserChosenFolder(directoryPath) && !(typeof directoryPath === 'string' && directoryPath === lastConfirmed))
    return false;
  return (await fs.promises.stat(directoryPath)).isDirectory();
});
