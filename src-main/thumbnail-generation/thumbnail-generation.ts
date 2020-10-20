import * as pathModule from 'path';
import { promisify } from 'util';
// import * as fs from 'fs';
import * as convert from 'heic-convert';

// const { promisify } = require('util');
// const fs = require('fs');

import { ipcMain } from 'electron';
import { DirectoryTree } from 'directory-tree';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { convertToFlattenedDirTree } from '../../src-shared/dir-tree/dir-tree-util';
import { FilenameExtension } from '../../src-shared/filename-extension/filename-extension';

function getThumbnailOutputPath(filePath: string) {
  const parsedPath = pathModule.parse(filePath);
  const thumbnailFileName = `${parsedPath.name}_plmThumb`;
  const intermediateDir = pathModule.parse(
    filePath.replace(':', '') // Replace C:\\abc\\def.jpg to C\\abc\\def.jpg
  ).dir;                                          // Get C\\abc\\def from C\\abc\\def.jpg
  const outputDir = pathModule.join('C:', 'plmTemp', intermediateDir);
  const outputPath = pathModule.join(outputDir, `${thumbnailFileName}.jpg`);
  console.log(outputPath);
  return { outputDir, outputPath };
}

function generateThumbnails(heifFiles: DirectoryTree[]) {
  heifFiles.forEach(async file => {
    const fs = require('fs-extra');
    const inputBuffer = await promisify(fs.readFile)(file.path);
    // const convert = require('heic-convert');
    const outputBuffer = await convert({
      buffer: inputBuffer, // the HEIC file buffer
      format: 'JPEG',      // output format
      quality: 0.1           // the jpeg compression quality, between 0 and 1
    });

    const { outputDir, outputPath } = getThumbnailOutputPath(file.path);
    await fs.ensureDir(outputDir);
    await promisify(require('fs').writeFile)(outputPath, outputBuffer).catch(err => console.log(err));
  });
}

ipcMain.handle(IpcConstants.ThumbnailGenerationInMainProcess.Name, (event, directoryTreeObject: DirectoryTree) => {
  const flattenedDirTree = convertToFlattenedDirTree(directoryTreeObject);
  console.log(flattenedDirTree);
  const heifFiles = flattenedDirTree.filter(element => FilenameExtension.isHeif(element.extension));
  console.log(`heifFiles`);
  console.log(heifFiles);
  generateThumbnails(heifFiles);
  return;
});
