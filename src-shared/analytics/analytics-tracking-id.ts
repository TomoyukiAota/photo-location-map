import { DevOrProd } from '../dev-or-prod/dev-or-prod';

class TrackingId {
  public static dev  = 'UA-143091961-1';
  public static prod = 'UA-143091961-2';
}

export class AnalyticsTrackingId {
  public static get(): string {
    return DevOrProd.isDev
      ? TrackingId.dev
      : TrackingId.prod;
  }
}
