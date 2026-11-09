import { BrowserWindow } from 'electron';
import { isHeadlessTest, withHeadlessTestOptions } from '../../electron-util/e2e-test-hooks';
import { legacyPhotoDataViewerWebPreferences } from '../../electron-util/electron-web-preferences';
import { PhotoDataViewerIpcParams } from '../../src-shared/photo-data-viewer/photo-data-viewer-ipc-params';
import { logWindowBounds, photoDataViewerLogger as logger } from '../../src-shared/photo-data-viewer/photo-data-viewer-logger';
import { perfMark } from '../../src-shared/perf/perf-mark';
import { openUrl } from '../../src-shared/url/open-url';
import { addPhotoDataViewerWindow } from '../ipc/ipc-sender';
import { trackOpeningPhotoDataViewer } from './photo-data-viewer-tracker';
import { createPhotoDataViewerUrl } from './photo-data-viewer-url';
import { PhotoDataViewerWindowState } from './photo-data-viewer-window-state';

/** Opens Photo Data Viewer's window for the photo of `ipcParams`, where the last one was, and shows it once loaded. */
export async function launchPhotoDataViewer(ipcParams: PhotoDataViewerIpcParams) {
  perfMark('view-data:launch');
  const photo = ipcParams.photo;
  logger.info(`Open Window for ${photo.path}`);

  const windowState = PhotoDataViewerWindowState.get();

  const browserWindow = new BrowserWindow(withHeadlessTestOptions({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    title: `${photo.name} - Photo Location Map`,  // Needs to be the same as document.title in Photo Data Viewer.
    autoHideMenuBar: true,
    webPreferences: legacyPhotoDataViewerWebPreferences,
  }));

  perfMark('view-data:window-created');
  // Its page sends analytics events (src-main/analytics/analytics-backend-ipc.ts).
  addPhotoDataViewerWindow(browserWindow.webContents);
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
  perfMark('view-data:page-loaded');
  // A headless test keeps the window off the screen instead (electron-util/e2e-test-hooks.js).
  if (!isHeadlessTest) browserWindow.show();
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
