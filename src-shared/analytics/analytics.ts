import { EnvironmentDetector } from '../environment/environment-detector';
import { AnalyticsInterface } from './analytics-interface';

let analytics: AnalyticsInterface | undefined;
// Events tracked before the process's analytics were set, sent once they are.
const pendingEvents: Parameters<AnalyticsInterface['trackEvent']>[] = [];

/**
 * Sets the analytics of this process, and sends what was tracked before: the main process's (src-main/analytics/),
 * which use Node.js, or the renderer's (src/analytics-setup.ts), which use the browser SDKs. Each is set from its own
 * process's code, so that this file, which both load, imports neither.
 */
export function useAnalytics(processAnalytics: AnalyticsInterface): void {
  analytics = processAnalytics;
  for (const event of pendingEvents.splice(0)) analytics.trackEvent(...event);
}

export class Analytics {
  public static trackEvent(category: string, action: string, label?: string, value?: string | number): void {
    if (EnvironmentDetector.isUnitTest)
      return;

    if (analytics)
      analytics.trackEvent(category, action, label, value);
    else
      pendingEvents.push([category, action, label, value]);
  }
}
