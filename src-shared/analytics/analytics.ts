import { ProcessIdentifier } from '../process/process-identifier';
import { ConditionalRequire } from '../require/conditional-require';
import { AnalyticsInterface } from './analytics-interface';
import { AnalyticsRenderer } from './analytics-renderer';
import { AnalyticsMain } from './analytics-main';
import { AnalyticsIpcChannelName } from './analytics-ipc-channel-name';


let analytics: AnalyticsInterface;

if (ProcessIdentifier.isElectronMain) {
  const analyticsMain = new AnalyticsMain();
  ConditionalRequire.electron.ipcMain.on(AnalyticsIpcChannelName.traceEvent, (event, category, action, label, value) => {
    analyticsMain.trackEvent(category, action, label, value);
  });
  analytics = analyticsMain;
} else {
  analytics = new AnalyticsRenderer();
}

export class Analytics {
  public static trackEvent(category: string, action: string, label?: string, value?: string | number): void {
    analytics.trackEvent(category, action, label, value);
  }
}
