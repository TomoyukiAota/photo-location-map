import * as mixpanel from 'mixpanel-browser';
import { createPrependedLogger } from '../../log/create-prepended-logger';
import { AnalyticsConfig } from '../config/analytics-config';

const mixpanelLogger = createPrependedLogger('[Mixpanel]');

export class MixpanelBrowserWrapper {
  private static isInitialized = false;

  public static initialize() {
    const projectToken = '269bea2bd2dc884b1ec8fac9174acdc4';
    const distinctId = AnalyticsConfig.userId;
    mixpanelLogger.info(`Project Token: ${projectToken}`);
    mixpanelLogger.info(`Distinct ID: ${distinctId}`);
    mixpanel.init(projectToken);
    mixpanel.identify(distinctId);
    this.isInitialized = true;
  }

  public static trackEvent(category: string, action: string, label?: string, value?: string | number) {
    if (!this.isInitialized) {
      mixpanelLogger.error('MixpanelBrowserWrapper::initialize needs to be called before calling MixpanelBrowserWrapper::trackEvent');
      return;
    }

    mixpanel.track(action, {
      category: category,
      label: label,
      value: value,
    })
  }
}
