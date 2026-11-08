import { useAnalytics } from '../src-shared/analytics/analytics';
import { AnalyticsRenderer } from '../src-shared/analytics/analytics-renderer';
import { EnvironmentDetector } from '../src-shared/environment/environment-detector';

// The renderer's analytics, set first in src/start-app.ts, as analytics were set when a module first imported them.
if (!EnvironmentDetector.isUnitTest)
  useAnalytics(new AnalyticsRenderer());
