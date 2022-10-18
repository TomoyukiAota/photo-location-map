import { AmplitudeAnalyticsBrowserIpcRenderer } from './ipc/amplitude-analytics-browser-ipc';
import { MixpanelBrowserIpcRenderer } from './ipc/mixpanel-browser-ipc';
import { UniversalAnalyticsIpcRenderer } from './ipc/universal-analytics-ipc';
import { AmplitudeAnalyticsBrowserWrapper } from './library-wrapper/amplitude-analytics-browser-wrapper';
import { MixpanelBrowserWrapper } from './library-wrapper/mixpanel-browser-wrapper';
import { AnalyticsInterface } from './analytics-interface';

export class AnalyticsRenderer implements AnalyticsInterface {
  constructor() {
    AmplitudeAnalyticsBrowserWrapper.initialize();
    AmplitudeAnalyticsBrowserIpcRenderer.configureReceivingIpcFromMain();

    MixpanelBrowserWrapper.initialize();
    MixpanelBrowserIpcRenderer.configureReceivingIpcFromMain();
  }

  public trackEvent(category: string, action: string, label?: string, value?: string | number): void {
    UniversalAnalyticsIpcRenderer.sendEventToMain(category, action, label, value);
    AmplitudeAnalyticsBrowserWrapper.trackEvent(category, action, label, value);
    MixpanelBrowserWrapper.trackEvent(category, action, label, value);
  }
}
