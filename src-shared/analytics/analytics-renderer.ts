import { ProxyRequire } from '../require/proxy-require';
import { AnalyticsIpcChannelName } from './ipc/analytics-ipc-channel-name';
import { AnalyticsInterface } from './analytics-interface';
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
