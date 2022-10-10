import { DevOrProd } from '../../dev-or-prod/dev-or-prod';
import { isPrereleaseVersion } from '../../version/is-prerelease-version';

class AmplitudeApiKey {
  public static dev = '62cae04529b44c7ea829e49a64d0e199';
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
