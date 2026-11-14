import { BrowserWindow } from 'electron';
import { AmplitudeAnalyticsBrowserIpcMain } from '../src-shared/analytics/ipc/amplitude-analytics-browser-ipc.js';
import { MixpanelBrowserIpcMain } from '../src-shared/analytics/ipc/mixpanel-browser-ipc.js';

export function configureMainWindowForAnalytics(mainWindow: BrowserWindow) {
  AmplitudeAnalyticsBrowserIpcMain.setMainWindow(mainWindow);
  MixpanelBrowserIpcMain.setMainWindow(mainWindow);
}
