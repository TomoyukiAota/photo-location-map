import { EnvironmentDetector } from '../environment/environment-detector';
import { ProcessIdentifier } from '../process/process-identifier';
import { AnalyticsInterface } from './analytics-interface';
import { AnalyticsMain } from './analytics-main';
import { AnalyticsRenderer } from './analytics-renderer';

let analytics: AnalyticsInterface;

function initializeAnalytics() {
  if (EnvironmentDetector.isUnitTest)
    return;

  if (ProcessIdentifier.isElectronMain) {
    analytics = new AnalyticsMain();
  } else {
    analytics = new AnalyticsRenderer();
  }
}

export class Analytics {
  public static trackEvent(category: string, action: string, label?: string, value?: string | number): void {
    if (EnvironmentDetector.isUnitTest)
      return;

    analytics.trackEvent(category, action, label, value);
  }
}

initializeAnalytics();
