import { AnalyticsInterface } from './analytics-interface';
import { ConditionalRequire } from '../require/conditional-require';
import { AnalyticsIpcChannelName } from './analytics-ipc-channel-name';

export class AnalyticsRenderer implements AnalyticsInterface {
  trackEvent(category: string, action: string, label?: string, value?: string | number): void {
    ConditionalRequire.electron.ipcRenderer.send(
      AnalyticsIpcChannelName.traceEvent,
      category, action, label, value);
  }
}
