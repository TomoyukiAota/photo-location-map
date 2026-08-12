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
    switch(global.process.platform) {
      case 'win32': {
        // The installation directory is printed when the silent installation fails, so that it can be seen
        // whether the installation took place in spite of the failure.
        const installationDirectory = `${process.env.APPDATA}\\..\\Local\\Programs\\Photo Location Map`;
        this.packageCreationCommand = 'npm run package:windows';
        this.expectedPackageLocations = [`${this.releaseDirectory}\\Photo Location Map Setup ${version}.exe`];
        this.executablePrelaunchCommand = `"${this.releaseDirectory}\\Photo Location Map Setup ${version}.exe" /S`;
        this.installationDirectory = installationDirectory;
        this.executableLaunchCommand = `"${installationDirectory}\\Photo Location Map.exe"`;
        break;
      }
      case 'darwin': {
        // The dmg is the package to install the application manually, and the zip is the package which electron-updater
        // requires in the release to auto-update on macOS. Both of them need to be created.
        const dmgLocation = `${this.releaseDirectory}/Photo Location Map-${version}-universal.dmg`;
        const zipLocation = `${this.releaseDirectory}/Photo Location Map-${version}-universal-mac.zip`;
        this.packageCreationCommand = 'npm run package:mac';
        this.expectedPackageLocations = [dmgLocation, zipLocation];
        this.executablePrelaunchCommand = `hdiutil attach "${dmgLocation}"`;
        this.executableLaunchCommand = `open -W "/Volumes/Photo Location Map ${version}-universal/Photo Location Map.app"`;
        break;
      }
      case 'linux': {
        // electron-builder appends the arch to the package name, except when the target arch is the default arch (x64).
        // Note that this assumes x64 or arm64. electron-builder can use different names for other arches (e.g. ia32, armv7l).
        const archSuffix = global.process.arch === 'x64' ? '' : `-${global.process.arch}`;
        this.packageCreationCommand = 'npm run package:linux';
        this.expectedPackageLocations = [`${this.releaseDirectory}/Photo Location Map-${version}${archSuffix}.AppImage`];
        this.executableLaunchCommand = `"${this.releaseDirectory}/Photo Location Map-${version}${archSuffix}.AppImage"`;
        break;
      }
      default:
        throw new Error(`Unsupported platform for "${__filename}"`);
    }
  }
}

module.exports = new PackageTestInfo();
