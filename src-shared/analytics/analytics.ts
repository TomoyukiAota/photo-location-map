import { EnvironmentDetector } from '../environment/environment-detector';
import { AnalyticsInterface } from './analytics-interface';

let analytics: AnalyticsInterface | undefined;
// Events tracked before the process's analytics were set, sent once they are; at most so many, in case a process
// never sets them, as the main window's preload keeps at most so many messages for its page.
const pendingEvents: Parameters<AnalyticsInterface['trackEvent']>[] = [];
const maxPendingEvents = 1000;
let pendingEventsListener: (() => void) | undefined;

/** Whether this process's analytics are set. */
export function isAnalyticsSet(): boolean {
  return analytics !== undefined;
}

/**
 * TL;DR: The events tracked before this process's analytics were set, while they are not, and what is called when
 * they change: when one is kept, and when the analytics are set and take them.
 * Details: A launch of the main process keeps them in its file (src-main/launch/), so that those of a setup that fails
 * and stops the launch before its analytics are set, its error among them, are sent by the next launch; and writes the
 * file without them once its analytics take them, so that they are not sent twice.
 */
export function eventsKeptBeforeAnalytics(): Parameters<AnalyticsInterface['trackEvent']>[] {
  return analytics ? [] : [...pendingEvents];
}

export function whenEventsKeptBeforeAnalyticsChange(listener: (() => void) | undefined): void {
  pendingEventsListener = listener;
}

function tellPendingEventsChanged(): void {
  try {
    pendingEventsListener?.();
  } catch (error) {
    // The events are kept or sent all the same; tracking never throws.
    console.error('What is called when the analytics events kept before the analytics were set change failed.', error);
  }
}

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
  tellPendingEventsChanged();
}

export class Analytics {
  /** Sends an event, or keeps up to 1000 until the process's analytics are set up; none in unit tests. */
  public static trackEvent(category: string, action: string, label?: string, value?: string | number): void {
    if (EnvironmentDetector.isUnitTest)
      return;

    if (analytics) {
      analytics.trackEvent(category, action, label, value);
    } else if (pendingEvents.length < maxPendingEvents) {
      pendingEvents.push([category, action, label, value]);
      tellPendingEventsChanged();
    }
  }
}
