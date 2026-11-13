import mixpanel from 'mixpanel-browser';
import { createPrependedLogger } from '../../log/create-prepended-logger';
import { AnalyticsConfig } from '../config/analytics-config';
import { MixpanelConfig } from '../config/mixpanel-config';
import { AnalyticsLibraryWrapperInitialize, AnalyticsLibraryWrapperTrackEvent } from './library-wrapper-decorator';

// Its errors and warnings are not recorded: they would record the analytics' own failures to send.
const mixpanelLogger = createPrependedLogger('[Mixpanel]', { recorded: false });

export class MixpanelBrowserWrapper {
  private static mixpanel: typeof import('mixpanel-browser').default;
  private static isInitialized = false;

  @AnalyticsLibraryWrapperInitialize(mixpanelLogger)
  public static initialize() {
    const projectToken = MixpanelConfig.projectToken;
    const distinctId = AnalyticsConfig.userId;
    mixpanelLogger.info(`Project Token: ${projectToken}`);
    mixpanelLogger.info(`Distinct ID: ${distinctId}`);

    // Only the renderer loads this file (src/analytics-setup.ts): mixpanel-browser is for web browsers.
    this.mixpanel = mixpanel;

    this.mixpanel.init(projectToken);
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
