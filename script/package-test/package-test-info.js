const path = require('path');
const { version } = require('../../package.json');
const getLogDirectory = require('./get-log-directory');

class PackageTestInfo {
  constructor() {
    this.distDirectory = `.${path.sep}dist`;
    this.releaseDirectory = `.${path.sep}release`;
    this.logDirectory = getLogDirectory();
    this.addMiscPlatformDependentProperties();
  }

  addMiscPlatformDependentProperties() {
    // electron-builder appends the arch to the package name, except when the target arch is the default arch (x64).
    // Note that this assumes x64 or arm64. electron-builder can use different names for other arches (e.g. ia32, armv7l).
    const archSuffix = global.process.arch === 'x64' ? '' : `-${global.process.arch}`;

    switch(global.process.platform) {
      case 'win32':
        this.packageCreationCommand = 'npm run package:windows';
        this.expectedPackageLocation = `${this.releaseDirectory}\\Photo Location Map Setup ${version}.exe`;
        this.executablePrelaunchCommand = `"${this.releaseDirectory}\\Photo Location Map Setup ${version}.exe" /S`;
        this.executableLaunchCommand = `"${process.env.APPDATA}\\..\\Local\\Programs\\Photo Location Map\\Photo Location Map.exe"`;
        break;
      case 'darwin':
        this.packageCreationCommand = 'npm run package:mac';
        this.expectedPackageLocation = `${this.releaseDirectory}/Photo Location Map-${version}${archSuffix}.dmg`;
        this.executablePrelaunchCommand = `hdiutil attach "${this.releaseDirectory}/Photo Location Map-${version}${archSuffix}.dmg"`;
        this.executableLaunchCommand = `open -W "/Volumes/Photo Location Map ${version}${archSuffix}/Photo Location Map.app"`;
        break;
      case 'linux':
        this.packageCreationCommand = 'npm run package:linux';
        this.expectedPackageLocation = `${this.releaseDirectory}/Photo Location Map-${version}${archSuffix}.AppImage`;
        this.executableLaunchCommand = `"${this.releaseDirectory}/Photo Location Map-${version}${archSuffix}.AppImage"`;
        break;
      default:
        throw new Error(`Unsupported platform for "${__filename}"`);
    }
  }
}

module.exports = new PackageTestInfo();
