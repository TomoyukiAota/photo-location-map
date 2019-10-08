const createPackageOnWindows = require('./create-package-on-windows');
const createPackageOnMac = require('./create-package-on-mac');
const createPackageOnLinux = require('./create-package-on-linux');

const createPackage = () => {
  switch(global.process.platform) {
    case 'win32':
      createPackageOnWindows();
      break;
    case 'darwin':
      createPackageOnMac();
      break;
    case 'linux':
      createPackageOnLinux();
      break;
    default:
      throw new Error(`Unsupported platform for "${__filename}"`);
  }
};

createPackage();
