const { notarize } = require('electron-notarize');
const logger = require('../util/logger');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  const appName = context.packager.appInfo.productFilename;

  const isMac = electronPlatformName === 'darwin';
  if (!isMac) {
    logger.info('Notarization is skipped on OSs other than macOS.');
    return;
  }

  const isPackageTest = !!process.env.PLM_PACKAGE_TEST;
  if (isPackageTest) {
    logger.info('Notarization is skipped in package test.');
    return;
  }

  logger.info('Started notarization.');
  await notarize({
    appBundleId: 'com.TomoyukiAota.PhotoLocationMap',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
  });
  logger.info('Finished notarization.');
};
