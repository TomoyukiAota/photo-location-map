// Where Electron's crash reporter uploads a crash dump: the analytics backend's endpoints, as the events' are
// (analytics-backend-endpoint.ts), at a path of their own.
export class CrashReportEndpoint {
  public static readonly dev  = 'https://collect-dev.analytics.photo-location-map.tomoyukiaota.com/v1/crashes';
  public static readonly prod = 'https://collect-prod.analytics.photo-location-map.tomoyukiaota.com/v1/crashes';

  // The events' rule: dev for npm-script launches and prerelease versions. Kept free of DevOrProd and the app version
  // so that the rule can be unit-tested.
  public static select(isDev: boolean, isPrerelease: boolean): string {
    return (isDev || isPrerelease) ? this.dev : this.prod;
  }
}
