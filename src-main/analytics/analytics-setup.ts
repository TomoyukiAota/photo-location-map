import { app } from 'electron';
import { AnalyticsMain } from '../../src-shared/analytics/analytics-main';
import { useAnalytics } from '../../src-shared/analytics/analytics';
import { recordDroppedEvents } from '../../src-shared/analytics/record-dropped-events';
import { recordLoggedLine } from '../../src-shared/analytics/record-logged-line';
import { EnvironmentDetector } from '../../src-shared/environment/environment-detector';
import { useLineRecorder } from '../../src-shared/log/logger';
import { AnalyticsBackendIpcMain } from './analytics-backend-ipc';

// The main process's analytics, which src-shared/analytics/analytics.ts, loaded by the renderer too, cannot import.
// Set after the settings (src-main/electron-main.ts), which hold the analytics user ID.
if (!EnvironmentDetector.isUnitTest) {
  useAnalytics(new AnalyticsMain());
  AnalyticsBackendIpcMain.configureReceivingIpcFromRenderer();
  // The errors and warnings that the main process logs, those logged before this among them.
  useLineRecorder((level, message, args) => recordLoggedLine('Main', level, message, args));
  // On before-quit, which comes before will-quit, when the events not sent yet are saved (AnalyticsBackendWrapper).
  app.on('before-quit', () => recordDroppedEvents('Main'));
}
