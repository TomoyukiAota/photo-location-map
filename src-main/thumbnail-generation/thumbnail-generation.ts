import { DirectoryTree } from 'directory-tree';
import { ipcMain } from 'electron';
import * as fs from 'fs';
import * as os from 'os';
import * as pathModule from 'path';
import * as physicalCpuCount from 'physical-cpu-count';
import { Pool, spawn, Worker } from 'threads';

import { asyncFilter } from '../../src-shared/async-util/async-util';
import { convertToFlattenedDirTree } from '../../src-shared/dir-tree/dir-tree-util';
import { FilenameExtension } from '../../src-shared/filename-extension/filename-extension';
import { fileExists } from '../../src-shared/file-util/file-util';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { Logger } from '../../src-shared/log/logger';
import { getThumbnailFilePath } from '../../src-shared/thumbnail/get-thumbnail-file-path';
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

const lastModifiedKey = 'LastModified';

function getThumbnailLogFilePath(srcFilePath: string): string {
  const srcFileName = pathModule.basename(srcFilePath);
  const { thumbnailFileDir } = getThumbnailFilePath(srcFilePath);
  const logFilePath = pathModule.join(thumbnailFileDir, `${srcFileName}.log.json`);
  return logFilePath;
}

async function createFileForLastModified(srcFilePath: string, thumbnailFileDir: string) {
  const srcFileName = pathModule.basename(srcFilePath);
  const lastModified = fs.statSync(srcFilePath).mtime.toISOString();
  const fileContentObj = {};
  fileContentObj[lastModifiedKey] = lastModified;
  const fileContentStr = JSON.stringify(fileContentObj, null, 2);
  const logFilePath = pathModule.join(thumbnailFileDir, `${srcFileName}.log.json`);

  try {
    await fs.promises.writeFile(logFilePath, fileContentStr);
  } catch (error) {
    Logger.error(`[main thread] Failed to write file for last modified "${lastModified}" for "${srcFileName}" in "${logFilePath}". error: ${error}`, error);
    return;
  }

  Logger.info(`[main thread] Wrote a file for last modified "${lastModified}" for "${srcFileName}" in ${logFilePath}`);
}

async function isThumbnailCacheAvailable(srcFilePath: string): Promise<boolean> {
  if (!srcFilePath)
    return false;

  const srcFileName = pathModule.basename(srcFilePath);

  const { thumbnailFilePath } = getThumbnailFilePath(srcFilePath);
  const thumbnailFileExists = await fileExists(thumbnailFilePath);
  if (!thumbnailFileExists)
    return false;

  const logFilePath = getThumbnailLogFilePath(srcFilePath);
  const logFileExists = await fileExists(logFilePath);
  if (!logFileExists)
    return false;

  let fileContentStr;
  try {
    fileContentStr = await fs.promises.readFile(logFilePath, 'utf8');
  } catch (error) {
    Logger.error(`Failed to read log file for ${srcFileName}. Log file location is "${logFilePath}". error: ${error}`, error);
    return false;
  }

  const fileContentObj = JSON.parse(fileContentStr);
  const lastModifiedFromLogFile = fileContentObj[lastModifiedKey];
  if (!lastModifiedFromLogFile)
    return false;

  const lastModifiedFromSrcFile = fs.statSync(srcFilePath).mtime.toISOString();
  const lastModifiedMatch = lastModifiedFromLogFile === lastModifiedFromSrcFile;
  if (!lastModifiedMatch)
    return false;

  Logger.info(`Thumbnail cache is available for ${srcFileName}. Thumbnail cache file path is "${thumbnailFilePath}", which is generated from "${srcFilePath}"`);
  return true;
}

ipcMain.handle(IpcConstants.ThumbnailGenerationInMainProcess.Name, async (event, directoryTreeObject: DirectoryTree) => {
  const flattenedDirTree = convertToFlattenedDirTree(directoryTreeObject);
  const heifFilePaths = flattenedDirTree
    .filter(element => FilenameExtension.isHeif(element.extension))
    .map(element => element.path);
  console.log(`heifFilePaths`);
  console.log(heifFilePaths);

  const feifFilePathsToGenerateThumbnail = await asyncFilter(heifFilePaths, async filePath => !(await isThumbnailCacheAvailable(filePath)));
  console.log(`feifFilePathsToGenerateThumbnail`);
  console.log(feifFilePathsToGenerateThumbnail);

  checkFileForWorkerThreadExists();

  // noinspection JSUnusedLocalSymbols
  const ignoredPromise = generateThumbnails(feifFilePathsToGenerateThumbnail);    // Promise is deliberately ignored.

  return;
});
