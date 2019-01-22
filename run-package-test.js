
const child_process = require("child_process");
const fs = require('fs');
const moment = require('moment-timezone');

class Logger
{
    static dateTime() {
        return moment.utc().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
    }

    static log(message) {
        console.log(`[${this.dateTime()}] [log] ${message}`);
    }

    static error(message) {
        console.error(`[${this.dateTime()}] [error] ${message}`);
    }
}

Logger.log(`Start of "${__filename}"`);

const releaseDirectory = './release';

function getTestInfo() {
    switch(process.platform) {
        case "win32":
            return {
                packageCreationCommand: "npm run electron:windows",
                expectedPackageLocation: `${releaseDirectory}/angular-electron 0.0.1.exe-foobar`,
                executableLaunchCommand: `"${releaseDirectory}/angular-electron 0.0.1.exe"`
            };
        case "darwin":
            return {
                packageCreationCommand: "npm run electron:mac",
                expectedPackageLocation: `${releaseDirectory}/angular-electron-0.0.1.dmg-foobar`,
                executableLaunchCommand: `hdiutil attach ${releaseDirectory}/angular-electron-0.0.1.dmg && open -W "/Volumes/angular-electron 0.0.1/angular-electron.app"`
            };
        case "linux":
            return {
                packageCreationCommand: "npm run electron:linux",
                expectedPackageLocation: `${releaseDirectory}/photo-location-map-0.0.1-x86_64.AppImage-foobar`,
                executableLaunchCommand: `${releaseDirectory}/photo-location-map-0.0.1-x86_64.AppImage`
            };
        default:
            throw new Error(`Unsupported platform for "${__filename}"`);
    }
}

function createPackage(testInfo) {
    Logger.log(`Start of "${testInfo.packageCreationCommand}"`);
    const stdout = child_process.execSync(testInfo.packageCreationCommand);
    Logger.log(stdout.toString())
    Logger.log(`End of "${testInfo.packageCreationCommand}"`);
}

function printItemsInReleaseDirectory() {
    Logger.log("-----------------------------------------------");
    Logger.log(`Following items exist in "${releaseDirectory}":`)
    fs.readdirSync(releaseDirectory).forEach(file => {
      Logger.log(`  ${releaseDirectory}/${file}`);
    })
    Logger.log("-----------------------------------------------");
}

function testIfPackageExists(testInfo) {
    Logger.log(`Expected Package Location: "${testInfo.expectedPackageLocation}"`);
    if (fs.existsSync(testInfo.expectedPackageLocation)) {
        Logger.log("Package exists in the expected location.");
    } else {
        const errorMessage = "Package does NOT exist in the expected location.";
        Logger.error(errorMessage);
        throw new Error(errorMessage);
    }
}

function launchExecutable(testInfo) {
    const executionTime = 30000;
    Logger.log(`Launch executable and let it run for ${executionTime} ms.`);
    Logger.log(`Executable Launch Command: "${testInfo.executableLaunchCommand}"`)
    const executableProcess = child_process.spawn(testInfo.executableLaunchCommand, [], { shell: true });

    executableProcess.stdout.on('data', function(data){
        Logger.log(`stdout: ${data}`);
    });

    executableProcess.stderr.on('data', function(data){
        Logger.error(`stderr: ${data}`);
    });

    executableProcess.on('error', (err) => {
        Logger.error(`Failed to start ${testInfo.executableLaunchCommand}`);
        Logger.error(err);
        throw err;
    });

    executableProcess.on('close', (code) => {
        Logger.log(`"${testInfo.executableLaunchCommand}" is terminated.`);
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
    Logger.log(`End of "${__filename}"`);
    process.exitCode = 0;
}).catch((reason) => {
    Logger.error(reason)
    Logger.error(`End of "${__filename}" with some errors.`);
    process.exitCode = 1;
});
