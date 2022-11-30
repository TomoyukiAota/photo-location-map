import * as fs from 'fs';
import * as os from 'os';
import * as pathModule from 'path';
import * as physicalCpuCount from 'physical-cpu-count';
import { Pool, spawn, Worker } from 'threads';

import { Logger } from '../../src-shared/log/logger';
import { stringArrayToLogText } from '../../src-shared/log/multiline-log-text';
import { removeInvalidThumbnailCache } from '../../src-shared/thumbnail-cache/remove-invalid-thumbnail-cache';
import { createFileForLastModified, getThumbnailFilePath } from '../../src-shared/thumbnail-cache/thumbnail-cache-util';
import { ThumbnailFileGenerationArgs } from './generate-thumbnail-file-arg-and-result';


export function handleThumbnailGenerationIpcRequest(allHeifFilePaths: string[], heifFilePathsToGenerateThumbnail: string[]): void {
  if (!allHeifFilePaths || !heifFilePathsToGenerateThumbnail) {
    Logger.error(`handleThumbnailGenerationIpcRequest should be called with string arrays.`);
    Logger.error(`allHeifFilePaths: ${allHeifFilePaths}, heifFilePathsToGenerateThumbnail: ${heifFilePathsToGenerateThumbnail}`,
      allHeifFilePaths, heifFilePathsToGenerateThumbnail);
    return;
  }

  checkFileForWorkerThreadExists();
  removeInvalidThumbnailCache();
  logAllHeifFiles(allHeifFilePaths);
  logHeifFilesToGenerateThumbnail(heifFilePathsToGenerateThumbnail);

  // noinspection JSUnusedLocalSymbols
  const ignoredPromise = generateThumbnails(heifFilePathsToGenerateThumbnail);    // Promise is deliberately ignored.
}

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

function logAllHeifFiles(allHeifFilePaths: string[]): void {
  Logger.info(`Number of all HEIF files: ${allHeifFilePaths.length}`);
  if (allHeifFilePaths.length >= 1) {
    const filePathsText = stringArrayToLogText(allHeifFilePaths);
    Logger.info(`All HEIF file paths are as follows:${filePathsText}`);
  }
}

function logHeifFilesToGenerateThumbnail(heifFilePathsToGenerateThumbnail: string[]): void {
  Logger.info(`Number of HEIF files to generate thumbnails: ${heifFilePathsToGenerateThumbnail.length}`);
  if (heifFilePathsToGenerateThumbnail.length >= 1) {
    const filePathsText = stringArrayToLogText(heifFilePathsToGenerateThumbnail);
    Logger.info(`HEIF files to generate thumbnails are as follows:${filePathsText}`);
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
  const argsArray = heifFilePaths.map(filePath => createThumbnailFileGenerationArgs(filePath));

  const logLines = argsArray.map(args => `From "${args.srcFilePath}", a thumbnail file "${args.outputFilePath}" will be generated.`);
  const logText = stringArrayToLogText(logLines);
  Logger.info(`[main thread] Queuing tasks for worker thread to generate thumbnail:${logText}`);

  argsArray.forEach(args => {
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
