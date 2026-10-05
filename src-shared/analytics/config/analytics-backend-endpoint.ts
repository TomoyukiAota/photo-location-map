export class AnalyticsBackendEndpoint {
  public static readonly dev  = 'https://collect-dev.analytics.photo-location-map.tomoyukiaota.com/v1/events';
  public static readonly prod = 'https://collect-prod.analytics.photo-location-map.tomoyukiaota.com/v1/events';

  // Same rule as MixpanelConfig and AmplitudeConfig: dev for npm-script launches and prerelease versions.
  // Kept free of DevOrProd and the app version so that the rule can be unit-tested.
  public static select(isDev: boolean, isPrerelease: boolean): string {
    return (isDev || isPrerelease) ? this.dev : this.prod;
  }
}
