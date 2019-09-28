import { AnalyticsInterface } from './analytics-interface';
import { ProxyRequire } from '../require/proxy-require';
import { AnalyticsIpcChannelName } from './analytics-ipc-channel-name';

export class AnalyticsRenderer implements AnalyticsInterface {
  trackEvent(category: string, action: string, label?: string, value?: string | number): void {
    ProxyRequire.electron.ipcRenderer.send(
      AnalyticsIpcChannelName.trackEvent,
      category, action, label, value);
  }
}
