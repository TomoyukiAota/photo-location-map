const fsExtra = require('fs-extra');
const logger = require('../util/logger');
const runCommandSync = require('../util/run-command-sync');

const repoRootDir = `${__dirname}/../..`;
const { version } = require(`${repoRootDir}/package.json`);
const dmgFilePathFromElectronBuilder = `${repoRootDir}/release/Photo Location Map-${version}.dmg`;

const createDmgFile = () => {
  runCommandSync(
    'npm run electron:mac',
    `Started creating a DMG file "${dmgFilePathFromElectronBuilder}".`,
    `Finished creating a DMG file "${dmgFilePathFromElectronBuilder}".`
  );
};

const moveDmgFile = () => {
  const dstPath = `${repoRootDir}/package/Photo Location Map-${version}.dmg`;
  logger.info(`Started moving the DMG file from "${dmgFilePathFromElectronBuilder}" to ${dstPath}.`);
  fsExtra.moveSync(dmgFilePathFromElectronBuilder, dstPath, { overwrite: true });
  logger.info(`Finished moving the DMG file from "${dmgFilePathFromElectronBuilder}" to ${dstPath}.`);
};

const createPackageOnMac = () => {
  createDmgFile();
  moveDmgFile();
};

module.exports = createPackageOnMac;
