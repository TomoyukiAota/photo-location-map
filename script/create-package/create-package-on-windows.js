const fsExtra = require('fs-extra');
const archiver = require('archiver');
const runCommandSync = require('./run-command-sync');

const repoRootDir = `${__dirname}/../..`;
const { version } = require(`${repoRootDir}/package.json`);
const exeFilePathFromElectronBuilder = `${repoRootDir}\\release\\Photo Location Map ${version}.exe`;

const createExeFile = () => {
  runCommandSync(
    'npm run electron:windows',
    `Started creating an EXE file "${exeFilePathFromElectronBuilder}".`,
    `Finished creating an EXE file "${exeFilePathFromElectronBuilder}".`
  );
};

const createZipFile = () => {
  const packageDir = `${repoRootDir}\\package`;
  const zipFilePath = `${packageDir}\\Photo Location Map ${version}.zip`;
  const exeFileNameInZipFile = 'Photo Location Map.exe';

  console.info(`Started creating a ZIP file "${zipFilePath}".`);

  fsExtra.ensureDirSync(packageDir);

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.on('warning', function(err) { throw err; });
  archive.on('error', function(err) { throw err; });

  const output = fsExtra
    .createWriteStream(zipFilePath)
    .on('close', () => console.log(`Finished creating a ZIP file "${zipFilePath}" (${archive.pointer()} bytes).`));

  archive.pipe(output);
  archive.file(exeFilePathFromElectronBuilder, { name: exeFileNameInZipFile });
  archive.finalize();
};

const createPackageOnWindows = () => {
  createExeFile();
  createZipFile();
};

module.exports = createPackageOnWindows;
