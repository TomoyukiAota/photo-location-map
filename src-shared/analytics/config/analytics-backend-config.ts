import { DevOrProd } from '../../dev-or-prod/dev-or-prod';
import { isPrereleaseVersion } from '../../version/is-prerelease-version';
import { AnalyticsBackendEndpoint } from './analytics-backend-endpoint';

export class AnalyticsBackendConfig {
  public static get endpoint(): string {
    return AnalyticsBackendEndpoint.select(DevOrProd.isDev, isPrereleaseVersion());
  }
}
