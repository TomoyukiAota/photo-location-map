import { DirectoryTree } from 'directory-tree';
import { ipcMain } from 'electron';
import * as fs from 'fs';
import { spawn, Thread, Worker } from 'threads';
import * as pathModule from 'path';
import * as allSettled from 'promise.allsettled';

import { convertToFlattenedDirTree } from '../../src-shared/dir-tree/dir-tree-util';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { Logger } from '../../src-shared/log/logger';
import { FilenameExtension } from '../../src-shared/filename-extension/filename-extension';
import { ThumbnailFileGenerationArgs } from './generate-thumbnail-file-arg-and-result';


class FileForWorkerThread {
  private static _relativePathWithoutExtension = './generate-thumbnail-file-worker';
  public static get relativePathWithoutExtension() { return this._relativePathWithoutExtension; }
  public static get relativePathWithExtension() { return `${this._relativePathWithoutExtension}.js`; }
}

function checkFileForWorkerThreadExists(): void {
  const absoluteFilePathForWorkerThread = pathModule.join(__dirname, FileForWorkerThread.relativePathWithExtension);
  Logger.info(`The expected file path for worker thread used during thumbnail generation is "${absoluteFilePathForWorkerThread}"`);
  const fileExists = fs.existsSync(absoluteFilePathForWorkerThread);

  if (fileExists) {
    Logger.info(`The file for worker thread used during thumbnail generation is found.`);
  } else {
    Logger.error(`The file for worker thread used during thumbnail generation is NOT found.`);
  }
}

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

async function generateThumbnails(heifFiles: DirectoryTree[]) {
  const promiseArray = heifFiles.map(async file => {
    console.log(`heifFile`, file);

    const generateThumbnailFile = await spawn(new Worker(FileForWorkerThread.relativePathWithoutExtension));

    const args = new ThumbnailFileGenerationArgs();
    args.srcFilePath = file.path;
    const { outputDir, outputPath } = getThumbnailOutputPath(file.path);
    args.outputFileDir = outputDir;
    args.outputFilePath = outputPath;

    console.log('before await generateThumbnailFile(args);');
    const result = await generateThumbnailFile(args);

    await Thread.terminate(generateThumbnailFile);

    return;
  });

  await allSettled(promiseArray);
}

ipcMain.handle(IpcConstants.ThumbnailGenerationInMainProcess.Name, (event, directoryTreeObject: DirectoryTree) => {
  const flattenedDirTree = convertToFlattenedDirTree(directoryTreeObject);
  console.log(flattenedDirTree);
  const heifFiles = flattenedDirTree.filter(element => FilenameExtension.isHeif(element.extension));
  console.log(`heifFiles`);
  console.log(heifFiles);

  checkFileForWorkerThreadExists();

  // noinspection JSUnusedLocalSymbols
  const ignoredPromise = generateThumbnails(heifFiles);    // Promise is deliberately ignored.

  return;
});
