import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import fuses from '@electron/fuses';
import packageJson from '../../package.json' with { type: 'json' };

// TL;DR: Makes a copy of the package that the package test built, with Electron's fuse enableNodeCliInspectArguments
// on, and prints the path of its executable, for PLM_PACKAGED_EXECUTABLE of the e2e suite and the performance harness.
// Details:
// - Playwright controls the application's main process through Node's inspector, which it starts with --inspect, and
//   the package has the fuse that lets --inspect start it off (electron-builder.json, docs/contributing/electron-fuses.md).
//   The copy differs from the package by that fuse alone. The package itself is checked by the package test: its fuses,
//   and its installation and launch in the smoke test, which does not use the inspector.
// - macOS: a copy of the application of release/mac-universal, signed again ad hoc, as the fuse is in the signed
//   framework of Electron, and without the hardened runtime: its library validation refuses to load a framework that
//   is not signed by the team of the application's executable, and a signature made ad hoc has no team.
// - Windows: a copy of the application as the package test's smoke test left it installed, by the NSIS installer.
// - Linux: an AppImage of a copy of release/linux-unpacked, so that the e2e suite runs the application from an AppImage,
//   as users do. electron-builder packs a folder given with --prepackaged as it is, without setting its fuses.
// By default, the copy is of the package that the package test built, in release/e2e/, which the next package test
// removes with release/. The performance harness gives each build that it measures, and a folder for its copy.

// electron-builder's tool for the fuses, which is CommonJS: its exports are those of its default export.
const { flipFuses, FuseV1Options, FuseVersion } = fuses;
const releaseDirectory = path.resolve(import.meta.dirname, '../../release');
const copyDirectory = path.join(releaseDirectory, 'e2e');

/** Turns on the fuse of `executable` (on macOS, the application) that lets --inspect start the inspector. */
async function enableInspectArguments(executable) {
  await flipFuses(executable, { version: FuseVersion.V1, [FuseV1Options.EnableNodeCliInspectArguments]: true });
}

/** Copies `source` to `target`, keeping the symbolic links of a macOS application as they are. */
function copy(source, target) {
  if (!fs.existsSync(source)) throw new Error(`"${source}" does not exist: run the package test first.`);
  fs.cpSync(source, target, { recursive: true, verbatimSymlinks: true });
}

/**
 * Makes a copy of a packaged application with the fuse on, and returns the path of its executable.
 * @param {object} [options]
 * @param {string} [options.application] The application to copy: an .app on macOS, the folder of its executable on
 *   Windows and Linux. By default, the package test's: release/mac-universal's application, the application that the
 *   installer installed, or release/linux-unpacked.
 * @param {string} [options.destination] A folder for the copy, which does not exist yet, such as one for each build that
 *   the performance harness measures. By default, release/e2e/, which is replaced.
 */
export async function makeInspectablePackage({ application, destination, platform = process.platform, arch = process.arch } = {}) {
  if (destination) {
    if (fs.existsSync(destination)) throw new Error(`"${destination}" exists: give a folder for the copy that does not.`);
  } else {
    destination = copyDirectory;
    fs.rmSync(destination, { recursive: true, force: true });
  }
  switch (platform) {
    case 'darwin': {
      const source = application ?? path.join(releaseDirectory, 'mac-universal', 'Photo Location Map.app');
      const copied = path.join(destination, path.basename(source));
      copy(source, copied);
      await enableInspectArguments(copied);
      // Every part of the copy signed again ad hoc, without the hardened runtime, which --preserve-metadata would keep.
      execFileSync('codesign', ['--force', '--deep', '--sign', '-', copied], { stdio: ['ignore', 2, 2] });
      return path.join(copied, 'Contents', 'MacOS', 'Photo Location Map');
    }
    case 'win32': {
      const source = application ?? path.join(process.env.LOCALAPPDATA, 'Programs', 'Photo Location Map');
      const copied = path.join(destination, path.basename(source));
      copy(source, copied);
      const executable = path.join(copied, 'Photo Location Map.exe');
      await enableInspectArguments(executable);
      return executable;
    }
    case 'linux': {
      // electron-builder names the folder and the AppImage by the arch, except for its default arch, x64.
      const source = application ?? path.join(releaseDirectory, arch === 'x64' ? 'linux-unpacked' : `linux-${arch}-unpacked`);
      const unpacked = path.join(destination, path.basename(source));
      copy(source, unpacked);
      await enableInspectArguments(path.join(unpacked, packageJson.name));
      execFileSync('npx', ['electron-builder', 'build', '--linux', 'AppImage', '--prepackaged', unpacked, '--publish', 'never',
        `-c.directories.output=${destination}`], { stdio: ['ignore', 2, 2] });
      return path.join(destination, `Photo Location Map-${packageJson.version}${arch === 'x64' ? '' : `-${arch}`}.AppImage`);
    }
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

// `node script/package-test/inspectable-package.js [<application> [<destination>]]` prints the path of the copy's
// executable, and nothing else on stdout.
if (import.meta.main) {
  const [application, destination] = process.argv.slice(2).map(argument => path.resolve(argument));
  console.log(await makeInspectablePackage({ application, destination }));
}
