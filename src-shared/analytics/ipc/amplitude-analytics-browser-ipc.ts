import type { BrowserWindow } from 'electron';

// The main process sends its events to the renderer, whose SDK records them; the renderer listens through its
// preload (electron-util/preload/main-window.cjs), which keeps a copy of the channel's name.

export class AmplitudeAnalyticsBrowserIpcChannelName {
  public static readonly trackEvent = 'amplitude-analytics-browser-track-event';
}

export class AmplitudeAnalyticsBrowserIpcMain {
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
      AmplitudeAnalyticsBrowserIpcChannelName.trackEvent,
      category, action, label, value
    );
  }
}
