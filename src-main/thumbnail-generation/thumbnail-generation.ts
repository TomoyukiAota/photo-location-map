import { DirectoryTree } from 'directory-tree';
import { ipcMain } from 'electron';
import * as fs from 'fs';
import * as os from 'os';
import * as pathModule from 'path';
import * as physicalCpuCount from 'physical-cpu-count';
import { Pool, spawn, Worker } from 'threads';

import { convertToFlattenedDirTree } from '../../src-shared/dir-tree/dir-tree-util';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { Logger } from '../../src-shared/log/logger';
import { FilenameExtension } from '../../src-shared/filename-extension/filename-extension';
import { ThumbnailFileGenerationArgs } from './generate-thumbnail-file-arg-and-result';


class FileForWorkerThread {
  // The file path for worker thread needs to be relative to the file for main thread
  // (where thread.js's spawn and Worker are called).
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
  return { outputDir, outputPath };
}


function createThumbnailFileGenerationArgs(file: DirectoryTree) {
  const args = new ThumbnailFileGenerationArgs();
  args.srcFilePath = file.path;
  const {outputDir, outputPath} = getThumbnailOutputPath(file.path);
  args.outputFileDir = outputDir;
  args.outputFilePath = outputPath;
  return args;
}

async function generateThumbnails(heifFiles: DirectoryTree[]) {
  const logicalCpuCount = os.cpus().length;
  const numberOfThreadsToUse = physicalCpuCount >= 2 ? physicalCpuCount - 1 : 1;
  Logger.info(`Number of CPU cores, Physical: ${physicalCpuCount}, Logical: ${logicalCpuCount}`);
  Logger.info(`Number of threads for thumbnail generation: ${numberOfThreadsToUse}`);

  const pool = Pool(() => spawn(new Worker(FileForWorkerThread.relativePathWithoutExtension)), numberOfThreadsToUse);

  heifFiles.forEach(file => {
    const args = createThumbnailFileGenerationArgs(file);

    Logger.info('[main thread] Queuing a task for worker thread to generate thumbnail. ' +
      `From "${args.srcFilePath}", a thumbnail file "${args.outputFilePath}" will be generated.`);

    pool.queue(async generateThumbnailFile => await generateThumbnailFile(args))
      .then(() => {
        Logger.info('[main thread] Observed worker thread completion for thumbnail generation. ' +
          `From "${args.srcFilePath}", a thumbnail file "${args.outputFilePath}" should have been generated.`);
      });
  });

  await pool.settled();
  await pool.terminate();
}

ipcMain.handle(IpcConstants.ThumbnailGenerationInMainProcess.Name, (event, directoryTreeObject: DirectoryTree) => {
  const flattenedDirTree = convertToFlattenedDirTree(directoryTreeObject);
  const heifFiles = flattenedDirTree.filter(element => FilenameExtension.isHeif(element.extension));
  console.log(`heifFiles`);
  console.log(heifFiles);

  checkFileForWorkerThreadExists();

  // noinspection JSUnusedLocalSymbols
  const ignoredPromise = generateThumbnails(heifFiles);    // Promise is deliberately ignored.

  return;
});
