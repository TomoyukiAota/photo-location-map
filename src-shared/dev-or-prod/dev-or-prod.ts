import { Logger } from '../log/logger';
import { ProxyRequire } from '../require/proxy-require';
import { RequireFromMainProcess } from '../require/require-from-main-process';

export type DevOrProdType = 'Dev' | 'Prod';

function determineDevOrProd(): DevOrProdType {
  // process.env.npm_package_config_devOrProd is set from "devOrProd" in "config" in package.json
  // when npm script defined in package.json is used.
  // This means the followings:
  //  - If npm script (e.g. "npm start", "npm run test:all") is used, devOrProdInPackageJson is set to the value of "devOrProd" in package.json
  //  - If packaged application is directly launched (i.e. publicly released application), devOrProdInPackageJson is not set (undefined).
  const devOrProdInPackageJson = process.env.npm_package_config_devOrProd as DevOrProdType;

  Logger.info(`"devOrProd" in "config" in package.json: ${devOrProdInPackageJson}`);

  const isDevOrProdSpecifiedInPackageJson = devOrProdInPackageJson === 'Dev' || devOrProdInPackageJson === 'Prod';

  if (isDevOrProdSpecifiedInPackageJson) {
    return devOrProdInPackageJson;
  } else if (!devOrProdInPackageJson) {
    return determineDevOrProdWhenPackagedAppIsDirectlyLaunched();
  } else {
    throw new Error(`Either "Dev" or "Prod" needs to be specified for "devOrProd" in "config" in package.json, but the specified value is "${devOrProdInPackageJson}".`);
  }
}

function determineDevOrProdWhenPackagedAppIsDirectlyLaunched(): DevOrProdType {
  const appVersion = RequireFromMainProcess?.electron?.app?.getVersion();
  Logger.info(`Application version to determine DevOrProd: ${appVersion}`);
  if (!appVersion) {
    throw new Error(`"devOrProd" in "config" in package.json is falsy. Also, the application version is falsy. Something went wrong.`);
  }

  const isAlphaVersion = appVersion.toLowerCase().includes('alpha');
  Logger.info(`Is alpha version? : ${isAlphaVersion}`);
  return isAlphaVersion ? 'Dev' : 'Prod';
}

const devOrProd = determineDevOrProd();
Logger.info(`Determined DevOrProd: ${devOrProd}`);

export class DevOrProd {
  public static toString(): DevOrProdType {
    return devOrProd;
  }

  public static get isDev(): boolean {
    return devOrProd === 'Dev';
  }

  public static get isProd(): boolean {
    return devOrProd === 'Prod';
  }
}
