import { ipcMain } from 'electron';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants.js';
import { assertFromMainWindow } from '../ipc/ipc-sender.js';
import { isInUserChosenFolder } from '../ipc/user-chosen-folders.js';
import { readExif } from './read-exif.js';

// The photos of a folder that the user opened (src/app/shared/exif-fetcher/).
ipcMain.handle(IpcConstants.Exif.Read, (event, filePath: unknown) => {
  assertFromMainWindow(event, 'Reading EXIF');
  if (!isInUserChosenFolder(filePath))
    throw new Error('Reading EXIF needs the path of a file in a folder that the user opened.');
  return readExif(filePath);
});
