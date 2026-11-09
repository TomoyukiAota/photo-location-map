import { ipcMain } from 'electron';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { assertFromMainWindow } from '../ipc/ipc-sender';
import { isUserChosenFolder } from '../ipc/user-chosen-folders';
import { createDirectoryTreeInWorker } from './directory-tree-requests';

// The tree of a folder that the user chose to open, in the folder picker or with --open (src/app/shared/opened-directory.ts).
ipcMain.handle(IpcConstants.DirectoryTree.Create, (event, dirPath: unknown) => {
  assertFromMainWindow(event, 'Reading a folder');
  if (!isUserChosenFolder(dirPath))
    throw new Error('Only a folder that the user chose can be read.');
  return createDirectoryTreeInWorker(dirPath);
});
