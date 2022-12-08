import * as fs from 'fs';
import * as os from 'os';
import * as pathModule from 'path';
import * as physicalCpuCount from 'physical-cpu-count';
import * as workerpool from 'workerpool';
import * as _ from 'lodash';
import { stringArrayToLogText } from '../../src-shared/log/multiline-log-text';
import { removeInvalidThumbnailCache } from '../../src-shared/thumbnail/cache/remove-invalid-thumbnail-cache';
import { createFileForLastModified, getThumbnailFilePath } from '../../src-shared/thumbnail/cache/thumbnail-cache-util';
import { thumbnailGenerationLogger as logger } from '../../src-shared/thumbnail/generation/thumbnail-generation-logger';
import { ThumbnailFileGenerationArg } from './generate-thumbnail-file-arg-and-result';

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

function createThumbnailFileGenerationArg(filePath: string) {
  const arg = new ThumbnailFileGenerationArg();
  arg.srcFilePath = filePath;
  const {thumbnailFileDir, thumbnailFilePath} = getThumbnailFilePath(arg.srcFilePath);
  arg.outputFileDir = thumbnailFileDir;
  arg.outputFilePath = thumbnailFilePath;
  return arg;
}

const logicalCpuCount = os.cpus().length;
const numberOfProcessesToUse = physicalCpuCount >= 2 ? physicalCpuCount - 1 : 1;

async function generateThumbnails(heifFilePaths: string[]) {
  logger.info(`Number of CPU cores, Physical: ${physicalCpuCount}, Logical: ${logicalCpuCount}`);
  logger.info(`Number of processes for thumbnail generation: ${numberOfProcessesToUse}`);

  const argArray = heifFilePaths.map(filePath => createThumbnailFileGenerationArg(filePath));

  // The worker process needs to be restarted per thumbnail.
  // If the worker process continues to be used for multiple thumbnails,
  // the memory consumption of the process increases, and the app will eventually crash.
  // In the code below, thumbnail generation is split into chunks, and worker processes are restarted by each chunk.
  // By numberOfFilesInChunk === numberOfProcessesToUse, each worker process will be restarted per thumbnail.

  const numberOfFilesInChunk = numberOfProcessesToUse;
  const argArrayChunks = _.chunk(argArray, numberOfFilesInChunk);
  logger.info(`Files are split in ${argArrayChunks.length} chunks.`);
  logger.info(`Each chunk contains up to ${numberOfFilesInChunk} files.`);

  for (let index = 0; index < argArrayChunks.length; index++){
    const chunkNumber = `#${index + 1}`;
    logger.info(`Started chunk ${chunkNumber} out of ${argArrayChunks.length} chunks.`);
    const chunk = argArrayChunks[index];
    logger.info(`Chunk ${chunkNumber} contains ${chunk.length} files.`);
    await runWorkerForThumbnailGeneration(chunk);
    logger.info(`Finished chunk ${chunkNumber} out of ${argArrayChunks.length} chunks.`);
  }
}

async function runWorkerForThumbnailGeneration(argArray: ThumbnailFileGenerationArg[]) {
  const logLines = argArray.map(arg => `From "${arg.srcFilePath}", a thumbnail file "${arg.outputFilePath}" will be generated.`);
  const logText = stringArrayToLogText(logLines);
  logger.info(`Queuing tasks for worker to generate thumbnail:${logText}`);

  const pool = workerpool.pool(FileForWorker.absoluteFilePath, {
    maxWorkers: numberOfProcessesToUse,
    workerType: 'process',
  });

  const workerPromises = argArray.map(arg => {
    return pool
      .proxy()
      .then(worker => worker.generateThumbnailFile(arg))
      .then(result => {
        logger.info('Observed completion of worker for thumbnail generation. ' +
          `From "${arg.srcFilePath}", a thumbnail file "${arg.outputFilePath}" should have been generated.`);
        createFileForLastModified(arg.srcFilePath, arg.outputFileDir, logger);
      });
  });

  await Promise.allSettled(workerPromises);
  await pool.terminate();
}
