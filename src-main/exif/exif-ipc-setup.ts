import { ipcMain } from 'electron';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { assertFromMainWindow } from '../ipc/ipc-sender';
import { isInUserChosenFolder } from '../ipc/user-chosen-folders';
import { readExif } from './read-exif';

// The photos of a folder that the user opened (src/app/shared/exif-fetcher/).
ipcMain.handle(IpcConstants.Exif.Read, (event, filePath: unknown) => {
  assertFromMainWindow(event, 'Reading EXIF');
  if (!isInUserChosenFolder(filePath))
    throw new Error('Reading EXIF needs the path of a file in a folder that the user opened.');
  return readExif(filePath);
});
