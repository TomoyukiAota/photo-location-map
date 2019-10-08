const fsExtra = require('fs-extra');
const runCommandSync = require('./run-command-sync');

const repoRootDir = `${__dirname}/../..`;
const { version } = require(`${repoRootDir}/package.json`);
const appImageFilePathFromElectronBuilder = `${repoRootDir}/release/Photo Location Map-${version}.AppImage`;

const createAppImageFile = () => {
  runCommandSync(
    'npm run electron:linux',
    `Started creating an AppImage file "${appImageFilePathFromElectronBuilder}".`,
    `Finished creating an AppImage file "${appImageFilePathFromElectronBuilder}".`
  );
};

const moveAppImageFile = () => {
  const dstPath = `${repoRootDir}/package/Photo Location Map-${version}.AppImage`;
  console.info(`Started moving the AppImage file from "${appImageFilePathFromElectronBuilder}" to ${dstPath}.`);
  fsExtra.moveSync(appImageFilePathFromElectronBuilder, dstPath, { overwrite: true });
  console.info(`Finished moving the AppImage file from "${appImageFilePathFromElectronBuilder}" to ${dstPath}.`);
};

const createPackageOnLinux = () => {
  createAppImageFile();
  moveAppImageFile();
};

module.exports = createPackageOnLinux;
