import { Logger } from '../../log/logger';
import { AnalyticsConfig } from '../config/analytics-config';
import { GoogleAnalytics4Config } from '../config/google-analytics-4-config';

export class GtagWrapper {
  private static isInitialized = false;

  public static initialize() {
    const measurementId = GoogleAnalytics4Config.measurementId;
    const userId = AnalyticsConfig.userId;
    gtag('js', new Date());
    gtag('config', measurementId, {
      'user_id': userId,
    });
    Logger.info(`[Google Analytics 4] Measurement ID: ${measurementId}`);
    Logger.info(`[Google Analytics 4] User ID: ${userId}`);
    this.isInitialized = true;
  }

  public static trackEvent(category: string, action: string, label?: string, value?: string | number) {
    if (!this.isInitialized) {
      Logger.error('GtagWrapper::initialize needs to be called before calling GtagWrapper::trackEvent');
      return;
    }

    const eventName = action;
    if (eventName.length > 40) {
      Logger.warn(`[Google Analytics 4] Event name length exceeds the limit (40 characters).`);
      Logger.warn(`[Google Analytics 4] event name (action): ${eventName}, category: ${category}, label: ${label}, value: ${value}`);
    }

    gtag('event', eventName, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}
