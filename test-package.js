console.log(`Start of "${__filename}"`);

const child_process = require("child_process");

function getTestInfo() {
    switch(process.platform) {
        case "win32":
            return {
                executableCreationCommand: "npm run electron:windows",
                executablePath: "./release/angular-electron 0.0.1.exe"
            };
        case "darwin":
            return {
                executableCreationCommand: "npm run electron:mac",
                executablePath: "./release/angular-electron 0.0.1.exe"
            };
        case "linux":
            return {
                executableCreationCommand: "npm run electron:linux",
                executablePath: "./release/angular-electron 0.0.1.exe"
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
    const releaseDirectory = './release/';
    const fs = require('fs'); 
    fs.readdirSync(releaseDirectory).forEach(file => {
      console.log(file);
    })
}

function launchExecutable(testInfo) {
    console.log(`Launch "${testInfo.executablePath}"`);
    child_process.execFile(testInfo.executablePath);
}

function runPackageTest() {
    const testInfo = getTestInfo();
    createExecutable(testInfo);
    printItemsInReleaseDirectory();
    launchExecutable(testInfo);
}

runPackageTest();

console.log(`End of "${__filename}"`);
