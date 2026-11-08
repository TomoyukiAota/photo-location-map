import { ipcMain } from 'electron';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { readExif } from './read-exif';

ipcMain.handle(IpcConstants.Exif.Read, (_event, filePath: unknown) => {
  if (typeof filePath !== 'string' || !filePath)
    throw new Error('Reading EXIF needs the path of a file.');
  return readExif(filePath);
});
