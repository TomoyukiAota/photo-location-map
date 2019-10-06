const fsExtra = require('fs-extra');
const archiver = require('archiver');

const repoRootDir = `${__dirname}\\..\\..`;
const { version } = require(`${repoRootDir}\\package.json`);
const exeFilePathFromElectronBuilder = `${repoRootDir}\\release\\Photo Location Map ${version}.exe`;
const packageDir = `${repoRootDir}\\package`;
const zipFilePath = `${packageDir}\\Photo Location Map ${version}.zip`;
const exeFileNameInZipFile = 'Photo Location Map.exe';

fsExtra.ensureDirSync(packageDir);

const archive = archiver('zip', { zlib: { level: 9 } });
archive.on('warning', function(err) { throw err; });
archive.on('error', function(err) { throw err; });

const output = fsExtra
  .createWriteStream(zipFilePath)
  .on('close', () => console.log(`Finished creating ${zipFilePath} (${archive.pointer()} bytes).`));

archive.pipe(output);
archive.file(exeFilePathFromElectronBuilder, { name: exeFileNameInZipFile });
archive.finalize();
