import { BrowserWindow } from 'electron';
import { PhotoDataViewerIpcParams } from '../../src-shared/photo-data-viewer/photo-data-viewer-ipc-params';
import { logWindowBounds, photoDataViewerLogger as logger } from '../../src-shared/photo-data-viewer/photo-data-viewer-logger';
import { trackOpeningPhotoDataViewer } from './photo-data-viewer-tracker';
import { createPhotoDataViewerUrl } from './photo-data-viewer-url';
import { PhotoDataViewerWindowState } from './photo-data-viewer-window-state';

export async function launchPhotoDataViewer(ipcParams: PhotoDataViewerIpcParams) {
  const photo = ipcParams.photo;
  logger.info(`Open Window for ${photo.path}`);

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

  const bounds = browserWindow?.getBounds?.();
  logWindowBounds(bounds, photo);
  trackOpeningPhotoDataViewer(bounds);
  PhotoDataViewerWindowState.manage({browserWindow, photo});
  const photoDataViewerUrl = createPhotoDataViewerUrl(photo);
  await browserWindow.loadURL(photoDataViewerUrl);
  browserWindow.show();
}
