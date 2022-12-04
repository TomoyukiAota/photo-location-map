import * as fs from 'fs';
import * as os from 'os';
import * as pathModule from 'path';
import * as physicalCpuCount from 'physical-cpu-count';
import * as workerpool from 'workerpool';
import { createPrependedLogger } from "../../src-shared/log/create-prepended-logger";
import { stringArrayToLogText } from '../../src-shared/log/multiline-log-text';
import { removeInvalidThumbnailCache } from '../../src-shared/thumbnail-cache/remove-invalid-thumbnail-cache';
import { createFileForLastModified, getThumbnailFilePath } from '../../src-shared/thumbnail-cache/thumbnail-cache-util';
import { ThumbnailFileGenerationArgs } from './generate-thumbnail-file-arg-and-result';

const logger = createPrependedLogger('[Thumbnail Generation]');

export function handleThumbnailGenerationIpcRequest(allHeifFilePaths: string[], heifFilePathsToGenerateThumbnail: string[]): void {
  if (!allHeifFilePaths || !heifFilePathsToGenerateThumbnail) {
    logger.error(`handleThumbnailGenerationIpcRequest should be called with string arrays.`);
    logger.error(`allHeifFilePaths: ${allHeifFilePaths}, heifFilePathsToGenerateThumbnail: ${heifFilePathsToGenerateThumbnail}`,
      allHeifFilePaths, heifFilePathsToGenerateThumbnail);
    return;
  }

  checkFileForWorkerExists();
  removeInvalidThumbnailCache();
  logAllHeifFiles(allHeifFilePaths);
  logHeifFilesToGenerateThumbnail(heifFilePathsToGenerateThumbnail);

  // noinspection JSUnusedLocalSymbols
  const ignoredPromise = generateThumbnails(heifFilePathsToGenerateThumbnail);    // Promise is deliberately ignored.
}

class FileForWorker {
  private static _fileName = 'generate-thumbnail-file-worker.js';
  private static _absoluteFilePath = pathModule.join(__dirname, this._fileName);
  public static get absoluteFilePath() { return this._absoluteFilePath; }
}

function checkFileForWorkerExists(): void {
  const filePath = FileForWorker.absoluteFilePath;
  logger.info(`The expected file path for worker used during thumbnail generation is "${filePath}"`);
  const isFileFound = fs.existsSync(filePath);

  if (isFileFound) {
    logger.info(`The file for worker used during thumbnail generation is found.`);
  } else {
    logger.error(`The file for worker used during thumbnail generation is NOT found.`);
  }
}

function logAllHeifFiles(allHeifFilePaths: string[]): void {
  logger.info(`Number of all HEIF files: ${allHeifFilePaths.length}`);
  if (allHeifFilePaths.length >= 1) {
    const filePathsText = stringArrayToLogText(allHeifFilePaths);
    logger.info(`All HEIF file paths are as follows:${filePathsText}`);
  }
}

function logHeifFilesToGenerateThumbnail(heifFilePathsToGenerateThumbnail: string[]): void {
  logger.info(`Number of HEIF files to generate thumbnails: ${heifFilePathsToGenerateThumbnail.length}`);
  if (heifFilePathsToGenerateThumbnail.length >= 1) {
    const filePathsText = stringArrayToLogText(heifFilePathsToGenerateThumbnail);
    logger.info(`HEIF files to generate thumbnails are as follows:${filePathsText}`);
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
  const numberOfProcessesToUse = physicalCpuCount >= 2 ? physicalCpuCount - 1 : 1;
  logger.info(`Number of CPU cores, Physical: ${physicalCpuCount}, Logical: ${logicalCpuCount}`);
  logger.info(`Number of processes for thumbnail generation: ${numberOfProcessesToUse}`);

  const argsArray = heifFilePaths.map(filePath => createThumbnailFileGenerationArgs(filePath));

  const logLines = argsArray.map(args => `From "${args.srcFilePath}", a thumbnail file "${args.outputFilePath}" will be generated.`);
  const logText = stringArrayToLogText(logLines);
  logger.info(`Queuing tasks for worker to generate thumbnail:${logText}`);

  const pool = workerpool.pool(FileForWorker.absoluteFilePath, {
    maxWorkers: numberOfProcessesToUse,
    workerType: 'process',
  });

  const workerPromises = argsArray.map(args => {
    return pool
      .proxy()
      .then(worker => worker.generateThumbnailFile(args))
      .then(result => {
        logger.info('Observed completion of worker for thumbnail generation. ' +
          `From "${args.srcFilePath}", a thumbnail file "${args.outputFilePath}" should have been generated.`);
        createFileForLastModified(args.srcFilePath, args.outputFileDir, logger);
      });
  });

  await Promise.allSettled(workerPromises);
  await pool.terminate();
}
