import { GoogleAnalytics4IpcRenderer } from './ipc/google-analytics-4-ipc';
import { UniversalAnalyticsIpcRenderer } from './ipc/universal-analytics-ipc';
import { AnalyticsInterface } from './analytics-interface';
import { GtagWrapper } from './gtag-wrapper';

export class AnalyticsRenderer implements AnalyticsInterface {
  constructor() {
    GtagWrapper.initialize();
    GoogleAnalytics4IpcRenderer.configureReceivingIpcFromMain();
  }

  trackEvent(category: string, action: string, label?: string, value?: string | number): void {
    GtagWrapper.trackEvent(category, action, label, value);
    UniversalAnalyticsIpcRenderer.sendEventToMain(category, action, label, value);
  }
}
