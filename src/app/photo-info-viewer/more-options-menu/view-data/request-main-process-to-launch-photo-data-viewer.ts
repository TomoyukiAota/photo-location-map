import { bridge } from '../../../../../src-shared/bridge/plm-bridge';
import { Logger } from '../../../../../src-shared/log/logger';
import { perfMark } from '../../../../../src-shared/perf/perf-mark';
import { PhotoDataViewerIpcParams } from '../../../../../src-shared/photo-data-viewer/photo-data-viewer-ipc-params';
import { Photo } from '../../../shared/model/photo.model';
import { logged } from '../../../../../src-shared/log/logged-line';

export function requestMainProcessToLaunchPhotoDataViewer(photo: Photo) {
  perfMark('view-data:requested');
  Logger.info(`Sending the IPC invoke request to launch Photo Data Viewer in the main process.`);

  const ipcParams: PhotoDataViewerIpcParams = {
    photo: {
      name: photo.name,
      path: photo.path,
    }
  };
  bridge().photoDataViewer.open(ipcParams)
    .catch(error => Logger.error(logged`Failed to launch Photo Data Viewer for "${photo.path}".`, error));
}
