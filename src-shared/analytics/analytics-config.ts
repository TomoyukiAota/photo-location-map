import { DevOrProd } from '../dev-or-prod/dev-or-prod';
import { isPrereleaseVersion } from '../version/is-prerelease-version';

class TrackingId {
  public static dev  = 'UA-143091961-1';
  public static prod = 'UA-143091961-2';
}

class PropertyName {
  public static dev  = 'photo-location-map-dev';
  public static prod = 'photo-location-map-prod';
}

export class AnalyticsConfig {
  public static get trackingId(): string {
    if (DevOrProd.isDev)
      return TrackingId.dev;

    return isPrereleaseVersion()
      ? TrackingId.dev
      : TrackingId.prod;
  }

  public static get propertyName(): string {
    return this.trackingId === TrackingId.dev
      ? PropertyName.dev
      : PropertyName.prod;
  }
}
