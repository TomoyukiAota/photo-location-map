import { GoogleAnalytics4IpcRenderer } from './ipc/google-analytics-4-ipc';
import { MixpanelBrowserIpcRenderer } from './ipc/mixpanel-browser-ipc';
import { UniversalAnalyticsIpcRenderer } from './ipc/universal-analytics-ipc';
import { GtagWrapper } from './library-wrapper/gtag-wrapper';
import { MixpanelBrowserWrapper } from './library-wrapper/mixpanel-browser-wrapper';
import { AnalyticsInterface } from './analytics-interface';

export class AnalyticsRenderer implements AnalyticsInterface {
  constructor() {
    MixpanelBrowserWrapper.initialize();
    MixpanelBrowserIpcRenderer.configureReceivingIpcFromMain();

    GtagWrapper.initialize();
    GoogleAnalytics4IpcRenderer.configureReceivingIpcFromMain();
  }

  public trackEvent(category: string, action: string, label?: string, value?: string | number): void {
    UniversalAnalyticsIpcRenderer.sendEventToMain(category, action, label, value);
    MixpanelBrowserWrapper.trackEvent(category, action, label, value);
    GtagWrapper.trackEvent(category, action, label, value);
  }
}
