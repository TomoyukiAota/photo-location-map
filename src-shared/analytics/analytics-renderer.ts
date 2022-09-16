import { AnalyticsInterface } from './analytics-interface';
import { ProxyRequire } from '../require/proxy-require';
import { AnalyticsIpcChannelName } from './analytics-ipc';
import { GoogleAnalytics4Helper } from './google-analytics-4-helper';

export class AnalyticsRenderer implements AnalyticsInterface {
  trackEvent(category: string, action: string, label?: string, value?: string | number): void {
    GoogleAnalytics4Helper.trackEvent(category, action, label, value);

    // Send an event to Universal Analytics
    ProxyRequire.electron.ipcRenderer.send(
      AnalyticsIpcChannelName.universalAnalyticsTrackEvent,
      category, action, label, value);
  }
}
