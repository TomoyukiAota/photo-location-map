import { BrowserWindow } from 'electron';
import { ProxyRequire } from '../../require/proxy-require';
import { GtagWrapper } from '../gtag-wrapper';

class GoogleAnalytics4IpcChannelName {
  public static readonly trackEvent = 'google-analytics-4-track-event';
}

export class GoogleAnalytics4IpcMain {
  private static mainWindow: BrowserWindow;

  public static setMainWindow(browserWindow: BrowserWindow) {
    this.mainWindow = browserWindow;
  }

  public static sendEventToRenderer(category: string, action: string, label?: string, value?: string | number) {
    this.mainWindow.webContents.send(
      GoogleAnalytics4IpcChannelName.trackEvent,
      category, action, label, value
    );
  }
}

export class GoogleAnalytics4IpcRenderer {
  private static ipcRenderer = ProxyRequire.electron.ipcRenderer;

  public static configureReceivingIpcFromMain() {
    this.ipcRenderer.on(
      GoogleAnalytics4IpcChannelName.trackEvent,
      (event, category: string, action: string, label?: string, value?: string | number) => {
        GtagWrapper.trackEvent(category, action, label, value);
      }
    );
  }
}
