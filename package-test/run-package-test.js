const child_process = require("child_process");
const fs = require('fs');
const logger = require('./package-test-logger');


logger.info(`Start of "${__filename}"`);

const releaseDirectory = './release';

function getTestInfo() {
  switch(process.platform) {
    case "win32":
      return {
        packageCreationCommand: "npm run electron:windows",
        expectedPackageLocation: `${releaseDirectory}/angular-electron 0.0.1.exe`,
        executableLaunchCommand: `"${releaseDirectory}/angular-electron 0.0.1.exe"`
      };
    case "darwin":
      return {
        packageCreationCommand: "npm run electron:mac",
        expectedPackageLocation: `${releaseDirectory}/angular-electron-0.0.1.dmg`,
        executableLaunchCommand: `hdiutil attach ${releaseDirectory}/angular-electron-0.0.1.dmg && open -W "/Volumes/angular-electron 0.0.1/angular-electron.app"`
      };
    case "linux":
      return {
        packageCreationCommand: "npm run electron:linux",
        expectedPackageLocation: `${releaseDirectory}/angular-electron 0.0.1.AppImage`,
        executableLaunchCommand: `${releaseDirectory}/angular-electron 0.0.1.AppImage`
      };
    default:
      throw new Error(`Unsupported platform for "${__filename}"`);
  }
}

function createPackage(testInfo) {
  logger.info(`Start of "${testInfo.packageCreationCommand}"`);
  const stdout = child_process.execSync(testInfo.packageCreationCommand);
  logger.info(stdout.toString())
  logger.info(`End of "${testInfo.packageCreationCommand}"`);
}

function printItemsInReleaseDirectory() {
  logger.info("-----------------------------------------------");
  logger.info(`Following items exist in "${releaseDirectory}":`)
  fs.readdirSync(releaseDirectory).forEach(file => {
    logger.info(`  ${releaseDirectory}/${file}`);
  })
  logger.info("-----------------------------------------------");
}

function testIfPackageExists(testInfo) {
  logger.info(`Expected Package Location: "${testInfo.expectedPackageLocation}"`);
  if (fs.existsSync(testInfo.expectedPackageLocation)) {
    logger.info("Package exists in the expected location.");
  } else {
    const errorMessage = "Package does NOT exist in the expected location.";
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}

function launchExecutable(testInfo) {
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
    });
}

async function runPackageTest() {
  const testInfo = getTestInfo();
  createPackage(testInfo);
  printItemsInReleaseDirectory();
  testIfPackageExists(testInfo);
  await launchExecutable(testInfo);
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
