const path = require('path');
const { version } = require('../package.json');
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
        this.expectedPackageLocation = `${this.releaseDirectory}\\Photo Location Map ${version}.exe`;
        this.executableLaunchCommand = `"${this.releaseDirectory}\\Photo Location Map ${version}.exe"`;
        break;
      case 'darwin':
        this.packageCreationCommand = 'npm run electron:mac';
        this.expectedPackageLocation = `${this.releaseDirectory}/Photo Location Map-${version}.dmg`;
        this.executableLaunchCommand = `hdiutil attach "${this.releaseDirectory}/Photo Location Map-${version}.dmg" && open -W "/Volumes/Photo Location Map ${version}/Photo Location Map.app"`;
        break;
      case 'linux':
        this.packageCreationCommand = 'npm run electron:linux';
        this.expectedPackageLocation = `${this.releaseDirectory}/Photo Location Map-${version}.AppImage`;
        this.executableLaunchCommand = `"${this.releaseDirectory}/Photo Location Map-${version}.AppImage"`;
        break;
      default:
        throw new Error(`Unsupported platform for "${__filename}"`);
    }
  }
}

module.exports = new PackageTestInfo();
