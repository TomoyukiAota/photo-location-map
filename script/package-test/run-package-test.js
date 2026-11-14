import fs from 'fs';
import os from 'os';
import path from 'path';

// PackageSmokeTest clears logs and starts an installed application. Give both
// the runner and the application a dedicated profile before loading testInfo.
// A caller-supplied root belongs to the caller and must survive this runner.

/**
 * Runs the package test, and sets the exit code of `runnerProcess`.
 * @param {object} [dependencies] What test/package-test/run.mjs replaces. The modules of the test are imported with
 *   `importModule` once the profile is set, as they read it when they are loaded.
 */
export async function runPackageTest({
  runnerProcess = process, fileSystem = fs, temporaryDirectory = os.tmpdir(), importModule = specifier => import(specifier),
} = {}) {
  const ownedTestRoot = runnerProcess.env.PLM_TEST_ROOT ? undefined : fileSystem.mkdtempSync(path.join(temporaryDirectory, 'plm-package-test-'));
  if (ownedTestRoot) runnerProcess.env.PLM_TEST_ROOT = ownedTestRoot;

  const { default: logger } = await importModule('../util/logger.js');
  try {
    const { default: removePreviousPackageTestOutcomes } = await importModule('./remove-previous-package-test-outcomes.js');
    const { default: packageCreationTest } = await importModule('./package-creation-test.js');
    const { default: packageSmokeTest } = await importModule('./package-smoke-test.js');

    logger.info(`Running "${import.meta.filename}"`);
    logger.info('Start of package test.');
    removePreviousPackageTestOutcomes();
    packageCreationTest.run();
    await packageSmokeTest.run();
    logger.info('End of package test.');
    runnerProcess.exitCode = 0;
  } catch (reason) {
    logger.error(reason);
    logger.error('End of package test with some errors.');
    runnerProcess.exitCode = 1;
  } finally {
    if (ownedTestRoot) {
      try {
        fileSystem.rmSync(ownedTestRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
      } catch (error) {
        logger.warn(`Could not remove the temporary package-test profile: ${error.message}`);
      }
    }
  }
}

// Run by `npm run test:package`; test/package-test/run.mjs imports it.
if (import.meta.main) await runPackageTest();
