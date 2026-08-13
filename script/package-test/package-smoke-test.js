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

  // TL;DR:
  // There is a known issue in electron-builder (https://github.com/electron-userland/electron-builder/issues/7921)
  // that the silent installation on Windows intermittently exits with 0xC0000005 (STATUS_ACCESS_VIOLATION),
  // which is 3221225477.
  // Retrying is the workaround until the problem is fixed in electron-builder.
  // ----------------------------
  // Details:
  // The installer crashes in System.dll, which is the plugin of NSIS which electron-builder uses. According to
  // the issue above, it crashes while it resolves the per-user installation directory, which is why it happens
  // on a fresh installation. This test does a fresh installation on a clean runner every time.
  // It was observed about 20-25% of the time, and the Windows application log recorded the same faulting module
  // and the same fault offset every time, which means that it is not random memory corruption. The installation
  // directory was not created at all, so the installer does nothing before it crashes.
  // The following were ruled out by the log of the runner: Windows Defender (its real-time monitoring is
  // disabled on the runner), a leftover of a previous run in the temporary directory of NSIS plugins (only one
  // exists), and a broken System.dll (its size is the same as the one in the cache of electron-builder).
  // Updating electron-builder does not fix this, because it still uses NSIS 3.0.4.1 as of 26.15.3. Pinning a
  // newer NSIS with "customNsisBinary" does not help either, because the newest one which this version of
  // electron-builder can use is 3.0.5.0, released in 2020, before the issue above was reported.
  windowsInstallerCrashExitCode = 3221225477;
  maxPrelaunchRetryCount = 5;

  isCrashOfWindowsInstaller(error) {
    return global.process.platform === 'win32'
        && error?.status === this.windowsInstallerCrashExitCode;
  }

  runExecutablePrelaunchCommand() {
    const command = testInfo.executablePrelaunchCommand;
    if(!command) {
      logger.info('No executable prelaunch command on this platform.');
      return;
    }

    for (let retryCount = 0; retryCount <= this.maxPrelaunchRetryCount; retryCount++) {
      try {
        runCommandSync(
          command,
          `Start of executable prelaunch command: "${command}"`,
          `End of executable prelaunch command: "${command}"`
        );
        return;
      } catch (error) {
        if (this.isCrashOfWindowsInstaller(error) && retryCount < this.maxPrelaunchRetryCount) {
          logger.warn(`The installer crashed. Retrying the executable prelaunch command. Retry count: ${retryCount + 1}`);
          continue;
        }

        // The items in the installation directory are printed to see whether the installation took place
        // in spite of the failure.
        if (testInfo.installationDirectory) {
          logger.error(`Searching the installation directory "${testInfo.installationDirectory}" to investigate the failure above.`);
          testUtil.printItemsInDirectory(testInfo.installationDirectory);
        }
        throw error;
      }
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
