import * as amplitude from '@amplitude/analytics-browser';
import { createPrependedLogger } from '../../log/create-prepended-logger';
import { startupMetadata } from '../../startup/startup-metadata';
import { AmplitudeConfig } from '../config/amplitude-config';
import { AnalyticsConfig } from '../config/analytics-config';
import { AnalyticsLibraryWrapperInitialize, AnalyticsLibraryWrapperTrackEvent } from './library-wrapper-decorator';

// Its errors and warnings are not recorded: they would record the analytics' own failures to send.
const amplitudeLogger = createPrependedLogger('[Amplitude]', { recorded: false });

export class AmplitudeAnalyticsBrowserWrapper {
  private static amplitude: typeof import('@amplitude/analytics-browser');
  private static isInitialized = false;

  /** Sets Amplitude up for the renderer, with the user's ID as the device's too, and without the page's URL. */
  @AnalyticsLibraryWrapperInitialize(amplitudeLogger)
  public static initialize() {
    const apiKey = AmplitudeConfig.apiKey;
    const userId = AnalyticsConfig.userId;
    const deviceId = userId; // Use the same ID for User ID and Device ID because User ID is generated per device.
    amplitudeLogger.info(`API Key: ${apiKey}`);
    amplitudeLogger.info(`User ID: ${userId}`);
    amplitudeLogger.info(`Device ID: ${deviceId}`);

    // Only the renderer loads this file (src/analytics-setup.ts): @amplitude/analytics-browser is for web browsers.
    this.amplitude = amplitude;
    // The e2e suite makes an instance of its own to check that the test notices what it must not send.
    if (startupMetadata().isE2e)
      (window as Window & { __plmCreateAmplitudeInstance?: typeof amplitude.createInstance }).__plmCreateAmplitudeInstance = amplitude.createInstance;

    this.amplitude.init(apiKey, userId, {
      // Keep PLM's identity on the SDK's new default events as well as manual events.
      deviceId,
      // These v2 additions expose the desktop window's local installation URL.
      // The previous SDK did not emit them; retain the other ordinary defaults.
      autocapture: {
        pageViews: false,
        pageUrlEnrichment: false,
      },
      // Use the SDK's local defaults; remote overrides and SDK diagnostics are separate.
      fetchRemoteConfig: false,
      enableDiagnostics: false,
    });
    this.amplitude.setDeviceId(deviceId);
    this.isInitialized = true;
  }

  @AnalyticsLibraryWrapperTrackEvent(amplitudeLogger)
  public static trackEvent(category: string, action: string, label?: string, value?: string | number) {
    if (!this.isInitialized) {
      amplitudeLogger.warn('AmplitudeAnalyticsBrowserWrapper::initialize needs to be called before calling AmplitudeAnalyticsBrowserWrapper::trackEvent');
      return;
    }

    this.amplitude.track(action, {
      category: category,
      label: label,
      value: value,
    });
  }
}
