import { ipcRenderer } from 'electron';
import { IpcConstants } from '../../../../../src-shared/ipc/ipc-constants';
import { Logger } from '../../../../../src-shared/log/logger';
import { PhotoDataViewerIpcParams } from '../../../../../src-shared/photo-data-viewer/photo-data-viewer-ipc-params';
import { Photo } from '../../../shared/model/photo.model';

export function requestMainProcessToLaunchPhotoDataViewer(photo: Photo) {
  Logger.info(`Sending the IPC invoke request to launch Photo Data Viewer in the main process.`);

  const ipcParams: PhotoDataViewerIpcParams = {
    photo: {
      name: photo.name,
      path: photo.path,
    }
  };
  // noinspection JSIgnoredPromiseFromCall
  ipcRenderer.invoke(IpcConstants.PhotoDataViewer.Name, ipcParams);
}
