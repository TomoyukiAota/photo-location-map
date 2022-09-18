import { Logger } from '../log/logger';
import { AnalyticsConfig } from './analytics-config';

export class GtagWrapper {
  public static initialize() {
    gtag('js', new Date());
    gtag('config', AnalyticsConfig.googleAnalytics4MeasurementId, {
      'user_id': AnalyticsConfig.userId,
    });
    Logger.info(`[Google Analytics 4] Measurement ID: ${AnalyticsConfig.googleAnalytics4MeasurementId}`);
    Logger.info(`[Google Analytics 4] User ID: ${AnalyticsConfig.userId}`);
  }

  public static trackEvent(category: string, action: string, label?: string, value?: string | number) {
    gtag('event', action, {
      event_category: category,
      event_label: label,
      value,
    });
  }
}
