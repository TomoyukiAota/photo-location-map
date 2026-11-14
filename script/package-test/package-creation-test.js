import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import builderConfig from '../../electron-builder.json' with { type: 'json' };
import logger from '../util/logger.js';
import runCommandSync from '../util/run-command-sync.js';
import { checkElectronFuses, fuseWiresOf } from './electron-fuses.js';
import {
  buildMinimumsOf, checkMacMinimumSystemVersion, checkWindowsMinimumSystemVersion, feedMinimumOf,
} from './minimum-system-version.js';
import testInfo from './package-test-info.js';
import testUtil from './package-test-util.js';

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
    const originalIcon = fs.readFileSync(path.join(import.meta.dirname, '../../src/favicon.icns'));
    if (!bundledIcon.equals(originalIcon)) throw new Error('The packaged macOS icon differs from the original app icon.');
    const binaries = [path.join(contents, 'MacOS', readPlist('CFBundleExecutable')),
      path.join(contents, 'Frameworks/Electron Framework.framework/Electron Framework')];
    const minimum = builderConfig.mac.minimumSystemVersion;
    const electronMinimum = checkMacMinimumSystemVersion({
      configured: minimum,
      vendor: builderConfig.mac.releaseInfo?.vendor?.minimumSystemVersion,
      plist: readPlist('LSMinimumSystemVersion'),
      feed: feedMinimumOf(fs.readFileSync(path.join(testInfo.releaseDirectory, 'latest-mac.yml'), 'utf8')),
      electron: binaries.flatMap(binary => buildMinimumsOf(
        execFileSync('/usr/bin/otool', ['-arch', 'all', '-l', binary], { encoding: 'utf8' }))),
    });
    for (const binary of binaries) {
      const archs = execFileSync('/usr/bin/lipo', ['-archs', binary], { encoding: 'utf8' }).trim().split(/\s+/).sort();
      if (archs.join(',') !== 'arm64,x86_64') throw new Error(`Unexpected universal architectures: ${archs}`);
    }
    logger.info(`Mac bundle retains the original icon and both universal architectures, and declares macOS ${minimum} `
      + `as its minimum in Info.plist and latest-mac.yml (Electron needs ${electronMinimum}).`);
  }

  testElectronFuses() {
    logger.info(`Reading the fuses of "${testInfo.electronFuseBinary}".`);
    const wires = fuseWiresOf(fs.readFileSync(testInfo.electronFuseBinary));
    checkElectronFuses({ configured: builderConfig.electronFuses, wires });
    logger.info(`The packaged Electron has the fuses of electron-builder.json${wires.length > 1 ? `, in each of the ${wires.length} halves of the binary` : ''}.`);
  }

  testWindowsUpdateInfo() {
    if (process.platform !== 'win32') return;
    const minimum = builderConfig.win.releaseInfo?.vendor?.minimumSystemVersion;
    checkWindowsMinimumSystemVersion({
      configured: minimum,
      feed: feedMinimumOf(fs.readFileSync(path.join(testInfo.releaseDirectory, 'latest.yml'), 'utf8')),
    });
    logger.info(`latest.yml declares Windows ${minimum} as the minimum.`);
  }

  run() {
    logger.info('Start of package creation test.');
    this.createPackage();
    this.testIfPackagesExist();
    this.testElectronFuses();
    this.testMacBundle();
    this.testWindowsUpdateInfo();
    logger.info('End of package creation test.');
  }
}

export default new PackageCreationTest();
