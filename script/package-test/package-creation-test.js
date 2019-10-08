const child_process = require('child_process');
const fs = require('fs');
const testInfo = require('./package-test-info');
const logger = require('./package-test-logger');
const testUtil = require('./package-test-util');

class PackageCreationTest {
  createPackage() {
    logger.info(`Start of "${testInfo.packageCreationCommand}" to create a package.`);
    const stdout = child_process.execSync(testInfo.packageCreationCommand);
    logger.info(stdout.toString());
    logger.info(`End of "${testInfo.packageCreationCommand}"`);
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
