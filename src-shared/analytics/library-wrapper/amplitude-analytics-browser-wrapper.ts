import * as amplitude from '@amplitude/analytics-browser';
import { createPrependedLogger } from '../../log/create-prepended-logger';
import { AnalyticsConfig } from '../config/analytics-config';
import { AnalyticsLibraryWrapperInitialize, AnalyticsLibraryWrapperTrackEvent } from './library-wrapper-decorator';

const amplitudeLogger = createPrependedLogger('[Amplitude]');

export class AmplitudeAnalyticsBrowserWrapper {
  private static isInitialized = false;

  @AnalyticsLibraryWrapperInitialize(amplitudeLogger)
  public static initialize() {
    const apiKey = '62cae04529b44c7ea829e49a64d0e199';
    const userId = AnalyticsConfig.userId;
    const deviceId = userId; // Use the same ID for User ID and Device ID because User ID is generated per device.
    amplitudeLogger.info(`API Key: ${apiKey}`);
    amplitudeLogger.info(`User ID: ${userId}`);
    amplitudeLogger.info(`Device ID: ${deviceId}`);
    amplitude.init(apiKey, userId);
    amplitude.setDeviceId(deviceId);
    this.isInitialized = true;
  }

  @AnalyticsLibraryWrapperTrackEvent(amplitudeLogger)
  public static trackEvent(category: string, action: string, label?: string, value?: string | number) {
    if (!this.isInitialized) {
      amplitudeLogger.error('AmplitudeAnalyticsBrowserWrapper::initialize needs to be called before calling AmplitudeAnalyticsBrowserWrapper::trackEvent');
      return;
    }

    amplitude.track(action, {
      category: category,
      label: label,
      value: value,
    })
  }
}