import { AnalyticsInterface } from './analytics-interface';
import { ProxyRequire } from '../require/proxy-require';
import { AnalyticsIpcChannelName } from './analytics-ipc';
import { GtagWrapper } from './gtag-wrapper';

export class AnalyticsRenderer implements AnalyticsInterface {
  trackEvent(category: string, action: string, label?: string, value?: string | number): void {
    GtagWrapper.trackEvent(category, action, label, value);

    // Send an event to Universal Analytics
    ProxyRequire.electron.ipcRenderer.send(
      AnalyticsIpcChannelName.universalAnalyticsTrackEvent,
      category, action, label, value);
  }
}
