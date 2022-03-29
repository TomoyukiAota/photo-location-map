import { Analytics } from '../../../../../src-shared/analytics/analytics';

export function trackOpeningPhotoDataViewer(browserWindow: Electron.BrowserWindow) {
  const {x, y, width, height} = browserWindow.getBounds();
  Analytics.trackEvent('Photo Data Viewer', `Window Open`);
  Analytics.trackEvent('Photo Data Viewer', `Window Open - Position X: ${x}`);
  Analytics.trackEvent('Photo Data Viewer', `Window Open - Position Y: ${y}`);
  Analytics.trackEvent('Photo Data Viewer', `Window Open - Width: ${width}`);
  Analytics.trackEvent('Photo Data Viewer', `Window Open - Height: ${height}`);
}

export function trackClosingPhotoDataViewer(browserWindow: Electron.BrowserWindow) {
  const {x, y, width, height} = browserWindow.getBounds();
  Analytics.trackEvent('Photo Data Viewer', `Window Close`);
  Analytics.trackEvent('Photo Data Viewer', `Window Close - Position X: ${x}`);
  Analytics.trackEvent('Photo Data Viewer', `Window Close - Position Y: ${y}`);
  Analytics.trackEvent('Photo Data Viewer', `Window Close - Width: ${width}`);
  Analytics.trackEvent('Photo Data Viewer', `Window Close - Height: ${height}`);
}
