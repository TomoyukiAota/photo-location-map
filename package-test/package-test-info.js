class PackageTestInfo {
  constructor() {
    this.releaseDirectory = './release';
    this.addPlatformDependentProperties();
  }

  addPlatformDependentProperties() {
    switch(global.process.platform) {
      case "win32":
        this.packageCreationCommand = "npm run electron:windows",
        this.expectedPackageLocation = `${this.releaseDirectory}/angular-electron 0.0.1.exe`,
        this.executableLaunchCommand = `"${this.releaseDirectory}/angular-electron 0.0.1.exe"`
        break;
      case "darwin":
        this.packageCreationCommand = "npm run electron:mac",
        this.expectedPackageLocation = `${this.releaseDirectory}/angular-electron-0.0.1.dmg`,
        this.executableLaunchCommand = `hdiutil attach ${this.releaseDirectory}/angular-electron-0.0.1.dmg && open -W "/Volumes/angular-electron 0.0.1/angular-electron.app"`
        break;
      case "linux":
        this.packageCreationCommand = "npm run electron:linux",
        this.expectedPackageLocation = `${this.releaseDirectory}/angular-electron 0.0.1.AppImage`,
        this.executableLaunchCommand = `${this.releaseDirectory}/angular-electron 0.0.1.AppImage`
        break;
      default:
        throw new Error(`Unsupported platform for "${__filename}"`);
    }
  }
}

module.exports = new PackageTestInfo();
