import { ipcMain } from 'electron';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { Logger } from '../../src-shared/log/logger';
import { PhotoDataViewerIpcParams } from '../../src-shared/photo-data-viewer/photo-data-viewer-ipc-params';
import { launchPhotoDataViewer } from './launch-photo-data-viewer';

ipcMain.handle(IpcConstants.PhotoDataViewer.Name, (event, ipcParams: PhotoDataViewerIpcParams) => {
  Logger.debug(`[IPC Main Received] ${IpcConstants.PhotoDataViewer.Name}`);
  // noinspection JSIgnoredPromiseFromCall
  launchPhotoDataViewer(ipcParams);
});
