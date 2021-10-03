import { ipcMain } from 'electron';
import * as fs from 'fs';
import * as os from 'os';
import * as pathModule from 'path';
import * as physicalCpuCount from 'physical-cpu-count';
import { Pool, spawn, Worker } from 'threads';

import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { Logger } from '../../src-shared/log/logger';
import { removeInvalidThumbnailCache } from '../../src-shared/thumbnail-cache/remove-invalid-thumbnail-cache';
import { createFileForLastModified, getThumbnailFilePath } from '../../src-shared/thumbnail-cache/thumbnail-cache-util';
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
  const workerThreadFileExists = fs.existsSync(absoluteFilePathForWorkerThread);

  if (workerThreadFileExists) {
    Logger.info(`The file for worker thread used during thumbnail generation is found.`);
  } else {
    Logger.error(`The file for worker thread used during thumbnail generation is NOT found.`);
  }
}

function createThumbnailFileGenerationArgs(filePath: string) {
  const args = new ThumbnailFileGenerationArgs();
  args.srcFilePath = filePath;
  const {thumbnailFileDir, thumbnailFilePath} = getThumbnailFilePath(args.srcFilePath);
  args.outputFileDir = thumbnailFileDir;
  args.outputFilePath = thumbnailFilePath;
  return args;
}

async function generateThumbnails(heifFilePaths: string[]) {
  const logicalCpuCount = os.cpus().length;
  const numberOfThreadsToUse = physicalCpuCount >= 2 ? physicalCpuCount - 1 : 1;
  Logger.info(`Number of CPU cores, Physical: ${physicalCpuCount}, Logical: ${logicalCpuCount}`);
  Logger.info(`Number of threads for thumbnail generation: ${numberOfThreadsToUse}`);

  const pool = Pool(() => spawn(new Worker(FileForWorkerThread.relativePathWithoutExtension)), numberOfThreadsToUse);

  heifFilePaths.forEach(filePath => {
    const args = createThumbnailFileGenerationArgs(filePath);

    Logger.info('[main thread] Queuing a task for worker thread to generate thumbnail. ' +
      `From "${args.srcFilePath}", a thumbnail file "${args.outputFilePath}" will be generated.`);

    pool.queue(async generateThumbnailFile => await generateThumbnailFile(args))
      .then(result => {
        Logger.info('[main thread] Observed worker thread completion for thumbnail generation. ' +
          `From "${args.srcFilePath}", a thumbnail file "${args.outputFilePath}" should have been generated.`);
        createFileForLastModified(args.srcFilePath, args.outputFileDir);
      });
  });

  await pool.settled();
  await pool.terminate();
}

ipcMain.handle(IpcConstants.ThumbnailGenerationInMainProcess.Name, (event, heifFilePathsToGenerateThumbnail: string[]) => {
  checkFileForWorkerThreadExists();
  removeInvalidThumbnailCache();

  // noinspection JSUnusedLocalSymbols
  const ignoredPromise = generateThumbnails(heifFilePathsToGenerateThumbnail);    // Promise is deliberately ignored.

  return;
});
