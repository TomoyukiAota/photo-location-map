const fs = require('fs');
const logger = require('../util/logger');
const testInfo = require('./package-test-info');

function removePreviousPackageTestOutcomes() {
  logger.info(`Removing the outcomes of the previous run of the package test ("${testInfo.distDirectory}" and "${testInfo.releaseDirectory}" directories) if they exist.`);

  fs.rmdirSync(testInfo.distDirectory, {recursive: true, maxRetries: 10});
  if (fs.existsSync(testInfo.distDirectory)) {
    throw new Error(`"${testInfo.distDirectory}" still exists after trying to remove it. Aborting package test.`);
  }

  fs.rmdirSync(testInfo.releaseDirectory, {recursive: true, maxRetries: 10});
  if (fs.existsSync(testInfo.releaseDirectory)) {
    throw new Error(`"${testInfo.releaseDirectory}" still exists after trying to remove it. Aborting package test.`);
  }

  logger.info(`"${testInfo.distDirectory}" and "${testInfo.releaseDirectory}" directories do not exist. Proceeding to the next step of the package test.`);
}

module.exports = removePreviousPackageTestOutcomes;
