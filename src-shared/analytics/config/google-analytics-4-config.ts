import { DevOrProd } from '../../dev-or-prod/dev-or-prod';
import { isPrereleaseVersion } from '../../version/is-prerelease-version';

class GoogleAnalytics4MeasurementId {
  public static dev  = 'G-FWHPKTH800';
  public static prod = 'G-5KPL04TELK';
}

export class GoogleAnalytics4Config {
  public static get measurementId(): string {
    if (DevOrProd.isDev)
      return GoogleAnalytics4MeasurementId.dev;

    return isPrereleaseVersion()
      ? GoogleAnalytics4MeasurementId.dev
      : GoogleAnalytics4MeasurementId.prod;
  }
}
