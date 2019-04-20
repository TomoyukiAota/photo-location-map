const child_process = require("child_process");
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const _ = require('lodash');
const logger = require('./package-test-logger');
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

  async runExecutable() {
    const executionTime = 30000;
    logger.info(`Launch executable and let it run for ${executionTime} ms.`);
    logger.info(`Executable Launch Command: "${testInfo.executableLaunchCommand}"`)
    const executableProcess = child_process.spawn(testInfo.executableLaunchCommand, [], { shell: true });

    executableProcess.stdout.on('data', data => logger.info(`stdout: ${data}`));
    executableProcess.stderr.on('data', data => logger.warn(`stderr: ${data}`));
    executableProcess.on('close', code => logger.info(`"${testInfo.executableLaunchCommand}" is terminated.`));

    executableProcess.on('error', error => {
      logger.error(`Failed to start ${testInfo.executableLaunchCommand}`);
      logger.error(error);
      throw error;
    });

    await new Promise(resolve => setTimeout(resolve, executionTime));
    require('tree-kill')(executableProcess.pid);
    logger.info('Finished running the executable.');
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

  testLogFileConent(content) {
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

    logger.info(`Content of the log file:`);
    const logFilePath = path.join(testInfo.logDirectory, logFileName);
    const content = fs.readFileSync(logFilePath, 'utf8');
    this.printFileContent(content);

    this.testLogFileConent(content);
  }

  async run() {
    logger.info('Start of package smoke test.');
    this.emptyLogDirectory();
    await this.runExecutable();
    this.testLog();
    logger.info('End of package smoke test.');
  }
}

module.exports = new PackageSmokeTest();
