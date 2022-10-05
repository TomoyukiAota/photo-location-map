import { BrowserWindow } from 'electron';
import { UniversalAnalyticsWrapper } from '../src-shared/analytics/library-wrapper/universal-analytics-wrapper';
import { AmplitudeAnalyticsBrowserIpcMain } from '../src-shared/analytics/ipc/amplitude-analytics-browser-ipc';
import { MixpanelBrowserIpcMain } from '../src-shared/analytics/ipc/mixpanel-browser-ipc';
import { GoogleAnalytics4IpcMain } from '../src-shared/analytics/ipc/google-analytics-4-ipc';

export function configureMainWindowForAnalytics(mainWindow: BrowserWindow) {
  const userAgent = mainWindow.webContents.userAgent;
  UniversalAnalyticsWrapper.setUserAgent(userAgent);
  AmplitudeAnalyticsBrowserIpcMain.setMainWindow(mainWindow);
  MixpanelBrowserIpcMain.setMainWindow(mainWindow);
  GoogleAnalytics4IpcMain.setMainWindow(mainWindow);
}
