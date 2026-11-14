import { DevOrProd } from '../../dev-or-prod/dev-or-prod.js';
import { isPrereleaseVersion } from '../../version/is-prerelease-version.js';
import { AnalyticsBackendEndpoint } from './analytics-backend-endpoint.js';

export class AnalyticsBackendConfig {
  public static get endpoint(): string {
    return AnalyticsBackendEndpoint.select(DevOrProd.isDev, isPrereleaseVersion());
  }
}
