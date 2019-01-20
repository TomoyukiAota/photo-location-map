console.log(`Start of "${__filename}"`);

const child_process = require("child_process");
const fs = require('fs');

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
    console.log(`Start of "${testInfo.packageCreationCommand}"`);
    const stdout = child_process.execSync(testInfo.packageCreationCommand);
    console.log(stdout.toString())
    console.log(`End of "${testInfo.packageCreationCommand}"`);
}

function printItemsInReleaseDirectory() {
    console.log("-----------------------------------------------");
    console.log(`Following items exist in "${releaseDirectory}":`)
    fs.readdirSync(releaseDirectory).forEach(file => {
      console.log(`  ${releaseDirectory}/${file}`);
    })
    console.log("-----------------------------------------------");
}

function testIfPackageExists(testInfo) {
    console.log(`Expected Package Location: "${testInfo.expectedPackageLocation}"`);
    if (fs.existsSync(testInfo.expectedPackageLocation)) {
        console.log("Package exists in the expected location.");
    } else {
        const errorMessage = "Package does NOT exist in the expected location.";
        console.error(errorMessage);
        throw new Error(errorMessage);
    }
}

function launchExecutable(testInfo) {
    const executionTime = 30000;
    console.log(`Launch executable and let it run for ${executionTime} ms.`);
    console.log(`Executable Launch Command: "${testInfo.executableLaunchCommand}"`)
    const executableProcess = child_process.spawn(testInfo.executableLaunchCommand, [], { shell: true });

    executableProcess.stdout.on('data', function(data){
        console.log(`stdout: ${data}`);
    });

    executableProcess.stderr.on('data', function(data){
        console.error(`stderr: ${data}`);
        throw new Error(data)
    });

    executableProcess.on('error', (err) => {
        console.error(`Failed to start ${testInfo.executableLaunchCommand}`);
        console.error(err);
        throw err;
    });

    executableProcess.on('close', (code) => {
        console.log(`"${testInfo.executableLaunchCommand}" is terminated.`);
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
    console.log(`End of "${__filename}"`);
    process.exitCode = 0;
}).catch((reason) => {
    console.error(reason)
    console.error(`End of "${__filename}" with some errors.`);
    process.exitCode = 1;
});
