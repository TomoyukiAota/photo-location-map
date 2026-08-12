const fs = require('fs');
const logger = require('../util/logger');
const runCommandSync = require('../util/run-command-sync');
const testInfo = require('./package-test-info');
const testUtil = require('./package-test-util');

class PackageCreationTest {
  createPackage() {
    runCommandSync(
      testInfo.packageCreationCommand,
      `Start of "${testInfo.packageCreationCommand}" to create a package.`,
      `End of "${testInfo.packageCreationCommand}"`
    );
  }

  testIfPackagesExist() {
    testUtil.printItemsInDirectory(testInfo.releaseDirectory);
    testInfo.expectedPackageLocations.forEach(expectedPackageLocation => {
      logger.info(`Expected Package Location: "${expectedPackageLocation}"`);
      if (fs.existsSync(expectedPackageLocation)) {
        logger.info('Package exists in the expected location.');
      } else {
        const errorMessage = `Package does NOT exist in the expected location "${expectedPackageLocation}".`;
        logger.error(errorMessage);
        throw new Error(errorMessage);
      }
    });
  }

  run() {
    logger.info('Start of package creation test.');
    this.createPackage();
    this.testIfPackagesExist();
    logger.info('End of package creation test.');
  }
}

module.exports = new PackageCreationTest();
