console.log(`Start of "${__filename}"`);

const child_process = require("child_process");

const releaseDirectory = './release';

function getTestInfo() {
    switch(process.platform) {
        case "win32":
            return {
                executableCreationCommand: "npm run electron:windows",
                executablePath: `${releaseDirectory}/angular-electron 0.0.1.ex`
            };
        case "darwin":
            return {
                executableCreationCommand: "npm run electron:mac",
                executablePath: `${releaseDirectory}/angular-electron 0.0.1.ex`
            };
        case "linux":
            return {
                executableCreationCommand: "npm run electron:linux",
                executablePath: `${releaseDirectory}/angular-electron 0.0.1.ex`
            };
        default:
            throw new Error("Unsupported platform for test-package.js");
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
    console.log(`Launch "${testInfo.executablePath}" and let it run for ${executionTime} ms.`);
    const executableProcess = child_process.spawn(testInfo.executablePath);

    executableProcess.stdout.on('data', function(data){
        console.log(`stdout: ${data}`);
    });

    executableProcess.stderr.on('data', function(data){
        console.error(`stderr: ${data}`);
    });

    executableProcess.on('error', (err) => {
        console.error(`Failed to start ${testInfo.executablePath}`);
        console.error(err);
        throw err;
    });

    executableProcess.on('close', (code) => {
        console.log(`"${testInfo.executablePath}" is manually killed.`);
    });

    setTimeout(() => {
        const kill  = require('tree-kill');
        kill(executableProcess.pid);
    }, executionTime);
}

function runPackageTest() {
    const testInfo = getTestInfo();
    createExecutable(testInfo);
    printItemsInReleaseDirectory();
    launchExecutable(testInfo);
}

runPackageTest();

console.log(`End of "${__filename}"`);
