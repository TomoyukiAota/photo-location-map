import { BrowserWindow } from '@electron/remote';
import { Photo } from '../../../shared/model/photo.model';
import { trackOpeningPhotoDataViewer } from './photo-data-viewer-tracker';
import { getPhotoDataViewerUrl } from './photo-data-viewer-url';
import { PhotoDataViewerWindowState } from './photo-data-viewer-window-state';

export async function launchPhotoDataViewer(photo: Photo) {
  const windowState = PhotoDataViewerWindowState.get();

  const browserWindow = new BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    title: `${photo.name} - Photo Location Map`,  // Needs to be the same as document.title in Photo Data Viewer.
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  trackOpeningPhotoDataViewer(browserWindow);
  PhotoDataViewerWindowState.manage(browserWindow);
  const photoDataViewerUrl = getPhotoDataViewerUrl(photo);
  await browserWindow.loadURL(photoDataViewerUrl);
  browserWindow.show();
}
