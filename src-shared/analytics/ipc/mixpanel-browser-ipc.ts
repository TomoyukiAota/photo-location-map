import { BrowserWindow } from 'electron';
import { ProxyRequire } from '../../require/proxy-require';
import { MixpanelBrowserWrapper } from '../library-wrapper/mixpanel-browser-wrapper';

class MixpanelBrowserIpcChannelName {
  public static readonly trackEvent = 'mixpanel-browser-track-event';
}

export class MixpanelBrowserIpcMain {
  private static mainWindow: BrowserWindow;

  public static setMainWindow(browserWindow: BrowserWindow) {
    this.mainWindow = browserWindow;
  }

  public static sendEventToRenderer(category: string, action: string, label?: string, value?: string | number) {
    // Events can be tracked when there is no main window to send them to: on Windows and Linux, the window is
    // destroyed before the app quits (and before "App Quit" is tracked), and on macOS the app can run with its
    // window closed. Such events are skipped here; the other destinations still receive them.
    if (!this.mainWindow || this.mainWindow.isDestroyed() || this.mainWindow.webContents.isDestroyed())
      return;

    this.mainWindow.webContents.send(
      MixpanelBrowserIpcChannelName.trackEvent,
      category, action, label, value
    );
  }
}

export class MixpanelBrowserIpcRenderer {
  private static ipcRenderer = ProxyRequire.electron.ipcRenderer;

  public static configureReceivingIpcFromMain() {
    this.ipcRenderer.on(
      MixpanelBrowserIpcChannelName.trackEvent,
      (event, category: string, action: string, label?: string, value?: string | number) => {
        MixpanelBrowserWrapper.trackEvent(category, action, label, value);
      }
    );
  }
}
