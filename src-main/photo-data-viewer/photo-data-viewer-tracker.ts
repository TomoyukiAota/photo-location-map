import { Analytics } from '../../src-shared/analytics/analytics';

export function trackOpeningPhotoDataViewer(bounds: Electron.Rectangle) {
  if (!bounds) { return; }

  const {x, y, width, height} = bounds;
  Analytics.trackEvent('Photo Data Viewer', `[PDV] Window Opened`);
  Analytics.trackEvent('Photo Data Viewer', `[PDV] Window Opened Position X`, `Position X: ${x}`);
  Analytics.trackEvent('Photo Data Viewer', `[PDV] Window Opened Position Y`, `Position Y: ${y}`);
  Analytics.trackEvent('Photo Data Viewer', `[PDV] Window Opened Width`, `Width: ${width}`);
  Analytics.trackEvent('Photo Data Viewer', `[PDV] Window Opened Height`, `Height: ${height}`);
}

export function trackClosingPhotoDataViewer(bounds: Electron.Rectangle) {
  // Note that browserWindow APIs shouldn't be used in this function
  // because they might not be available due to the behavior that
  // browserWindow will be destructed sometime after closing the window.

  if (!bounds) { return; }

  const {x, y, width, height} = bounds;
  Analytics.trackEvent('Photo Data Viewer', `[PDV] Window Closed`);
  Analytics.trackEvent('Photo Data Viewer', `[PDV] Window Closed Position X`, `Position X: ${x}`);
  Analytics.trackEvent('Photo Data Viewer', `[PDV] Window Closed Position Y`, `Position Y: ${y}`);
  Analytics.trackEvent('Photo Data Viewer', `[PDV] Window Closed Width`, `Width: ${width}`);
  Analytics.trackEvent('Photo Data Viewer', `[PDV] Window Closed Height`, `Height: ${height}`);
}
