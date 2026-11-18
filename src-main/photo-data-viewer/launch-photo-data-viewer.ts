import { app, BrowserWindow } from 'electron';
import { isHeadlessTest, withHeadlessTestOptions } from '../../electron-util/e2e-test-hooks.js';
import { photoDataViewerWebPreferences } from '../../electron-util/electron-web-preferences.js';
import { PhotoDataViewerIpcParams } from '../../src-shared/photo-data-viewer/photo-data-viewer-ipc-params.js';
import { logWindowBounds, photoDataViewerLogger as logger } from '../../src-shared/photo-data-viewer/photo-data-viewer-logger.js';
import { perfMark } from '../../src-shared/perf/perf-mark.js';
import { openUrl } from '../../src-shared/url/open-url.js';
import { addPhotoDataViewerWindow } from '../ipc/ipc-sender.js';
import { recordWindowFailures } from '../record-window-failures.js';
import { isWebPageUrl } from '../shell/open-with-os.js';
import { loadViewerPage } from './load-viewer-page.js';
import { grantPhoto, keepOnViewerPages } from './photo-delivery.js';
import { trackOpeningPhotoDataViewer } from './photo-data-viewer-tracker.js';
import { createPhotoDataViewerUrl } from './photo-data-viewer-url.js';
import { PhotoDataViewerWindowState } from './photo-data-viewer-window-state.js';

/**
 * Opens Photo Data Viewer's window for the photo of `ipcParams`, where the last one was, or else on the display of
 * `mainWindowBounds`, the main window's (photo-data-viewer-window-state.ts), and shows it once loaded.
 */
export async function launchPhotoDataViewer(ipcParams: PhotoDataViewerIpcParams, mainWindowBounds?: Electron.Rectangle) {
  perfMark('view-data:launch');
  const photo = ipcParams.photo;
  logger.info(`Open Window for ${photo.path}`);

  const windowState = PhotoDataViewerWindowState.get(mainWindowBounds);

  const browserWindow = new BrowserWindow(withHeadlessTestOptions({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    title: `${photo.name} - Photo Location Map`,  // Needs to be the same as document.title in Photo Data Viewer.
    autoHideMenuBar: true,
    webPreferences: photoDataViewerWebPreferences(app.getAppPath()),
  }));

  perfMark('view-data:window-created');
  // Its page asks for its photo, and sends analytics events (src-main/analytics/analytics-backend-ipc.ts).
  addPhotoDataViewerWindow(browserWindow.webContents);
  keepOnViewerPages(browserWindow.webContents);
  // A preload that throws leaves the page without its bridge, which would show only as a page that did not ask.
  recordWindowFailures(browserWindow, 'Photo Data Viewer');
  grantPhoto(browserWindow.webContents, photo);
  browserWindow.webContents.setWindowOpenHandler(({url}) => {
    // A web page only, as for the main window's links (src-main/shell/): the viewer's page is served apart from the app.
    if (!isWebPageUrl(url)) {
      logger.warn(`Refused to open a link of Photo Data Viewer that is not a web page.`);
      return { action: 'deny' };
    }
    const urlForAnalytics = modifyUrlForAnalyticsIfNeeded(url);
    openUrl(url, 'somewhere', 'Photo Data Viewer', urlForAnalytics);
    return { action: 'deny' };
  })

  const bounds = browserWindow?.getBounds?.();
  logWindowBounds(bounds, photo);
  trackOpeningPhotoDataViewer(bounds);
  PhotoDataViewerWindowState.manage({browserWindow, photo});
  const photoDataViewerUrl = createPhotoDataViewerUrl(photo);
  // A headless test keeps the window off the screen instead (electron-util/e2e-test-hooks.js).
  await loadViewerPage(browserWindow, photoDataViewerUrl, !isHeadlessTest);
}

/**
 * The address of a link of the viewer as the analytics get it. A link to Google Maps, Street View or Google Earth has
 * the photo's latitude and longitude in its query or its path, so the analytics get the site's address alone.
 *
 * The viewer shows its Google Earth button only where its address says that such a link is recorded so (`googleEarth`
 * in photo-data-viewer-url.ts): it is served to every version of this app, and an earlier one recorded a link to
 * Google Earth whole.
 */
export function modifyUrlForAnalyticsIfNeeded(originalUrl: string): string {
  const urlPatternsWithPlace = ['https://maps.google.com/', 'https://www.google.com/maps/', 'https://earth.google.com/'];
  const pattern = urlPatternsWithPlace.find(urlPattern => originalUrl.includes(urlPattern));
  return pattern ? `URL including ${pattern}` : originalUrl;
}
