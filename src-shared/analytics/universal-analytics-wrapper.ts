import { Logger } from '../log/logger';
import { ProcessIdentifier } from '../process/process-identifier';
import { AnalyticsConfig } from './analytics-config';

export class UniversalAnalyticsWrapper {
  private static visitor: ReturnType<typeof import('universal-analytics')>;
  private static userAgent: string = null;

  public static initialize() {
    const trackingId = AnalyticsConfig.universalAnalyticsTrackingId;
    const userId = AnalyticsConfig.userId;
    const ua = require('universal-analytics');
    this.visitor = ua(trackingId, userId);
    Logger.info(`[Universal Analytics] Tracking ID: ${trackingId}`);
    Logger.info(`[Universal Analytics] User ID: ${userId}`);
  }

  public static setUserAgent(userAgent: string) {
    if (ProcessIdentifier.isElectronMain) {
      this.userAgent = userAgent;
      this.visitor.set('userAgentOverride', userAgent);
      Logger.info(`[Universal Analytics] User Agent for Universal Analytics is "${userAgent}"`);
    } else {
      throw new Error('setUserAgentForAnalytics cannot be called in renderer process. Call it in main process.');
    }
  }

  public static trackEvent(category: string, action: string, label?: string, value?: string | number): void {
    if (!this.userAgent)
      throw new Error('User Agent needs to be set before calling Analytics.trackEvent');

    this.visitor
      .event({
        ec: category,
        ea: action,
        el: label,
        ev: value,
      })
      .send();
  }
}
