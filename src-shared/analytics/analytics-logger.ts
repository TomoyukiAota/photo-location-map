import { createPrependedLogger } from '../log/create-prepended-logger';
import { AnalyticsConfig } from './config/analytics-config';
import { AnalyticsInterface } from './analytics-interface';

export const analyticsLogger = createPrependedLogger('[Analytics]');

export function recordIfEventNameLengthExceedsLimit(analytics: AnalyticsInterface, category: string, action: string, label?: string, value?: string | number): void {
  const eventName = action;
  if (eventName.length > 40) {
    analyticsLogger.warn(`Event name length exceeds the limit (40 characters) of Google Analytics 4.`);
    analyticsLogger.warn(`Event Name (Action): ${eventName}, Category: ${category}, Label: ${label}, Value: ${value}`);
    analytics.trackEvent(
      'Event Name Length Exceeds GA4 Limit',
      'Event Name Length Exceeds GA4 Limit',
      `Event Name: ${eventName}, Category: ${category}, Label: ${label}, Value: ${value}`,
      `User ID: ${AnalyticsConfig.userId}`
    );
  }
}
