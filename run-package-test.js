console.log(`Start of "${__filename}"`);

const child_process = require("child_process");

const releaseDirectory = './release';

function getTestInfo() {
    switch(process.platform) {
        case "win32":
            return {
                executableCreationCommand: "npm run electron:windows",
                executableLaunchCommand: `${releaseDirectory}/angular-electron 0.0.1.exe`
            };
        case "darwin":
            return {
                executableCreationCommand: "npm run electron:mac",
                executableLaunchCommand: `hdiutil attach ${releaseDirectory}/angular-electron-0.0.1.dmg && open -W "/Volumes/angular-electron 0.0.1/angular-electron.app"`
            };
        case "linux":
            return {
                executableCreationCommand: "npm run electron:linux",
                executableLaunchCommand: `${releaseDirectory}/angular-electron 0.0.1.ex`
            };
        default:
            throw new Error(`Unsupported platform for "${__filename}"`);
    }
}

function createExecutable(testInfo) {
    console.log(`Start of "${testInfo.executableCreationCommand}"`);
    const stdout = child_process.execSync(testInfo.executableCreationCommand);
    console.log(stdout.toString())
    console.log(`End of "${testInfo.executableCreationCommand}"`);
}

function printItemsInReleaseDirectory() {
    console.log("-----------------------------------------------");
    console.log(`Following items exist in "${releaseDirectory}":`)
    const fs = require('fs');
    fs.readdirSync(releaseDirectory).forEach(file => {
      console.log(`  ${file}`);
    })
    console.log("-----------------------------------------------");
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
    createExecutable(testInfo);
    printItemsInReleaseDirectory();
    await launchExecutable(testInfo);
}

runPackageTest()
.then(() => {
    console.log(`End of "${__filename}"`);
}).catch((reason) => {
    console.error(reason)
    console.error(`End of "${__filename}" with some errors.`);
});
