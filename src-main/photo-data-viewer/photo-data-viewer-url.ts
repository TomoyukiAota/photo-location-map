import { currentLanguage } from '../../src-shared/i18n/i18n.js';
import { PhotoDataViewerIpcPhotoParams } from '../../src-shared/photo-data-viewer/photo-data-viewer-ipc-params.js';
import { currentUserSettings } from '../../src-shared/user-settings/user-settings.js';
import { getPhotoDataViewerServerUrl } from './photo-data-viewer-server-config.js';

export function createPhotoDataViewerUrl(photo: PhotoDataViewerIpcPhotoParams): string {
  const searchParamsObj = {
    // The page gets its photo from its window's bridge, which it waits for (src-main/photo-data-viewer/photo-delivery.ts):
    // the photo's path is no longer in the address, which goes to the viewer's server.
    plmBridge: '1',
    dateFormat: currentUserSettings.dateFormat,
    clockSystemFormat: currentUserSettings.clockSystemFormat,
    // The viewer shows its texts in this language when it has a translation for it, and in English otherwise.
    language: currentLanguage,
  };
  const serverUrl = getPhotoDataViewerServerUrl();
  const photoDataViewerUrl = new URL(serverUrl);
  photoDataViewerUrl.search = new URLSearchParams(searchParamsObj).toString();
  return photoDataViewerUrl.href;
}
