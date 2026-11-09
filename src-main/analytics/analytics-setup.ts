import { AnalyticsMain } from '../../src-shared/analytics/analytics-main';
import { useAnalytics } from '../../src-shared/analytics/analytics';
import { EnvironmentDetector } from '../../src-shared/environment/environment-detector';
import { AnalyticsBackendIpcMain } from './analytics-backend-ipc';

// The main process's analytics, which src-shared/analytics/analytics.ts, loaded by the renderer too, cannot import.
// Set after the settings (src-main/electron-main.ts), which hold the analytics user ID.
if (!EnvironmentDetector.isUnitTest) {
  useAnalytics(new AnalyticsMain());
  AnalyticsBackendIpcMain.configureReceivingIpcFromRenderer();
}
