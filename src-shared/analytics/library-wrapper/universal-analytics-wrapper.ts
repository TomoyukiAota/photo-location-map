import { Logger } from '../../log/logger';
import { ProcessIdentifier } from '../../process/process-identifier';
import { AnalyticsConfig } from '../config/analytics-config';
import { UniversalAnalyticsConfig } from '../config/universal-analytics-config';

export class UniversalAnalyticsWrapper {
  private static visitor: ReturnType<typeof import('universal-analytics')>;
  private static userAgent: string = null;

  public static initialize() {
    const trackingId = UniversalAnalyticsConfig.trackingId;
    const userId = AnalyticsConfig.userId;
    const ua = require('universal-analytics');
    this.visitor = ua(trackingId, userId);
    Logger.info(`[Universal Analytics] Tracking ID: ${trackingId}`);
    Logger.info(`[Universal Analytics] User ID: ${userId}`);
  }

  public static setUserAgent(userAgent: string) {
    if (ProcessIdentifier.isElectronMain) {
      this.userAgent = userAgent;
      if (this.visitor) {
        this.visitor.set('userAgentOverride', userAgent);
        Logger.info(`[Universal Analytics] User Agent for Universal Analytics is "${userAgent}"`);
      } else {
        throw new Error('UniversalAnalyticsWrapper::initialize needs to be called before calling setUserAgent.');
      }
    } else {
      throw new Error('UniversalAnalyticsWrapper::setUserAgent cannot be called in renderer process. Call it in main process.');
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