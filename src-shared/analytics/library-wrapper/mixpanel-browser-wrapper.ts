import { createPrependedLogger } from '../../log/create-prepended-logger';
import { AnalyticsConfig } from '../config/analytics-config';
import { MixpanelConfig } from '../config/mixpanel-config';
import { AnalyticsLibraryWrapperInitialize, AnalyticsLibraryWrapperTrackEvent } from './library-wrapper-decorator';

const mixpanelLogger = createPrependedLogger('[Mixpanel]');

export class MixpanelBrowserWrapper {
  private static mixpanel: typeof import('mixpanel-browser').default;
  private static isInitialized = false;

  @AnalyticsLibraryWrapperInitialize(mixpanelLogger)
  public static initialize() {
    const projectToken = MixpanelConfig.projectToken;
    const distinctId = AnalyticsConfig.userId;
    mixpanelLogger.info(`Project Token: ${projectToken}`);
    mixpanelLogger.info(`Distinct ID: ${distinctId}`);

    // Avoid import at the top of the file to avoid loading mixpanel-browser in the main process.
    // As of Oct 2022, there is no problem in loading mixpanel-browser in the main process,
    // but this is a preventative measure because mixpanel-browser is designed to be used in web browsers.
    const module = require('mixpanel-browser');
    this.mixpanel = module.default ?? module;

    this.mixpanel.init(projectToken, {
      autocapture: false,
      track_pageview: false,
      record_sessions_percent: 0,
    });
    this.mixpanel.identify(distinctId);
    this.isInitialized = true;
  }

  @AnalyticsLibraryWrapperTrackEvent(mixpanelLogger)
  public static trackEvent(category: string, action: string, label?: string, value?: string | number) {
    if (!this.isInitialized) {
      mixpanelLogger.warn('MixpanelBrowserWrapper::initialize needs to be called before calling MixpanelBrowserWrapper::trackEvent');
      return;
    }

    this.mixpanel.track(action, {
      category: category,
      label: label,
      value: value,
    });
  }
}
