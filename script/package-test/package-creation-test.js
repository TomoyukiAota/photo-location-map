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

  testIfPackageExists() {
    testUtil.printItemsInDirectory(testInfo.releaseDirectory);
    logger.info(`Expected Package Location: "${testInfo.expectedPackageLocation}"`);
    if (fs.existsSync(testInfo.expectedPackageLocation)) {
      logger.info('Package exists in the expected location.');
    } else {
      const errorMessage = 'Package does NOT exist in the expected location.';
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  run() {
    logger.info('Start of package creation test.');
    this.createPackage();
    this.testIfPackageExists();
    logger.info('End of package creation test.');
  }
}

module.exports = new PackageCreationTest();
