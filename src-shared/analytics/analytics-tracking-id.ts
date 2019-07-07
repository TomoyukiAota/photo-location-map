import { getDevOrProd } from '../dev-or-prod/dev-or-prod';

class TrackingId {
  public static dev  = 'UA-143091961-1';
  public static prod = 'UA-143091961-2';
}

export class AnalyticsTrackingId {
  private static devOrProd = getDevOrProd();

  public static get(): string {
    if (this.devOrProd === 'Dev') {
      return TrackingId.dev;
    } else if (this.devOrProd === 'Prod') {
      return TrackingId.prod;
    }
  }
}
