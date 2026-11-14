import { AmplitudeAnalyticsBrowserIpcMain } from './ipc/amplitude-analytics-browser-ipc.js';
import { MixpanelBrowserIpcMain } from './ipc/mixpanel-browser-ipc.js';
import { AnalyticsBackendWrapper } from './library-wrapper/analytics-backend-wrapper.js';
import { AnalyticsInterface } from './analytics-interface.js';

export class AnalyticsMain implements AnalyticsInterface {
  constructor() {
    AnalyticsBackendWrapper.initialize();
  }

  public trackEvent(category: string, action: string, label?: string, value?: string | number): void {
    AmplitudeAnalyticsBrowserIpcMain.sendEventToRenderer(category, action, label, value);
    MixpanelBrowserIpcMain.sendEventToRenderer(category, action, label, value);
    AnalyticsBackendWrapper.trackEvent(category, action, label, value);
  }
}
