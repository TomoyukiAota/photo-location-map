import { createPrependedLogger } from '../../log/create-prepended-logger';
import { AmplitudeConfig } from '../config/amplitude-config';
import { AnalyticsConfig } from '../config/analytics-config';
import { AnalyticsLibraryWrapperInitialize, AnalyticsLibraryWrapperTrackEvent } from './library-wrapper-decorator';

const amplitudeLogger = createPrependedLogger('[Amplitude]');

export class AmplitudeAnalyticsBrowserWrapper {
  private static amplitude: typeof import('@amplitude/analytics-browser');
  private static isInitialized = false;

  @AnalyticsLibraryWrapperInitialize(amplitudeLogger)
  public static initialize() {
    const apiKey = AmplitudeConfig.apiKey;
    const userId = AnalyticsConfig.userId;
    const deviceId = userId; // Use the same ID for User ID and Device ID because User ID is generated per device.
    amplitudeLogger.info(`API Key: ${apiKey}`);
    amplitudeLogger.info(`User ID: ${userId}`);
    amplitudeLogger.info(`Device ID: ${deviceId}`);

    // Avoid import at the top of the file to avoid loading @amplitude/analytics-browser in the main process.
    // As of Oct 2022, there is no problem in loading @amplitude/analytics-browser in the main process,
    // but this is a preventative measure because @amplitude/analytics-browser is designed to be used in web browsers.
    this.amplitude = require('@amplitude/analytics-browser');

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
