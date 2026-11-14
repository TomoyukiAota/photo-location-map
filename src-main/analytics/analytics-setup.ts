import { app } from 'electron';
import { AnalyticsMain } from '../../src-shared/analytics/analytics-main.js';
import { useAnalytics } from '../../src-shared/analytics/analytics.js';
import { recordDroppedEvents } from '../../src-shared/analytics/record-dropped-events.js';
import { recordLoggedLine } from '../../src-shared/analytics/record-logged-line.js';
import { EnvironmentDetector } from '../../src-shared/environment/environment-detector.js';
import { useLineRecorder } from '../../src-shared/log/logger.js';
import { AnalyticsBackendIpcMain } from './analytics-backend-ipc.js';

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
