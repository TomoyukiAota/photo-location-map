import { ProxyRequire } from '../../require/proxy-require';
import { UniversalAnalyticsWrapper } from '../universal-analytics-wrapper';
import { AnalyticsIpcChannelName } from './analytics-ipc-channel-name';

export class UniversalAnalyticsIpcMain {
  private static ipcMain = ProxyRequire.electron.ipcMain;

  public static configureReceivingIpcFromRenderer() {
    this.ipcMain.on(
      AnalyticsIpcChannelName.universalAnalyticsTrackEvent,
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
      AnalyticsIpcChannelName.universalAnalyticsTrackEvent,
      category, action, label, value
    );
  }
}
