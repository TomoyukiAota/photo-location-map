import { useAnalytics } from '../src-shared/analytics/analytics';
import { AnalyticsRenderer } from '../src-shared/analytics/analytics-renderer';
import { recordDroppedEvents } from '../src-shared/analytics/record-dropped-events';
import { EnvironmentDetector } from '../src-shared/environment/environment-detector';

// The renderer's analytics, set first in src/start-app.ts, as analytics were set when a module first imported them.
if (!EnvironmentDetector.isUnitTest) {
  useAnalytics(new AnalyticsRenderer());
  // What the renderer's limits dropped, as far as it can be sent when the page goes: the event goes to the main
  // process, which saves what it has not sent yet when the application quits.
  window.addEventListener('pagehide', () => recordDroppedEvents('Renderer'));
}
