import { Logger } from '../log/logger';
import { AnalyticsConfig } from './analytics-config';

export function initializeGtag() {
  gtag('js', new Date());
  gtag('config', AnalyticsConfig.googleAnalytics4MeasurementId, {
    'user_id': AnalyticsConfig.userId,
  });
  Logger.info(`[Google Analytics 4] Measurement ID: ${AnalyticsConfig.googleAnalytics4MeasurementId}`);
  Logger.info(`[Google Analytics 4] User ID: ${AnalyticsConfig.userId}`);
}
