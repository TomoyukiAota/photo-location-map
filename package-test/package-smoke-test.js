const child_process = require("child_process");
const fs = require('fs');
const os = require('os');
const path = require('path');
const _ = require('lodash');
const logger = require('./package-test-logger');
const testInfo = require('./package-test-info');
const testUtil = require('./package-test-util');

class PackageSmokeTest {
  async launchExecutable() {
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

    await new Promise(resolve => setTimeout(resolve, executionTime));
    const kill = require('tree-kill');
    kill(executableProcess.pid);
    logger.info('Finished running the executable.');
  }

  getMostRecentLogFilePath() {
    const logFileNames = fs.readdirSync(testInfo.logDirectory)
                           .filter(fileName => fileName.endsWith('_log.txt'));

    if (logFileNames.length === 0) {
      const errorMessage = 'Log file (*_log.txt) is not found.';
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    const logFilePaths = logFileNames.map(fileName => path.join(testInfo.logDirectory, fileName));
    const mostRecentLogFilePath = _.maxBy(logFilePaths, filePath => fs.statSync(filePath).ctime);
    return mostRecentLogFilePath;
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
    testUtil.printItemsInDirectory(testInfo.logDirectory);
    const mostRecentLogFilePath = this.getMostRecentLogFilePath();
    logger.info(`Most recent log file: ${path.basename(mostRecentLogFilePath)}`);
    logger.info(`Content of the most recent log file:`)
    const content = fs.readFileSync(mostRecentLogFilePath, 'utf8');
    this.printFileContent(content);
    this.testLogFileConent(content);
  }

  async run() {
    logger.info('Start of package smoke test.');
    await this.launchExecutable();
    this.testLog();
    logger.info('End of package smoke test.');
  }
}

module.exports = new PackageSmokeTest();
