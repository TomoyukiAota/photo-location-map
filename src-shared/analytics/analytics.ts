import { ProcessIdentifier } from '../process/process-identifier';
import { ConditionalRequire } from '../require/conditional-require';
import { AnalyticsInterface } from './analytics-interface';
import { AnalyticsRenderer } from './analytics-renderer';
import { AnalyticsMain } from './analytics-main';
import { AnalyticsIpcChannelName } from './analytics-ipc-channel-name';
import { DevOrProd } from './dev-or-prod';


let analytics: AnalyticsInterface;

if (ProcessIdentifier.isElectronMain) {
  const analyticsMain = new AnalyticsMain();
  ConditionalRequire.electron.ipcMain.on(AnalyticsIpcChannelName.trackEvent, (event, category, action, label, value) => {
    analyticsMain.trackEvent(category, action, label, value);
  });
  analytics = analyticsMain;
} else {
  analytics = new AnalyticsRenderer();
}

export const setUserAgentForAnalytics = (userAgent: string) => {
  if (analytics instanceof AnalyticsMain) {
    analytics.setUserAgent(userAgent);
  } else {
    throw new Error('setUserAgentForAnalytics cannot be called in renderer process. Call it in main process');
  }
};

export const setDevOrProdForAnalytics = (devOrProd: DevOrProd) => {
  if (analytics instanceof AnalyticsMain) {
    analytics.setDevOrProd(devOrProd);
  } else {
    throw new Error('setDevOrProdForAnalytics cannot be called in renderer process. Call it in main process.');
  }
};

export class Analytics {
  public static trackEvent(category: string, action: string, label?: string, value?: string | number): void {
    analytics.trackEvent(category, action, label, value);
  }
}
