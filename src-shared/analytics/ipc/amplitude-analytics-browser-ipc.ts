import { BrowserWindow } from 'electron';
import { ProxyRequire } from '../../require/proxy-require';
import { AmplitudeAnalyticsBrowserWrapper } from '../library-wrapper/amplitude-analytics-browser-wrapper';

class AmplitudeAnalyticsBrowserIpcChannelName {
  public static readonly trackEvent = 'amplitude-analytics-browser-track-event';
}

export class AmplitudeAnalyticsBrowserIpcMain {
  private static mainWindow: BrowserWindow;

  public static setMainWindow(browserWindow: BrowserWindow) {
    this.mainWindow = browserWindow;
  }

  public static sendEventToRenderer(category: string, action: string, label?: string, value?: string | number) {
    this.mainWindow.webContents.send(
      AmplitudeAnalyticsBrowserIpcChannelName.trackEvent,
      category, action, label, value
    );
  }
}

export class AmplitudeAnalyticsBrowserIpcRenderer {
  private static ipcRenderer = ProxyRequire.electron.ipcRenderer;

  public static configureReceivingIpcFromMain() {
    this.ipcRenderer.on(
      AmplitudeAnalyticsBrowserIpcChannelName.trackEvent,
      (event, category: string, action: string, label?: string, value?: string | number) => {
        AmplitudeAnalyticsBrowserWrapper.trackEvent(category, action, label, value);
      }
    );
  }
}
