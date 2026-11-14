import { ipcMain } from 'electron';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants.js';
import { Logger } from '../../src-shared/log/logger.js';
import { PhotoDataViewerIpcParams } from '../../src-shared/photo-data-viewer/photo-data-viewer-ipc-params.js';
import { assertFromMainWindow } from '../ipc/ipc-sender.js';
import { isInUserChosenFolder } from '../ipc/user-chosen-folders.js';
import { launchPhotoDataViewer } from './launch-photo-data-viewer.js';

/** Whether `value` gives a photo's name and path, which opening Photo Data Viewer needs. */
function isPhotoDataViewerIpcParams(value: unknown): value is PhotoDataViewerIpcParams {
  const photo = (value as PhotoDataViewerIpcParams | undefined)?.photo;
  return typeof photo?.name === 'string' && typeof photo?.path === 'string' && !!photo.path;
}

ipcMain.handle(IpcConstants.PhotoDataViewer.Name, (event, ipcParams: unknown) => {
  Logger.debug(`[IPC Main Received] ${IpcConstants.PhotoDataViewer.Name}`);
  assertFromMainWindow(event, 'Opening Photo Data Viewer');
  if (!isPhotoDataViewerIpcParams(ipcParams))
    throw new Error('Opening Photo Data Viewer needs the name and the path of a photo.');
  // The viewer may read only this photo (photo-delivery.ts), one of a folder that the user opened.
  if (!isInUserChosenFolder(ipcParams.photo.path))
    throw new Error('Photo Data Viewer can only open a photo in a folder that the user opened.');
  // noinspection JSIgnoredPromiseFromCall
  launchPhotoDataViewer({ photo: { name: ipcParams.photo.name, path: ipcParams.photo.path } });
});
