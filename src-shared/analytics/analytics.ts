import { EnvironmentDetector } from '../environment/environment-detector';
import { ProcessIdentifier } from '../process/process-identifier';
import { ProxyRequire } from '../require/proxy-require';
import { AnalyticsIpcChannelName } from './ipc/analytics-ipc-channel-name';
import { GoogleAnalytics4IpcRenderer } from './ipc/google-analytics-4-ipc'
import { AnalyticsInterface } from './analytics-interface';
import { AnalyticsMain } from './analytics-main';
import { AnalyticsRenderer } from './analytics-renderer';

let analytics: AnalyticsInterface;

function initializeAnalytics() {
  if (EnvironmentDetector.isUnitTest)
    return;

  if (ProcessIdentifier.isElectronMain) {
    const analyticsMain = new AnalyticsMain();
    ProxyRequire.electron.ipcMain.on(AnalyticsIpcChannelName.universalAnalyticsTrackEvent, (event, category, action, label, value) => {
      analyticsMain.trackEvent(category, action, label, value);
    });
    analytics = analyticsMain;
  } else {
    GoogleAnalytics4IpcRenderer.configureIpc();
    analytics = new AnalyticsRenderer();
  }
}

export class Analytics {
  public static trackEvent(category: string, action: string, label?: string, value?: string | number): void {
    if (EnvironmentDetector.isUnitTest)
      return;

    analytics.trackEvent(category, action, label, value);
  }
}

initializeAnalytics();
