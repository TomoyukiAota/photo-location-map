import { ProxyRequire } from '../require/proxy-require';
import { AnalyticsInterface } from './analytics-interface';
import { AnalyticsIpcChannelName } from './analytics-ipc';
import { GtagWrapper } from './gtag-wrapper';

export class AnalyticsRenderer implements AnalyticsInterface {
  constructor() {
    GtagWrapper.initialize();
  }

  trackEvent(category: string, action: string, label?: string, value?: string | number): void {
    GtagWrapper.trackEvent(category, action, label, value);

    // Send an event to Universal Analytics
    ProxyRequire.electron.ipcRenderer.send(
      AnalyticsIpcChannelName.universalAnalyticsTrackEvent,
      category, action, label, value);
  }
}
