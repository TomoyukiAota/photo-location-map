import { Logger } from '../log/logger';
import { AnalyticsInterface } from './analytics-interface';
import { AnalyticsConfig } from './analytics-config';

export class AnalyticsMain implements AnalyticsInterface {
  private readonly visitor: ReturnType<typeof import('universal-analytics')>;
  private userAgent: string = null;

  constructor() {
    const trackingId = AnalyticsConfig.universalAnalyticsTrackingId;
    const userId = AnalyticsConfig.userId;
    const ua = require('universal-analytics');
    this.visitor = ua(trackingId, userId);
    Logger.info(`[Google Analytics] Universal Analytics Tracking ID: ${trackingId}`);
    Logger.info(`[Google Analytics] User ID: ${userId}`);
  }

  public setUserAgent(userAgent: string) {
    this.userAgent = userAgent;
    this.visitor.set('userAgentOverride', this.userAgent);
    Logger.info(`[Google Analytics] User Agent for Google Analytics is "${this.userAgent}"`);
  }

  public trackEvent(category: string, action: string, label?: string, value?: string | number): void {
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
