import { Logger } from '../log/logger.js';
import { ProcessIdentifier } from '../process/process-identifier.js';
import { startupMetadata } from '../startup/startup-metadata.js';

export type DevOrProdType = 'Dev' | 'Prod';

/**
 * Whether this is a development run or a production one: package.json says so under npm, a packaged app is 'Prod', and
 * a renderer takes the main process's answer.
 */
function determineDevOrProd(): DevOrProdType {
  // A renderer takes what the main process determined: the main window's page has no environment variables.
  if (ProcessIdentifier.isElectronRenderer)
    return startupMetadata().devOrProd;

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
    return 'Prod';
  } else {
    throw new Error(`Either "Dev" or "Prod" needs to be specified for "devOrProd" in "config" in package.json, but the specified value is "${devOrProdInPackageJson}".`);
  }
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
