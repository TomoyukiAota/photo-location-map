import { Analytics } from '../../src-shared/analytics/analytics';

export function trackOpeningPhotoDataViewer(bounds: Electron.Rectangle) {
  if (!bounds) { return; }

  const {x, y, width, height} = bounds;
  Analytics.trackEvent('Photo Data Viewer', `Window Open`);
  Analytics.trackEvent('Photo Data Viewer', `Window Open - Position X: ${x}`);
  Analytics.trackEvent('Photo Data Viewer', `Window Open - Position Y: ${y}`);
  Analytics.trackEvent('Photo Data Viewer', `Window Open - Width: ${width}`);
  Analytics.trackEvent('Photo Data Viewer', `Window Open - Height: ${height}`);
}

export function trackClosingPhotoDataViewer(bounds: Electron.Rectangle) {
  // Note that browserWindow APIs shouldn't be used in this function
  // because they might not be available due to the behavior that
  // browserWindow will be destructed sometime after closing the window.

  if (!bounds) { return; }

  const {x, y, width, height} = bounds;
  Analytics.trackEvent('Photo Data Viewer', `Window Close`);
  Analytics.trackEvent('Photo Data Viewer', `Window Close - Position X: ${x}`);
  Analytics.trackEvent('Photo Data Viewer', `Window Close - Position Y: ${y}`);
  Analytics.trackEvent('Photo Data Viewer', `Window Close - Width: ${width}`);
  Analytics.trackEvent('Photo Data Viewer', `Window Close - Height: ${height}`);
}
