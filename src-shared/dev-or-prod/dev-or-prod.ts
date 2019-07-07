import { Logger } from '../log/logger';

export type DevOrProd = 'Dev' | 'Prod';

const fetchDevOrProdFromConfig: (() => DevOrProd) = () => {
  // devOrProdFromConfig is set from "config" property in package.json
  // Also, package.json does not exist in the packaged application.
  // This means the followings:
  //  - If npm script launches non-packaged application (e.g. npm start), devOrProdFromConfig is set.
  //  - If npm script launches packaged application (i.e. package-test), devOrProdFromConfig is set.
  //  - If packaged application is directly launched (i.e. publicly released application), devOrProdFromConfig is not set (undefined).
  const devOrProdFromConfig = process.env.npm_package_config_devOrProd as DevOrProd;

  Logger.info(`DevOrProd from "config" property in package.json: ${devOrProdFromConfig}`);

  if (devOrProdFromConfig === 'Dev') {
    return 'Dev';
  } else if (devOrProdFromConfig === 'Prod') {
    return  'Prod';
  } else if (!devOrProdFromConfig) {
    return 'Prod';
  } else {
    throw new Error(`Either "Dev" or "Prod" needs to be specified "config" property in package.json. Currently, it is "${devOrProdFromConfig}".`);
  }
};

const devOrProd = fetchDevOrProdFromConfig();
Logger.info(`Determined DevOrProd: ${devOrProd}`);

export const getDevOrProd: (() => DevOrProd) = () => {
  return devOrProd;
};
