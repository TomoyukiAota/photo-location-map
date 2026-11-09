import { EnvironmentDetector } from '../environment/environment-detector';
import { AnalyticsInterface } from './analytics-interface';

let analytics: AnalyticsInterface | undefined;
// Events tracked before the process's analytics were set, sent once they are; at most so many, in case a process
// never sets them, as the main window's preload keeps at most so many messages for its page.
const pendingEvents: Parameters<AnalyticsInterface['trackEvent']>[] = [];
const maxPendingEvents = 1000;

/**
 * Sets the analytics of this process, and sends what was tracked before: the main process's (src-main/analytics/),
 * which use Node.js, or the renderer's (src/analytics-setup.ts), which use the browser SDKs. Each is set from its own
 * process's code, so that this file, which both load, imports neither.
 */
export function useAnalytics(processAnalytics: AnalyticsInterface): void {
  analytics = processAnalytics;
  for (const event of pendingEvents.splice(0)) {
    try {
      analytics.trackEvent(...event);
    } catch (error) {
      // One event that cannot be sent must not stop the others, nor the setup of the process that sets its analytics.
      console.error('An analytics event tracked before the analytics were set could not be sent.', error);
    }
  }
}

export class Analytics {
  public static trackEvent(category: string, action: string, label?: string, value?: string | number): void {
    if (EnvironmentDetector.isUnitTest)
      return;

    if (analytics)
      analytics.trackEvent(category, action, label, value);
    else if (pendingEvents.length < maxPendingEvents)
      pendingEvents.push([category, action, label, value]);
  }
}
