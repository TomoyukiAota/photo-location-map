import { Logger } from '../../log/logger';
import { AnalyticsConfig } from '../config/analytics-config';
import { GoogleAnalytics4Config } from '../config/google-analytics-4-config';

export class GtagWrapper {
  public static initialize() {
    const measurementId = GoogleAnalytics4Config.measurementId;
    const userId = AnalyticsConfig.userId;
    gtag('js', new Date());
    gtag('config', measurementId, {
      'user_id': userId,
    });
    Logger.info(`[Google Analytics 4] Measurement ID: ${measurementId}`);
    Logger.info(`[Google Analytics 4] User ID: ${userId}`);
  }

  public static trackEvent(category: string, action: string, label?: string, value?: string | number) {
    gtag('event', action, {
      event_category: category,
      event_label: label,
      value,
    });
  }
}
