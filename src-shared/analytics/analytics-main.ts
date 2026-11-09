import { AmplitudeAnalyticsBrowserIpcMain } from './ipc/amplitude-analytics-browser-ipc';
import { MixpanelBrowserIpcMain } from './ipc/mixpanel-browser-ipc';
import { AnalyticsBackendWrapper } from './library-wrapper/analytics-backend-wrapper';
import { AnalyticsInterface } from './analytics-interface';

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
