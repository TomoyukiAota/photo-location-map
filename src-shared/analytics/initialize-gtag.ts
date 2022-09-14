import { AnalyticsConfig } from './analytics-config';

export function initializeGtag() {
  gtag('js', new Date());
  gtag('config', AnalyticsConfig.googleAnalytics4MeasurementId, {
    'user_id': AnalyticsConfig.userId,
  });
}
