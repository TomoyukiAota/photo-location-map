import { DevOrProd } from '../../dev-or-prod/dev-or-prod';
import { isPrereleaseVersion } from '../../version/is-prerelease-version';

class UniversalAnalyticsTrackingId {
  public static dev  = 'UA-143091961-1';
  public static prod = 'UA-143091961-2';
}

export class UniversalAnalyticsConfig {
  public static get trackingId(): string {
    if (DevOrProd.isDev)
      return UniversalAnalyticsTrackingId.dev;

    return isPrereleaseVersion()
      ? UniversalAnalyticsTrackingId.dev
      : UniversalAnalyticsTrackingId.prod;
  }
}
