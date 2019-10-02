const path = require('path');
const appVersion = require('../package').version;
const getLogDirectory = require('./get-log-directory');

class PackageTestInfo {
  constructor() {
    this.releaseDirectory = `.${path.sep}release`;
    this.logDirectory = getLogDirectory();
    this.addMiscPlatformDependentProperties();
  }

  addMiscPlatformDependentProperties() {
    switch(global.process.platform) {
      case 'win32':
        this.packageCreationCommand = 'npm run electron:windows';
        this.expectedPackageLocation = `${this.releaseDirectory}\\Photo Location Map ${appVersion}.exe`;
        this.executableLaunchCommand = `"${this.releaseDirectory}\\Photo Location Map ${appVersion}.exe"`;
        break;
      case 'darwin':
        this.packageCreationCommand = 'npm run electron:mac';
        this.expectedPackageLocation = `${this.releaseDirectory}/Photo Location Map-${appVersion}.dmg`;
        this.executableLaunchCommand = `hdiutil attach "${this.releaseDirectory}/Photo Location Map-${appVersion}.dmg" && open -W "/Volumes/Photo Location Map ${appVersion}/Photo Location Map.app"`;
        break;
      case 'linux':
        this.packageCreationCommand = 'npm run electron:linux';
        this.expectedPackageLocation = `${this.releaseDirectory}/Photo Location Map-${appVersion}.AppImage`;
        this.executableLaunchCommand = `"${this.releaseDirectory}/Photo Location Map-${appVersion}.AppImage"`;
        break;
      default:
        throw new Error(`Unsupported platform for "${__filename}"`);
    }
  }
}

module.exports = new PackageTestInfo();
