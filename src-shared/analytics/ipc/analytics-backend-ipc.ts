import { ProxyRequire } from '../../require/proxy-require';
import { AnalyticsBackendWrapper } from '../library-wrapper/analytics-backend-wrapper';

class AnalyticsBackendIpcChannelName {
  // Photo Data Viewer also sends on this channel, from the window launch-photo-data-viewer.ts opens, so that its
  // events are recorded as part of this install's use (src/analytics/plm-backend.ts in
  // https://github.com/TomoyukiAota/photo-data-viewer). Photo Data Viewer is deployed apart from this app and serves
  // every released version of it at once, so it can send on one name only: this one must not be renamed.
  public static readonly trackEvent = 'analytics-backend-track-event';
}

export class AnalyticsBackendIpcMain {
  private static ipcMain = ProxyRequire.electron.ipcMain;

  public static configureReceivingIpcFromRenderer() {
    this.ipcMain.on(
      AnalyticsBackendIpcChannelName.trackEvent,
      (event, category: string, action: string, label?: string, value?: string | number) => {
        AnalyticsBackendWrapper.trackEvent(category, action, label, value);
      }
    );
  }
}

export class AnalyticsBackendIpcRenderer {
  private static ipcRenderer = ProxyRequire.electron.ipcRenderer;

  public static sendEventToMain(category: string, action: string, label?: string, value?: string | number) {
    this.ipcRenderer.send(
      AnalyticsBackendIpcChannelName.trackEvent,
      category, action, label, value
    );
  }
}
