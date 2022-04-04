import { PhotoDataViewerIpcPhotoParams } from '../../src-shared/photo-data-viewer/photo-data-viewer-ipc-params';
import { currentUserSettings } from '../../src-shared/user-settings/user-settings';
import { getPhotoDataViewerServerUrl } from './photo-data-viewer-server-config';

export function createPhotoDataViewerUrl(photo: PhotoDataViewerIpcPhotoParams): string {
  const searchParamsObj = {
    photoPath: photo.path,
    dateFormat: currentUserSettings.dateFormat,
    clockSystemFormat: currentUserSettings.clockSystemFormat,
  };
  const serverUrl = getPhotoDataViewerServerUrl();
  const photoDataViewerUrl = new URL(serverUrl);
  photoDataViewerUrl.search = new URLSearchParams(searchParamsObj).toString();
  return photoDataViewerUrl.href;
}
