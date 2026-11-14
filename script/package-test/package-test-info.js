const path = require('path');
const { version } = require('../../package.json');
const getLogDirectory = require('./get-log-directory');
const getDiskImageTools = require('./disk-image-tools');

// The folder of the unpacked application that electron-builder leaves in release/ beside the installer or the
// AppImage: win-unpacked or linux-unpacked for x64, its default arch, and such as linux-arm64-unpacked for another.
function unpackedDirectory(platform) {
  return global.process.arch === 'x64' ? `${platform}-unpacked` : `${platform}-${global.process.arch}-unpacked`;
}

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
        // The installation directory is printed when the silent installation fails,
        // so that it can be seen whether the installation took place in spite of the failure.
        const installationDirectory = `${process.env.APPDATA}\\..\\Local\\Programs\\Photo Location Map`;
        const installerLocation = `${this.releaseDirectory}\\Photo Location Map Setup ${version}.exe`;
        this.packageCreationCommand = 'npm run package:windows';
        this.expectedPackageLocations = [installerLocation];
        this.executablePrelaunchCommand = `"${installerLocation}" /S`;
        this.installationDirectory = installationDirectory;
        this.executableLaunchCommand = `"${installationDirectory}\\Photo Location Map.exe"`;
        // The binary whose fuses electron-builder set (script/package-test/electron-fuses.js).
        this.electronFuseBinary = `${this.releaseDirectory}\\${unpackedDirectory('win')}\\Photo Location Map.exe`;
        break;
      }
      case 'darwin': {
        // The dmg is the package to install the application manually, and the zip is the package which electron-updater
        // requires in the release to auto-update on macOS. Both of them need to be created.
        const dmgLocation = `${this.releaseDirectory}/Photo Location Map-${version}-universal.dmg`;
        const zipLocation = `${this.releaseDirectory}/Photo Location Map-${version}-universal-mac.zip`;
        const dmgVolume = `/Volumes/Photo Location Map ${version}-universal`;
        this.packageCreationCommand = 'npm run package:mac';
        this.expectedPackageLocations = [dmgLocation, zipLocation];
        this.diskImageTools = getDiskImageTools();
        this.executablePrelaunchCommand = `${this.diskImageTools.attach} "${dmgLocation}"`;
        // -g leaves the app in the background, so that it does not take the focus from the developer's work.
        // Its window stays hidden as well: see PackageSmokeTest::runExecutable.
        this.executableLaunchCommand = `open -g -W "${dmgVolume}/Photo Location Map.app"`;
        // Used to quit the app and detach the dmg after the smoke test (PackageSmokeTest::cleanUpOnMacOs).
        this.dmgVolume = dmgVolume;
        this.appExecutablePath = `${dmgVolume}/Photo Location Map.app/Contents/MacOS/Photo Location Map`;
        // The binary whose fuses electron-builder set (script/package-test/electron-fuses.js): Electron's framework,
        // with the fuses of both halves of the universal application.
        this.electronFuseBinary = `${this.releaseDirectory}/mac-universal/Photo Location Map.app/Contents/Frameworks/`
          + 'Electron Framework.framework/Electron Framework';
        break;
      }
      case 'linux': {
        // electron-builder appends the arch to the package name, except when the target arch is the default arch (x64).
        // Note that this assumes x64 or arm64. electron-builder can use different names for other arches (e.g. ia32, armv7l).
        const archSuffix = global.process.arch === 'x64' ? '' : `-${global.process.arch}`;
        this.packageCreationCommand = 'npm run package:linux';
        this.expectedPackageLocations = [`${this.releaseDirectory}/Photo Location Map-${version}${archSuffix}.AppImage`];
        this.executableLaunchCommand = `"${this.releaseDirectory}/Photo Location Map-${version}${archSuffix}.AppImage"`;
        // The binary whose fuses electron-builder set (script/package-test/electron-fuses.js), named after package.json.
        this.electronFuseBinary = `${this.releaseDirectory}/${unpackedDirectory('linux')}/photo-location-map`;
        break;
      }
      default:
        throw new Error(`Unsupported platform for "${__filename}"`);
    }
  }
}

module.exports = new PackageTestInfo();
