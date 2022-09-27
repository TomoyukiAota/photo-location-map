import { AmplitudeAnalyticsBrowserIpcMain } from './ipc/amplitude-analytics-browser-ipc';
import { GoogleAnalytics4IpcMain } from './ipc/google-analytics-4-ipc';
import { MixpanelBrowserIpcMain } from './ipc/mixpanel-browser-ipc';
import { UniversalAnalyticsIpcMain } from './ipc/universal-analytics-ipc';
import { UniversalAnalyticsWrapper } from './library-wrapper/universal-analytics-wrapper';
import { AnalyticsInterface } from './analytics-interface';

export class AnalyticsMain implements AnalyticsInterface {
  constructor() {
    UniversalAnalyticsWrapper.initialize();
    UniversalAnalyticsIpcMain.configureReceivingIpcFromRenderer();
  }

  public trackEvent(category: string, action: string, label?: string, value?: string | number): void {
    UniversalAnalyticsWrapper.trackEvent(category, action, label, value);
    AmplitudeAnalyticsBrowserIpcMain.sendEventToRenderer(category, action, label, value);
    MixpanelBrowserIpcMain.sendEventToRenderer(category, action, label, value);
    GoogleAnalytics4IpcMain.sendEventToRenderer(category, action, label, value);
  }
}
