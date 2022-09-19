import { ProxyRequire } from '../../require/proxy-require';
import { UniversalAnalyticsWrapper } from '../library-wrapper/universal-analytics-wrapper';

class UniversalAnalyticsIpcChannelName {
  public static readonly trackEvent = 'universal-analytics-track-event';
}

export class UniversalAnalyticsIpcMain {
  private static ipcMain = ProxyRequire.electron.ipcMain;

  public static configureReceivingIpcFromRenderer() {
    this.ipcMain.on(
      UniversalAnalyticsIpcChannelName.trackEvent,
      (event, category, action, label, value) => {
        UniversalAnalyticsWrapper.trackEvent(category, action, label, value);
      }
    );
  }
}

export class UniversalAnalyticsIpcRenderer {
  private static ipcRenderer = ProxyRequire.electron.ipcRenderer;

  public static sendEventToMain(category: string, action: string, label?: string, value?: string | number) {
    this.ipcRenderer.send(
      UniversalAnalyticsIpcChannelName.trackEvent,
      category, action, label, value
    );
  }
}
