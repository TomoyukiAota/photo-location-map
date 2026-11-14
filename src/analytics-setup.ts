import { useAnalytics } from '../src-shared/analytics/analytics';
import { AnalyticsRenderer } from '../src-shared/analytics/analytics-renderer';
import { recordDroppedEvents } from '../src-shared/analytics/record-dropped-events';
import { recordLoggedLine } from '../src-shared/analytics/record-logged-line';
import { EnvironmentDetector } from '../src-shared/environment/environment-detector';
import { useLineRecorder } from '../src-shared/log/logger';

// The renderer's analytics, set first in src/start-app.ts, as analytics were set when a module first imported them.
if (!EnvironmentDetector.isUnitTest) {
  useAnalytics(new AnalyticsRenderer());
  // The errors and warnings that the page logs, those logged before this among them.
  useLineRecorder((level, message, args) => recordLoggedLine('Renderer', level, message, args));
  // What the renderer's limits dropped, as far as it can be sent when the page goes: the event goes to the main
  // process, which saves what it has not sent yet when the application quits.
  window.addEventListener('pagehide', () => recordDroppedEvents('Renderer'));
}
