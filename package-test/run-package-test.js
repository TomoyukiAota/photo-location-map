const child_process = require("child_process");
const packageCreationTest = require('./package-creation-test');
const logger = require('./package-test-logger');
const testInfo = require('./package-test-info');
const testUtil = require('./package-test-util');


logger.info(`Start of "${__filename}"`);

function launchExecutable() {
  const executionTime = 30000;
  logger.info(`Launch executable and let it run for ${executionTime} ms.`);
  logger.info(`Executable Launch Command: "${testInfo.executableLaunchCommand}"`)
  const executableProcess = child_process.spawn(testInfo.executableLaunchCommand, [], { shell: true });

  executableProcess.stdout.on('data', function(data){
    logger.info(`stdout: ${data}`);
  });

  executableProcess.stderr.on('data', function(data){
    logger.warn(`stderr: ${data}`);
  });

  executableProcess.on('error', (err) => {
    logger.error(`Failed to start ${testInfo.executableLaunchCommand}`);
    logger.error(err);
    throw err;
  });

  executableProcess.on('close', (code) => {
    logger.info(`"${testInfo.executableLaunchCommand}" is terminated.`);
  });

  return new Promise(resolve => setTimeout(resolve, executionTime))
    .then(() => {
      const kill  = require('tree-kill');
      kill(executableProcess.pid);
      logger.info('Finished running the executable.');
    });
}

function testLog() {
  testUtil.printItemsInDirectory(testInfo.logDirectory);
}

async function runPackageTest() {
  packageCreationTest.run();
  await launchExecutable();
  testLog();
}

runPackageTest()
.then(() => {
  logger.info(`End of "${__filename}"`);
  process.exitCode = 0;
}).catch((reason) => {
  logger.error(reason)
  logger.error(`End of "${__filename}" with some errors.`);
  process.exitCode = 1;
});
