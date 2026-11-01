const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const logger = require('../util/logger');
const runCommandSync = require('../util/run-command-sync');
const testInfo = require('./package-test-info');
const testUtil = require('./package-test-util');

class PackageCreationTest {
  createPackage() {
    runCommandSync(
      testInfo.packageCreationCommand,
      `Start of "${testInfo.packageCreationCommand}" to create a package.`,
      `End of "${testInfo.packageCreationCommand}"`
    );
  }

  testIfPackagesExist() {
    testUtil.printItemsInDirectory(testInfo.releaseDirectory);
    testInfo.expectedPackageLocations.forEach(expectedPackageLocation => {
      logger.info(`Expected Package Location: "${expectedPackageLocation}"`);
      if (fs.existsSync(expectedPackageLocation)) {
        logger.info('Package exists in the expected location.');
      } else {
        const errorMessage = `Package does NOT exist in the expected location "${expectedPackageLocation}".`;
        logger.error(errorMessage);
        throw new Error(errorMessage);
      }
    });
  }

  testMacBundle() {
    if (process.platform !== 'darwin') return;
    const contents = path.join(testInfo.releaseDirectory, 'mac-universal', 'Photo Location Map.app', 'Contents');
    const readPlist = key => execFileSync('/usr/bin/plutil',
      ['-extract', key, 'raw', '-o', '-', path.join(contents, 'Info.plist')], { encoding: 'utf8' }).trim();
    const icon = readPlist('CFBundleIconFile');
    const bundledIcon = fs.readFileSync(path.join(contents, 'Resources', icon));
    const originalIcon = fs.readFileSync(path.join(__dirname, '../../src/favicon.icns'));
    if (!bundledIcon.equals(originalIcon)) throw new Error('The packaged macOS icon differs from the original app icon.');
    if (readPlist('LSMinimumSystemVersion').split('.')[0] !== '13') {
      throw new Error('The packaged macOS minimum must be 13.');
    }
    for (const binary of [path.join(contents, 'MacOS', readPlist('CFBundleExecutable')),
      path.join(contents, 'Frameworks/Electron Framework.framework/Electron Framework')]) {
      const archs = execFileSync('/usr/bin/lipo', ['-archs', binary], { encoding: 'utf8' }).trim().split(/\s+/).sort();
      if (archs.join(',') !== 'arm64,x86_64') throw new Error(`Unexpected universal architectures: ${archs}`);
    }
    logger.info('Mac bundle retains the original icon, macOS 13 minimum and both universal architectures.');
  }

  run() {
    logger.info('Start of package creation test.');
    this.createPackage();
    this.testIfPackagesExist();
    this.testMacBundle();
    logger.info('End of package creation test.');
  }
}

module.exports = new PackageCreationTest();
