import { utilityProcess } from 'electron';
import * as fs from 'fs';
import * as os from 'os';
import * as pathModule from 'path';
import physicalCpuCount from 'physical-cpu-count';
import { stringArrayToLogText } from '../../src-shared/log/multiline-log-text.js';
import { perfMark } from '../../src-shared/perf/perf-mark.js';
import { removeInvalidThumbnailCacheOncePerLaunch } from '../../src-shared/thumbnail/cache/remove-invalid-thumbnail-cache.js';
import { createThumbnailGenerationLogFile, getThumbnailFilePath } from '../../src-shared/thumbnail/cache/thumbnail-cache-util.js';
import { thumbnailGenerationLogger as logger } from '../../src-shared/thumbnail/generation/thumbnail-generation-logger.js';
import { ThumbnailFileGenerationArg, ThumbnailFileGenerationResult } from './generate-thumbnail-file-arg-and-result.js';
import { ThumbnailFailures } from './thumbnail-failures.js';
import { logged } from '../../src-shared/log/logged-line.js';

/**
 * Has the thumbnails of `heifFilePathsToGenerateThumbnail` made at `longerSide`, after those that wait to be made: all
 * those of a folder that the page has the main process make, or one that the page could not make itself
 * (src/app/heif-thumbnail/). A file that waits or is being made at that size is not added again.
 */
export function handleThumbnailGenerationIpcRequest(allHeifFilePaths: string[], heifFilePathsToGenerateThumbnail: string[],
                                                    longerSide: number): void {
  if (!allHeifFilePaths || !heifFilePathsToGenerateThumbnail) {
    logger.error(`handleThumbnailGenerationIpcRequest should be called with string arrays.`);
    logger.errorNotRecorded(`allHeifFilePaths: ${allHeifFilePaths}, heifFilePathsToGenerateThumbnail: ${heifFilePathsToGenerateThumbnail}`,
      allHeifFilePaths, heifFilePathsToGenerateThumbnail);
    return;
  }

  logAllHeifFiles(allHeifFilePaths);
  logHeifFilesToGenerateThumbnail(heifFilePathsToGenerateThumbnail);
  for (const filePath of heifFilePathsToGenerateThumbnail) {
    const key = waitingOrBeingMadeKey(filePath, longerSide);
    if (waitingOrBeingMade.has(key))
      continue;
    waitingOrBeingMade.add(key);
    waiting.push(createThumbnailFileGenerationArg(filePath, longerSide));
  }

  if (!isGenerating) {
    // noinspection JSUnusedLocalSymbols
    const ignoredPromise = generateWaitingThumbnails();    // Promise is deliberately ignored.
  }
}

/**
 * Drops the thumbnails that wait to be made, as when the user chose the fast thumbnails while the main process made
 * the thumbnails of a folder: those being made are finished.
 */
export function cancelThumbnailGeneration(): void {
  logger.info(`Dropped ${waiting.length} thumbnails that waited to be made.`);
  for (const arg of waiting)
    waitingOrBeingMade.delete(waitingOrBeingMadeKey(arg.srcFilePath, arg.longerSide));
  waiting.length = 0;
}

/** The thumbnails that wait to be made, in the order that they were asked for. */
const waiting: ThumbnailFileGenerationArg[] = [];
/**
 * The thumbnails that wait or are being made, by their file and size (waitingOrBeingMadeKey). TL;DR: By the size too,
 * so that a thumbnail asked for at a new size, while the previous size's is being made, is made after it rather than
 * left out: the previous one's log would not say the new size, and the page would wait for ever.
 */
const waitingOrBeingMade = new Set<string>();

function waitingOrBeingMadeKey(filePath: string, longerSide: number): string {
  return `${longerSide}:${filePath}`;
}
let isGenerating = false;

class FileForWorker {
  private static _fileName = 'generate-thumbnail-file-worker.js';
  // In a package, the script is in app.asar. Each worker is a utility process of Electron, which loads the script and
  // its modules from the archive as the main process does: nothing is left out of the archive for it
  // (docs/tasks/20261114_enable-asar/).
  private static _absoluteFilePath = pathModule.join(import.meta.dirname, this._fileName);
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

function createThumbnailFileGenerationArg(filePath: string, longerSide: number) {
  const arg = new ThumbnailFileGenerationArg();
  arg.srcFilePath = filePath;
  const {thumbnailFileDir, thumbnailFilePath} = getThumbnailFilePath(arg.srcFilePath);
  arg.outputFileDir = thumbnailFileDir;
  arg.outputFilePath = thumbnailFilePath;
  arg.longerSide = longerSide;
  return arg;
}

const logicalCpuCount = os.cpus().length;
const numberOfProcessesToUse = physicalCpuCount >= 2 ? physicalCpuCount - 1 : 1;

/**
 * Makes the thumbnails that wait, in worker processes, a new one for each file, until none waits, and records the
 * failures.
 */
async function generateWaitingThumbnails() {
  isGenerating = true;
  try {
    await generateUntilNoneWaits();
  } finally {
    isGenerating = false;
  }
}

async function generateUntilNoneWaits() {
  checkFileForWorkerExists();
  void removeInvalidThumbnailCacheOncePerLaunch();
  logger.info(`Number of CPU cores, Physical: ${physicalCpuCount}, Logical: ${logicalCpuCount}`);
  logger.info(`Number of processes for thumbnail generation: ${numberOfProcessesToUse}`);

  // The worker process needs to be restarted per thumbnail.
  // If the worker process continues to be used for multiple thumbnails,
  // the memory consumption of the process increases, and the app will eventually crash.
  // In the code below, thumbnail generation is split into chunks, and worker processes are restarted by each chunk.
  // By numberOfFilesInChunk === numberOfProcessesToUse, each worker process will be restarted per thumbnail.
  const numberOfFilesInChunk = numberOfProcessesToUse;

  perfMark('thumbnails:main-started', { files: waiting.length });
  const failures = new ThumbnailFailures();
  let files = 0;
  for (let chunkNumber = 1; waiting.length > 0; chunkNumber++) {
    const argChunk = waiting.splice(0, numberOfFilesInChunk);
    files += argChunk.length;
    logger.info(`Started chunk #${chunkNumber}, of ${argChunk.length} files; ${waiting.length} files wait after it.`);
    await runWorkerForThumbnailGeneration(argChunk, failures);
    for (const arg of argChunk)
      waitingOrBeingMade.delete(waitingOrBeingMadeKey(arg.srcFilePath, arg.longerSide));
    logger.info(`Finished chunk #${chunkNumber}.`);
  }
  failures.record();
  perfMark('thumbnails:main-finished', { files });
}

async function runWorkerForThumbnailGeneration(argArray: ThumbnailFileGenerationArg[], failures: ThumbnailFailures) {
  const logLines = argArray.map(arg => `From "${arg.srcFilePath}", a thumbnail file "${arg.outputFilePath}" will be generated.`);
  const logText = stringArrayToLogText(logLines);
  logger.info(`Queuing tasks for worker to generate thumbnail:${logText}`);

  await Promise.allSettled(argArray.map(arg => generateThumbnailAndLog(arg, failures)));
}

/**
 * Makes the thumbnail of `arg` in a process of its own, and writes the log of the attempt, which says whether it was
 * made, at its size. Never rejects: a failure is in the log, and in `failures`.
 * TL;DR: The thumbnail and the log that were there go first, so that the cache never says that it has the new
 * thumbnail, of another size or of a newer version of the photo, while it has the previous one.
 * Details: The worker writes the thumbnail last, once it has made it, in the same file as the previous one. The previous
 * file stayed when the worker failed, and the log said that the thumbnail was made at the new size, as only whether a
 * file was there was looked at; and the previous log stayed beside the new file when the new log could not be written.
 */
export async function generateThumbnailAndLog(arg: ThumbnailFileGenerationArg, failures: ThumbnailFailures,
                                              workerFile = FileForWorker.absoluteFilePath): Promise<void> {
  const logFilePath = pathModule.join(arg.outputFileDir, `${pathModule.basename(arg.srcFilePath)}.log.json`);
  await Promise.all([logFilePath, arg.outputFilePath].map(filePath => fs.promises.rm(filePath, { force: true }).catch(error =>
    logger.warn(logged`Failed to remove "${filePath}" before its thumbnail is made again. error: ${error}`, error))));

  let result: ThumbnailFileGenerationResult;
  try {
    result = await generateThumbnailInProcess(arg, workerFile);
  } catch (error) {
    // The worker process failed and sent nothing back, such as when it crashed. The generation log file is still
    // written: the window counts a thumbnail as done by it, and without it would wait for this one for ever.
    logger.errorNotRecorded(`The worker for thumbnail generation failed for "${arg.srcFilePath}". error: ${error}`, error);  // Recorded as "worker-failed", below.
    failures.add('worker-failed', error);
    try {
      await createThumbnailGenerationLogFile(arg.srcFilePath, arg.outputFileDir, false, logger, undefined, arg.longerSide);
    } catch (logFileError) {
      logger.error(logged`Failed to write the thumbnail generation log file for "${arg.srcFilePath}".`, logFileError);
    }
    return;
  }

  const { status, error } = result ?? {};
  logger.info(`Observed completion of worker for thumbnail generation. Status: ${status}`);
  logger.info(`Finished attempting to create a thumbnail file "${arg.outputFilePath}" from "${arg.srcFilePath}".`);
  const isThumbnailFileCreated = status === 'success' && await fs.promises.access(arg.outputFilePath).then(() => true, () => false);
  logger.info(`Was the thumbnail file created? -> ${isThumbnailFileCreated}`);
  if (!isThumbnailFileCreated) {
    // Recorded as a reason of failed thumbnails (thumbnail-failures.ts), below.
    logger.warnNotRecorded(`Failed to create a thumbnail file: the worker answered ${status}, or the file is not there.` +
      ` Attempted to create a thumbnail file "${arg.outputFilePath}" from "${arg.srcFilePath}". Error: ${error}`);
    failures.add(status ?? 'unknown', error);
  }
  try {
    await createThumbnailGenerationLogFile(arg.srcFilePath, arg.outputFileDir, isThumbnailFileCreated, logger, undefined, arg.longerSide);
  } catch (logFileError) {
    logger.error(logged`Failed to write the thumbnail generation log file for "${arg.srcFilePath}".`, logFileError);
  }
}

/**
 * TL;DR: Makes the thumbnail of `arg` in a process of its own, and resolves with the result that the process sent once
 * the process has ended, or rejects when it ended without sending one, as when it crashed.
 * Details: Each thumbnail gets a new process, as the memory of a process grows with each that it makes (see
 * generateThumbnails). The process is Electron's utility process rather than child_process.fork, which Electron refuses
 * with the fuse runAsNode off (docs/contributing/electron-fuses.md). It runs `workerFile`, which the tests replace.
 */
export function generateThumbnailInProcess(arg: ThumbnailFileGenerationArg,
                                           workerFile = FileForWorker.absoluteFilePath): Promise<ThumbnailFileGenerationResult> {
  return new Promise((resolve, reject) => {
    const worker = utilityProcess.fork(workerFile, [], { serviceName: 'Photo Location Map Thumbnail Generation' });
    let result: ThumbnailFileGenerationResult | undefined;
    let fatalError = '';
    // A message posted before the worker listens is kept for it.
    worker.once('spawn', () => worker.postMessage({ ...arg }));
    worker.once('message', (sent: ThumbnailFileGenerationResult) => {
      result = sent;
      worker.kill();
    });
    // A fatal error of V8 in the worker, which Electron emits before 'exit': without a listener, the worker's emitter
    // would throw it in the main process.
    worker.on('error', (type, location) => { fatalError = ` after ${type} at ${location}`; });
    // Settled once the process has ended, not when its result arrives: the next chunk's processes start then, and this
    // one, still ending, would hold its memory beside theirs.
    worker.once('exit', code => {
      if (result)
        resolve(result);
      else
        reject(new Error(`The process for thumbnail generation exited with code ${code}${fatalError} without sending a result.`));
    });
  });
}
