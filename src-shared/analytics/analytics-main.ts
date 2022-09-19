import { GoogleAnalytics4IpcMain } from './ipc/google-analytics-4-ipc';
import { UniversalAnalyticsIpcMain } from './ipc/universal-analytics-ipc';
import { UniversalAnalyticsWrapper } from './library-wrapper/universal-analytics-wrapper';
import { AnalyticsInterface } from './analytics-interface';

export class AnalyticsMain implements AnalyticsInterface {
  constructor() {
    UniversalAnalyticsWrapper.initialize();
    UniversalAnalyticsIpcMain.configureReceivingIpcFromRenderer();
  }

  public trackEvent(category: string, action: string, label?: string, value?: string | number): void {
    GoogleAnalytics4IpcMain.sendEventToRenderer(category, action, label, value);
    UniversalAnalyticsWrapper.trackEvent(category, action, label, value);
  }
}
