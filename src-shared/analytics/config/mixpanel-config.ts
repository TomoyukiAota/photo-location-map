import { DevOrProd } from '../../dev-or-prod/dev-or-prod';
import { isPrereleaseVersion } from '../../version/is-prerelease-version';

class MixpanelProjectToken {
  public static dev  = '9f48c4c504ae32885d31d8c0910d072a';
  public static prod = '4b495f033948124840cad7a1e72a0d3c';
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
