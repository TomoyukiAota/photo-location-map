const child_process = require("child_process");
const fs = require('fs');
const moment = require('moment-timezone');

class Logger
{
    static dateTime() {
        return moment.utc().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
    }

    static error(message) {
        console.error(`[${this.dateTime()}] [error] ${message}`);
    }

    static warn(message) {
        console.warn(`[${this.dateTime()}] [warn] ${message}`);
    }

    static info(message) {
        console.info(`[${this.dateTime()}] [info] ${message}`);
    }
}

Logger.info(`Start of "${__filename}"`);

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
                expectedPackageLocation: `${releaseDirectory}/photo-location-map-0.0.1-x86_64.AppImage`,
                executableLaunchCommand: `${releaseDirectory}/photo-location-map-0.0.1-x86_64.AppImage`
            };
        default:
            throw new Error(`Unsupported platform for "${__filename}"`);
    }
}

function createPackage(testInfo) {
    Logger.info(`Start of "${testInfo.packageCreationCommand}"`);
    const stdout = child_process.execSync(testInfo.packageCreationCommand);
    Logger.info(stdout.toString())
    Logger.info(`End of "${testInfo.packageCreationCommand}"`);
}

function printItemsInReleaseDirectory() {
    Logger.info("-----------------------------------------------");
    Logger.info(`Following items exist in "${releaseDirectory}":`)
    fs.readdirSync(releaseDirectory).forEach(file => {
      Logger.info(`  ${releaseDirectory}/${file}`);
    })
    Logger.info("-----------------------------------------------");
}

function testIfPackageExists(testInfo) {
    Logger.info(`Expected Package Location: "${testInfo.expectedPackageLocation}"`);
    if (fs.existsSync(testInfo.expectedPackageLocation)) {
        Logger.info("Package exists in the expected location.");
    } else {
        const errorMessage = "Package does NOT exist in the expected location.";
        Logger.error(errorMessage);
        throw new Error(errorMessage);
    }
}

function launchExecutable(testInfo) {
    const executionTime = 30000;
    Logger.info(`Launch executable and let it run for ${executionTime} ms.`);
    Logger.info(`Executable Launch Command: "${testInfo.executableLaunchCommand}"`)
    const executableProcess = child_process.spawn(testInfo.executableLaunchCommand, [], { shell: true });

    executableProcess.stdout.on('data', function(data){
        Logger.info(`stdout: ${data}`);
    });

    executableProcess.stderr.on('data', function(data){
        Logger.warn(`stderr: ${data}`);
    });

    executableProcess.on('error', (err) => {
        Logger.error(`Failed to start ${testInfo.executableLaunchCommand}`);
        Logger.error(err);
        throw err;
    });

    executableProcess.on('close', (code) => {
        Logger.info(`"${testInfo.executableLaunchCommand}" is terminated.`);
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
    Logger.info(`End of "${__filename}"`);
    process.exitCode = 0;
}).catch((reason) => {
    Logger.error(reason)
    Logger.error(`End of "${__filename}" with some errors.`);
    process.exitCode = 1;
});
