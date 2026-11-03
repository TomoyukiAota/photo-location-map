const fs = require('fs');
const os = require('os');
const path = require('path');

// PackageSmokeTest clears logs and starts an installed application. Give both
// the runner and the application a dedicated profile before loading testInfo.
// A caller-supplied root belongs to the caller and must survive this runner.
const ownedTestRoot = process.env.PLM_TEST_ROOT ? undefined : fs.mkdtempSync(path.join(os.tmpdir(), 'plm-package-test-'));
if (ownedTestRoot) process.env.PLM_TEST_ROOT = ownedTestRoot;

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
}).finally(() => {
  if (!ownedTestRoot) return;
  try {
    fs.rmSync(ownedTestRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  } catch (error) {
    logger.warn(`Could not remove the temporary package-test profile: ${error.message}`);
  }
});
