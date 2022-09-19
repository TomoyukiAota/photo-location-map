import { GoogleAnalytics4IpcRenderer } from './ipc/google-analytics-4-ipc';
import { UniversalAnalyticsIpcRenderer } from './ipc/universal-analytics-ipc';
import { GtagWrapper } from './library-wrapper/gtag-wrapper';
import { AnalyticsInterface } from './analytics-interface';

export class AnalyticsRenderer implements AnalyticsInterface {
  constructor() {
    GtagWrapper.initialize();
    GoogleAnalytics4IpcRenderer.configureReceivingIpcFromMain();
  }

  public trackEvent(category: string, action: string, label?: string, value?: string | number): void {
    UniversalAnalyticsIpcRenderer.sendEventToMain(category, action, label, value);
    GtagWrapper.trackEvent(category, action, label, value);
  }
}
