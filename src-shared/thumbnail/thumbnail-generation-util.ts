import * as fs from 'fs';
import * as os from 'os';
import * as pathModule from 'path';
import { Logger } from '../log/logger';

const lastModifiedKey = 'LastModified';

export function getThumbnailFilePath(srcFilePath: string) {
  const thumbnailFileName = `${pathModule.basename(srcFilePath)}.plm`;
  const intermediateDir = pathModule.parse(
    // Convert "C:\\abc\\def.jpg" to "C\\abc\\def.jpg"
    srcFilePath.replace(':', '')
    // Convert "C\\abc\\def.jpg" to "C\\abc\\def"
  ).dir;
  const thumbnailFileDir = pathModule.join(os.homedir(), '.PlmCache', intermediateDir);
  const thumbnailFilePath = pathModule.join(thumbnailFileDir, `${thumbnailFileName}.jpg`);
  return { thumbnailFileDir, thumbnailFilePath };
}

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

export function isThumbnailCacheAvailable(srcFilePath: string): boolean {
  if (!srcFilePath)
    return false;

  const srcFileName = pathModule.basename(srcFilePath);

  const { thumbnailFilePath } = getThumbnailFilePath(srcFilePath);
  const thumbnailFileExists = fs.existsSync(thumbnailFilePath);
  if (!thumbnailFileExists)
    return false;

  const logFilePath = getThumbnailLogFilePath(srcFilePath);
  const logFileExists = fs.existsSync(logFilePath);
  if (!logFileExists)
    return false;

  let fileContentStr;
  try {
    fileContentStr = fs.readFileSync(logFilePath, 'utf8');
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

  Logger.info(`Thumbnail cache is available for ${srcFileName}.\n`
    + `Original file path: "${srcFilePath}"\n`
    + `Thumbnail cache file path: "${thumbnailFilePath}"`);
  return true;
}
