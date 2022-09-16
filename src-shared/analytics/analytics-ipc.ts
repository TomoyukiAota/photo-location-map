import { BrowserWindow } from 'electron';
import { ProxyRequire } from '../require/proxy-require';
import { GoogleAnalytics4Helper } from './google-analytics-4-helper';

export class AnalyticsIpcChannelName {
  public static readonly googleAnalytics4TrackEvent = 'google-analytics-4-track-event';
  public static readonly universalAnalyticsTrackEvent = 'universal-analytics-track-event';
}

export class GoogleAnalytics4IpcMain {
  private static mainWindow: BrowserWindow;

  public static setMainWindow(browserWindow: BrowserWindow) {
    this.mainWindow = browserWindow;
  }

  public static sendEventToRenderer(category: string, action: string, label?: string, value?: string | number) {
    this.mainWindow.webContents.send(AnalyticsIpcChannelName.googleAnalytics4TrackEvent, category, action, label, value);
  }
}

export class GoogleAnalytics4IpcRenderer {
  private static ipcRenderer = ProxyRequire.electron.ipcRenderer;

  public static configureIpc() {
    this.ipcRenderer.on(
      AnalyticsIpcChannelName.googleAnalytics4TrackEvent,
      (event, category: string, action: string, label?: string, value?: string | number) => {
        GoogleAnalytics4Helper.trackEvent(category, action, label, value);
      }
    );
  }
}

