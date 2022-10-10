import { DevOrProd } from '../../dev-or-prod/dev-or-prod';
import { isPrereleaseVersion } from '../../version/is-prerelease-version';

class MixpanelProjectToken {
  public static dev  = '269bea2bd2dc884b1ec8fac9174acdc4';
  public static prod = 'TODO';
}

export class MixpanelConfig {
  public static get projectToken(): string {
    if (DevOrProd.isDev)
      return MixpanelProjectToken.dev;

    return isPrereleaseVersion()
      ? MixpanelProjectToken.dev
      : MixpanelProjectToken.prod;
  }
}
