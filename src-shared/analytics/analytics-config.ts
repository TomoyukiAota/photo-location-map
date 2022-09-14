import { v4 as uuidv4 } from 'uuid';
import { DevOrProd } from '../dev-or-prod/dev-or-prod';
import { isPrereleaseVersion } from '../version/is-prerelease-version';
import { UserDataStorage } from '../user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../user-data-storage/user-data-stroage-path';

class GoogleAnalytics4MeasurementId {
  public static dev = 'G-FWHPKTH800';
  public static prod = 'G-5KPL04TELK';
}

class UniversalAnalyticsTrackingId {
  public static dev  = 'UA-143091961-1';
  public static prod = 'UA-143091961-2';
}

export class AnalyticsConfig {
  public static get googleAnalytics4MeasurementId(): string {
    if (DevOrProd.isDev)
      return GoogleAnalytics4MeasurementId.dev;

    return isPrereleaseVersion()
      ? GoogleAnalytics4MeasurementId.dev
      : GoogleAnalytics4MeasurementId.prod;
  }

  public static get universalAnalyticsTrackingId(): string {
    if (DevOrProd.isDev)
      return UniversalAnalyticsTrackingId.dev;

    return isPrereleaseVersion()
      ? UniversalAnalyticsTrackingId.dev
      : UniversalAnalyticsTrackingId.prod;
  }

  public static get userId(): string {
    let userId: string;

    try {
      userId = UserDataStorage.read(UserDataStoragePath.Analytics.UserId);
    } catch {
      userId = uuidv4();
      UserDataStorage.write(UserDataStoragePath.Analytics.UserId, userId);
    }

    return userId;
  }
}
