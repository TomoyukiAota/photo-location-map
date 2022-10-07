const child_process = require('child_process');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const logger = require('../util/logger');
const runCommandSync = require('../util/run-command-sync');
const testInfo = require('./package-test-info');
const testUtil = require('./package-test-util');

class PackageSmokeTest {
  emptyLogDirectory() {
    logger.info('To test the log file created by the application, there needs to be no log files (*_log.txt) in the log directory before running the application.');
    logger.info(`Searching the log directory "${testInfo.logDirectory}"`);
    testUtil.printItemsInDirectory(testInfo.logDirectory);
    logger.info('Removing all files in the log directory...');
    fs.emptyDirSync(testInfo.logDirectory);
    testUtil.printItemsInDirectory(testInfo.logDirectory);
    const logFiles = fs.readdirSync(testInfo.logDirectory)
                       .filter(fileName => fileName.endsWith('_log.txt'));
    if (logFiles.length === 0) {
      logger.info('There is no log file (*_log.txt). Proceeding to the next step of the smoke test.');
    } else {
      const message = 'Log file(s) (*_log.txt) still exist. Aborting the smoke test.';
      logger.error(message);
      throw new Error(message);
    }
  }

  runExecutablePrelaunchCommand() {
    const command = testInfo.executablePrelaunchCommand;
    if(command) {
      runCommandSync(
        command,
        `Start of executable prelaunch command: "${command}"`,
        `End of executable prelaunch command: "${command}"`
      );
    } else {
      logger.info('No executable prelaunch command on this platform.');
    }
  }

  shouldRetry = false;
  retryCount = 0;
  maxRetryCount = 5;

  decideWhetherToRetry(data) {
    const isMacOs = global.process.platform === 'darwin';
    if (isMacOs) {
      const intermittentErrorMessageOnMacOs = 'The application cannot be opened for an unexpected reason, error=Error Domain=NSOSStatusErrorDomain Code=-10827 "kLSNoExecutableErr: The executable is missing"';
      this.shouldRetry = !!data?.toString?.()?.includes?.(intermittentErrorMessageOnMacOs);
      if (this.shouldRetry) {
        logger.warn('The intermittent error message on macOS is observed.');
      }
    }
  }

  handleExecutableProcessStderr(data) {
    logger.warn(`stderr: ${data}`);
    this.decideWhetherToRetry(data);
  }

  handleExecutableProcessError(error) {
    logger.error(`Failed to start ${testInfo.executableLaunchCommand}`);
    logger.error(error);
    throw error;
  }

  async runExecutable() {
    const executionTime = 30000;
    logger.info(`Launch executable and let it run for ${executionTime} ms.`);
    logger.info(`Executable Launch Command: "${testInfo.executableLaunchCommand}"`);

    do {
      this.shouldRetry = false;

      const executableProcess = child_process.spawn(testInfo.executableLaunchCommand, [], { shell: true });
      executableProcess.stdout.on('data', data => logger.info(`stdout: ${data}`));
      executableProcess.stderr.on('data', data => this.handleExecutableProcessStderr(data));
      executableProcess.on('close', code => logger.info(`"${testInfo.executableLaunchCommand}" is terminated.`));
      executableProcess.on('error', error => this.handleExecutableProcessError(error));

      await new Promise(resolve => setTimeout(resolve, executionTime));
      require('tree-kill')(executableProcess.pid);

      if (this.retryCount > this.maxRetryCount) {
        logger.error('Retry count exceeded the maximum for the executable launch command.');
        this.shouldRetry = false;
      }
      if (this.shouldRetry) {
        logger.info('Retrying the executable launch command because the intermittent error message on macOS was observed.');
        this.retryCount++;
        logger.info(`Executable Launch Command Retry Count: ${this.retryCount}`);
      }
    } while (this.shouldRetry);

    logger.info('End of PackageSmokeTest::runExecutable function.');
  }

  getLogFileName() {
    const logFileNames = fs.readdirSync(testInfo.logDirectory)
                           .filter(fileName => fileName.endsWith('_log.txt'));

    switch(logFileNames.length) {
      case 0: {
        const errorMessage = 'Log file (*_log.txt) is not found.';
        logger.error(errorMessage);
        throw new Error(errorMessage);
      }
      case 1: {
        return logFileNames[0];
      }
      default: { // Case of more than 1 log files
        const errorMessage = 'There are more than 1 log files (*_log.txt).';
        logger.error(errorMessage);
        throw new Error(errorMessage);
      }
    }
  }

  printFileContent(content) {
    console.info('----------------------------------------------');
    content.split(os.EOL)
           .map(line => `    ${line}`)
           .forEach(line => console.info(line));
    console.info('----------------------------------------------');
  }

  testLogFileContent(content) {
    const lines = content.split(os.EOL);
    const isMainProcessLogFound = lines.some(line => line.includes('[Main]'));
    const isRendererProcessLogFound = lines.some(line => line.includes('[Renderer]'));

    logger.info(`Is "[Main]" logged?: ${isMainProcessLogFound}`);
    logger.info(`Is "[Renderer]" logged?: ${isRendererProcessLogFound}`);

    const isTestPass = isMainProcessLogFound && isRendererProcessLogFound;
    if (isTestPass) {
      logger.info('Both "[Main]" and "[Renderer]" are logged at least once.');
      logger.info('Log file content is OK.');
    } else {
      logger.error('"[Main]" and/or "[Renderer]" is not logged.');
      logger.error('Log file content test failed.');
      throw new Error('Log file content test failed.');
    }
  }

  testLog() {
    logger.info(`Searching the log directory "${testInfo.logDirectory}"`);
    testUtil.printItemsInDirectory(testInfo.logDirectory);
    const logFileName = this.getLogFileName();
    logger.info(`Log file to test: ${logFileName}`);

    logger.info('Content of the log file:');
    const logFilePath = path.join(testInfo.logDirectory, logFileName);
    const content = fs.readFileSync(logFilePath, 'utf8');
    this.printFileContent(content);

    this.testLogFileContent(content);
  }

  async run() {
    logger.info('Start of package smoke test.');
    this.emptyLogDirectory();
    this.runExecutablePrelaunchCommand();
    await this.runExecutable();
    this.testLog();
    logger.info('End of package smoke test.');
  }
}

module.exports = new PackageSmokeTest();
