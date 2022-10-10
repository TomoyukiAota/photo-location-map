import { DevOrProd } from '../../dev-or-prod/dev-or-prod';
import { isPrereleaseVersion } from '../../version/is-prerelease-version';

class AmplitudeApiKey {
  public static dev  = '504cfac385ea79239a18052ee430fc19';
  public static prod = 'TODO';
}

export class AmplitudeConfig {
  public static get apiKey(): string {
    if (DevOrProd.isDev)
      return AmplitudeApiKey.dev;

    return isPrereleaseVersion()
      ? AmplitudeApiKey.dev
      : AmplitudeApiKey.prod;
  }
}
