export interface AnalyticsInterface {
  trackEvent(category: string, action: string, label?: string, value?: string | number): void;
}
