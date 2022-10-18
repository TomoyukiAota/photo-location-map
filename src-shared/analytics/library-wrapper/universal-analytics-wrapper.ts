import { createPrependedLogger } from '../../log/create-prepended-logger';
import { AnalyticsConfig } from '../config/analytics-config';
import { UniversalAnalyticsConfig } from '../config/universal-analytics-config';
import {
  AnalyticsLibraryWrapperInitialize,
  AnalyticsLibraryWrapperSetUserAgent,
  AnalyticsLibraryWrapperTrackEvent
} from './library-wrapper-decorator';

const uaLogger = createPrependedLogger('[Universal Analytics]');

export class UniversalAnalyticsWrapper {
  private static visitor: ReturnType<typeof import('universal-analytics')>;
  private static isUserAgentSet = false;

  @AnalyticsLibraryWrapperInitialize(uaLogger)
  public static initialize() {
    const trackingId = UniversalAnalyticsConfig.trackingId;
    const userId = AnalyticsConfig.userId;
    uaLogger.info(`Tracking ID: ${trackingId}`);
    uaLogger.info(`User ID: ${userId}`);
    const ua = require('universal-analytics');
    this.visitor = ua(trackingId, userId);
  }

  @AnalyticsLibraryWrapperSetUserAgent(uaLogger)
  public static setUserAgent(userAgent: string) {
    if (!this.visitor) {
      uaLogger.error('UniversalAnalyticsWrapper::initialize needs to be called before calling setUserAgent.');
      return;
    }

    this.visitor.set('userAgentOverride', userAgent);
    uaLogger.info(`User Agent for Universal Analytics is "${userAgent}"`);
    this.isUserAgentSet = true;
  }

  @AnalyticsLibraryWrapperTrackEvent(uaLogger)
  public static trackEvent(category: string, action: string, label?: string, value?: string | number): void {
    if (!this.isUserAgentSet) {
      uaLogger.warn('User Agent needs to be set before calling Analytics.trackEvent');
      return;
    }

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
