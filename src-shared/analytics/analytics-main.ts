import { AmplitudeAnalyticsBrowserIpcMain } from './ipc/amplitude-analytics-browser-ipc';
import { AnalyticsBackendIpcMain } from './ipc/analytics-backend-ipc';
import { MixpanelBrowserIpcMain } from './ipc/mixpanel-browser-ipc';
import { UniversalAnalyticsIpcMain } from './ipc/universal-analytics-ipc';
import { AnalyticsBackendWrapper } from './library-wrapper/analytics-backend-wrapper';
import { UniversalAnalyticsWrapper } from './library-wrapper/universal-analytics-wrapper';
import { AnalyticsInterface } from './analytics-interface';

export class AnalyticsMain implements AnalyticsInterface {
  constructor() {
    UniversalAnalyticsWrapper.initialize();
    UniversalAnalyticsIpcMain.configureReceivingIpcFromRenderer();
    AnalyticsBackendWrapper.initialize();
    AnalyticsBackendIpcMain.configureReceivingIpcFromRenderer();
  }

  public trackEvent(category: string, action: string, label?: string, value?: string | number): void {
    UniversalAnalyticsWrapper.trackEvent(category, action, label, value);
    AmplitudeAnalyticsBrowserIpcMain.sendEventToRenderer(category, action, label, value);
    MixpanelBrowserIpcMain.sendEventToRenderer(category, action, label, value);
    AnalyticsBackendWrapper.trackEvent(category, action, label, value);
  }
}
