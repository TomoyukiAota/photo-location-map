import { bridge } from '../bridge/plm-bridge.js';
import { AmplitudeAnalyticsBrowserWrapper } from './library-wrapper/amplitude-analytics-browser-wrapper.js';
import { MixpanelBrowserWrapper } from './library-wrapper/mixpanel-browser-wrapper.js';
import { AnalyticsInterface } from './analytics-interface.js';

export class AnalyticsRenderer implements AnalyticsInterface {
  constructor() {
    // The browser SDKs run in the renderer, so the main process sends them its events (src-shared/analytics/ipc/).
    AmplitudeAnalyticsBrowserWrapper.initialize();
    bridge().analytics.onAmplitudeEvent((category, action, label, value) => AmplitudeAnalyticsBrowserWrapper.trackEvent(category, action, label, value));

    MixpanelBrowserWrapper.initialize();
    bridge().analytics.onMixpanelEvent((category, action, label, value) => MixpanelBrowserWrapper.trackEvent(category, action, label, value));
  }

  public trackEvent(category: string, action: string, label?: string, value?: string | number): void {
    AmplitudeAnalyticsBrowserWrapper.trackEvent(category, action, label, value);
    MixpanelBrowserWrapper.trackEvent(category, action, label, value);
    bridge().analytics.sendToBackend(category, action, label, value);
  }
}
