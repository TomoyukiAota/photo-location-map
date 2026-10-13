import { BrowserWindow } from 'electron';
import { AmplitudeAnalyticsBrowserIpcMain } from '../src-shared/analytics/ipc/amplitude-analytics-browser-ipc';
import { MixpanelBrowserIpcMain } from '../src-shared/analytics/ipc/mixpanel-browser-ipc';

export function configureMainWindowForAnalytics(mainWindow: BrowserWindow) {
  AmplitudeAnalyticsBrowserIpcMain.setMainWindow(mainWindow);
  MixpanelBrowserIpcMain.setMainWindow(mainWindow);
}
