const fs = require('fs');
const os = require('os');
const path = require('path');

// PackageSmokeTest clears logs and starts an installed application. Give both
// the runner and the application a dedicated profile before loading testInfo.
process.env.PLM_TEST_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-package-test-'));

const logger = require('../util/logger');
const removePreviousPackageTestOutcomes = require('./remove-previous-package-test-outcomes');
const packageCreationTest = require('./package-creation-test');
const packageSmokeTest = require('./package-smoke-test');


logger.info(`Running "${__filename}"`);
logger.info('Start of package test.');

async function runPackageTest() {
  removePreviousPackageTestOutcomes();
  packageCreationTest.run();
  await packageSmokeTest.run();
}

runPackageTest()
.then(() => {
  logger.info('End of package test.');
  process.exitCode = 0;
}).catch(reason => {
  logger.error(reason);
  logger.error('End of package test with some errors.');
  process.exitCode = 1;
});
