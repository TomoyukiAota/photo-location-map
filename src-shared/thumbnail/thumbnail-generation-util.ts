import * as fs from 'fs';
import * as pathModule from 'path';
import { fileExists } from '../file-util/file-util';
import { Logger } from '../log/logger';
import { getThumbnailFilePath } from './get-thumbnail-file-path';

const lastModifiedKey = 'LastModified';

export function getThumbnailLogFilePath(srcFilePath: string): string {
  const srcFileName = pathModule.basename(srcFilePath);
  const { thumbnailFileDir } = getThumbnailFilePath(srcFilePath);
  const logFilePath = pathModule.join(thumbnailFileDir, `${srcFileName}.log.json`);
  return logFilePath;
}

export async function createFileForLastModified(srcFilePath: string, thumbnailFileDir: string) {
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

export async function isThumbnailCacheAvailable(srcFilePath: string): Promise<boolean> {
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
