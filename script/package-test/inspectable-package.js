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
// - macOS: a copy of the application of release/mac-universal, signed again ad hoc, as the fuse is in the signed binary.
// - Windows: a copy of the application as the package test's smoke test left it installed, by the NSIS installer.
// - Linux: an AppImage of a copy of release/linux-unpacked, so that the e2e suite runs the application from an AppImage,
//   as users do. electron-builder packs a folder given with --prepackaged as it is, without setting its fuses.
// The copies are in release/e2e/, which the next package test removes with release/.

// electron-builder's tool for the fuses, which is CommonJS: its exports are those of its default export.
const { flipFuses, FuseV1Options, FuseVersion } = fuses;
const releaseDirectory = path.resolve(import.meta.dirname, '../../release');
const copyDirectory = path.join(releaseDirectory, 'e2e');

/** Turns on the fuse of `executable` that lets --inspect start the inspector, signing a macOS application again. */
async function enableInspectArguments(executable) {
  await flipFuses(executable, {
    version: FuseVersion.V1,
    [FuseV1Options.EnableNodeCliInspectArguments]: true,
    resetAdHocDarwinSignature: process.platform === 'darwin',
  });
}

/** Copies `source` to `target`, keeping the symbolic links of a macOS application as they are. */
function copy(source, target) {
  if (!fs.existsSync(source)) throw new Error(`"${source}" does not exist: run the package test first.`);
  fs.cpSync(source, target, { recursive: true, verbatimSymlinks: true });
}

/** Makes the copy of the package for this computer, and returns the path of its executable. */
export async function makeInspectablePackage(platform = process.platform, arch = process.arch) {
  fs.rmSync(copyDirectory, { recursive: true, force: true });
  switch (platform) {
    case 'darwin': {
      const application = path.join(copyDirectory, 'Photo Location Map.app');
      copy(path.join(releaseDirectory, 'mac-universal', 'Photo Location Map.app'), application);
      await enableInspectArguments(application);
      return path.join(application, 'Contents', 'MacOS', 'Photo Location Map');
    }
    case 'win32': {
      const installation = path.join(copyDirectory, 'Photo Location Map');
      copy(path.join(process.env.LOCALAPPDATA, 'Programs', 'Photo Location Map'), installation);
      const executable = path.join(installation, 'Photo Location Map.exe');
      await enableInspectArguments(executable);
      return executable;
    }
    case 'linux': {
      // electron-builder names the folder and the AppImage by the arch, except for its default arch, x64.
      const unpacked = path.join(copyDirectory, arch === 'x64' ? 'linux-unpacked' : `linux-${arch}-unpacked`);
      copy(path.join(releaseDirectory, path.basename(unpacked)), unpacked);
      await enableInspectArguments(path.join(unpacked, packageJson.name));
      execFileSync('npx', ['electron-builder', 'build', '--linux', 'AppImage', '--prepackaged', unpacked, '--publish', 'never',
        `-c.directories.output=${copyDirectory}`], { stdio: ['ignore', 2, 2] });
      return path.join(copyDirectory, `Photo Location Map-${packageJson.version}${arch === 'x64' ? '' : `-${arch}`}.AppImage`);
    }
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

// `node script/package-test/inspectable-package.js` prints the path of the executable, and nothing else on stdout.
if (import.meta.main) console.log(await makeInspectablePackage());
