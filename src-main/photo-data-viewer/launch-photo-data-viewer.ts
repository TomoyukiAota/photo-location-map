import { BrowserWindow } from 'electron';
import { PhotoDataViewerIpcParams } from '../../src-shared/photo-data-viewer/photo-data-viewer-ipc-params';
import { logWindowBounds, photoDataViewerLogger as logger } from '../../src-shared/photo-data-viewer/photo-data-viewer-logger';
import { openUrl } from '../../src-shared/url/open-url';
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

  browserWindow.webContents.setWindowOpenHandler(({url}) => {
    const urlForAnalytics = modifyUrlForAnalyticsIfNeeded(url);
    openUrl(url, 'somewhere', 'Photo Data Viewer', urlForAnalytics);
    return { action: 'deny' };
  })

  const bounds = browserWindow?.getBounds?.();
  logWindowBounds(bounds, photo);
  trackOpeningPhotoDataViewer(bounds);
  PhotoDataViewerWindowState.manage({browserWindow, photo});
  const photoDataViewerUrl = createPhotoDataViewerUrl(photo);
  await browserWindow.loadURL(photoDataViewerUrl);
  browserWindow.show();
}

function modifyUrlForAnalyticsIfNeeded(originalUrl: string): string {
  const googleMapsUrlPattern1 = 'https://maps.google.com/';
  const googleMapsUrlPattern2 = 'https://www.google.com/maps/';

  let urlForAnalytics = originalUrl;
  if (originalUrl.includes(googleMapsUrlPattern1)) {
    urlForAnalytics = `URL including ${googleMapsUrlPattern1}`; // Not to send query parameters containing latitude and longitude
  } else if (originalUrl.includes(googleMapsUrlPattern2)) {
    urlForAnalytics = `URL including ${googleMapsUrlPattern2}`; // Not to send query parameters containing latitude and longitude
  }

  return urlForAnalytics;
}
