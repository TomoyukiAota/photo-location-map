import { BrowserWindow } from 'electron';
import { UniversalAnalyticsWrapper } from '../src-shared/analytics/library-wrapper/universal-analytics-wrapper';
import { AmplitudeAnalyticsBrowserIpcMain } from '../src-shared/analytics/ipc/amplitude-analytics-browser-ipc';
import { MixpanelBrowserIpcMain } from '../src-shared/analytics/ipc/mixpanel-browser-ipc';

export function configureMainWindowForAnalytics(mainWindow: BrowserWindow) {
  const userAgent = mainWindow.webContents.userAgent;
  UniversalAnalyticsWrapper.setUserAgent(userAgent);
  AmplitudeAnalyticsBrowserIpcMain.setMainWindow(mainWindow);
  MixpanelBrowserIpcMain.setMainWindow(mainWindow);
}
