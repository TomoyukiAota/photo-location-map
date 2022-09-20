import * as mixpanel from 'mixpanel-browser';
import { Logger } from '../../log/logger';
import { AnalyticsConfig } from '../config/analytics-config';

export class MixpanelBrowserWrapper {
  private static isInitialized = false;

  public static initialize() {
    const projectToken = '269bea2bd2dc884b1ec8fac9174acdc4';
    const distinctId = AnalyticsConfig.userId;
    mixpanel.init(projectToken);
    mixpanel.identify(distinctId);
    Logger.info(`[Mixpanel] Project Token: ${projectToken}`);
    Logger.info(`[Mixpanel] Distinct ID: ${distinctId}`);
    this.isInitialized = true;
  }

  public static trackEvent(category: string, action: string, label?: string, value?: string | number) {
    if (!this.isInitialized)
      throw new Error('MixpanelBrowserWrapper::initialize needs to be called before calling MixpanelBrowserWrapper::trackEvent');

    mixpanel.track(action, {
      category: category,
      label: label,
      value: value,
    })
  }
}
