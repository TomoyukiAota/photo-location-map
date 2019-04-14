const child_process = require("child_process");
const logger = require('./package-test-logger');
const testInfo = require('./package-test-info');
const testUtil = require('./package-test-util');

class PackageSmokeTest {
  launchExecutable() {
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

  testLog() {
    testUtil.printItemsInDirectory(testInfo.logDirectory);
  }

  async run() {
    await this.launchExecutable();
    this.testLog();
  }
}

module.exports = new PackageSmokeTest();
