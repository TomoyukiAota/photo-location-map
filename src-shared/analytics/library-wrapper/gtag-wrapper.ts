import { createPrependedLogger } from '../../log/create-prepended-logger';
import { AnalyticsConfig } from '../config/analytics-config';
import { GoogleAnalytics4Config } from '../config/google-analytics-4-config';

const ga4Logger = createPrependedLogger('[Google Analytics 4]');

export class GtagWrapper {
  private static isInitialized = false;

  public static initialize() {
    const measurementId = GoogleAnalytics4Config.measurementId;
    const userId = AnalyticsConfig.userId;
    ga4Logger.info(`Measurement ID: ${measurementId}`);
    ga4Logger.info(`User ID: ${userId}`);
    gtag('js', new Date());
    gtag('config', measurementId, {
      'user_id': userId,
    });
    this.isInitialized = true;
  }

  public static trackEvent(category: string, action: string, label?: string, value?: string | number) {
    if (!this.isInitialized) {
      ga4Logger.error('GtagWrapper::initialize needs to be called before calling GtagWrapper::trackEvent');
      return;
    }

    const eventName = action;
    if (eventName.length > 40) {
      ga4Logger.warn(`Event name length exceeds the limit (40 characters).`);
      ga4Logger.warn(`event name (action): ${eventName}, category: ${category}, label: ${label}, value: ${value}`);
    }

    gtag('event', eventName, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}
