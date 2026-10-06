import { ProxyRequire } from '../../require/proxy-require';
import { AnalyticsBackendWrapper } from '../library-wrapper/analytics-backend-wrapper';

class AnalyticsBackendIpcChannelName {
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
