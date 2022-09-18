import { AnalyticsInterface } from './analytics-interface';
import { GoogleAnalytics4IpcMain } from './ipc/google-analytics-4-ipc';
import { UniversalAnalyticsWrapper } from './universal-analytics-wrapper';

export class AnalyticsMain implements AnalyticsInterface {
  constructor() {
    UniversalAnalyticsWrapper.initialize();
  }

  public trackEvent(category: string, action: string, label?: string, value?: string | number): void {
    GoogleAnalytics4IpcMain.sendEventToRenderer(category, action, label, value);
    UniversalAnalyticsWrapper.trackEvent(category, action, label, value);
  }
}
