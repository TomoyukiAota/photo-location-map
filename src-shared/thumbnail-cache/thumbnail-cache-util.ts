import * as fs from 'fs';
import * as os from 'os';
import * as pathModule from 'path';
import { Logger } from '../log/logger';

export const plmThumbnailCacheDir = pathModule.join(os.homedir(), '.PlmCache');

export function getThumbnailFilePath(originalFilePath: string) {
  const thumbnailFileName = `${pathModule.basename(originalFilePath)}.plm`;
  const intermediateDir = pathModule.parse(
    // Convert "C:\\abc\\def.jpg" to "C\\abc\\def.jpg"
    originalFilePath.replace(':', '')
    // Convert "C\\abc\\def.jpg" to "C\\abc\\def"
  ).dir;
  const thumbnailFileDir = pathModule.join(plmThumbnailCacheDir, intermediateDir);
  const thumbnailFilePath = pathModule.join(thumbnailFileDir, `${thumbnailFileName}.jpg`);
  return { thumbnailFileDir, thumbnailFilePath };
}

export function getThumbnailLogFilePath(originalFilePath: string): string {
  const originalFileName = pathModule.basename(originalFilePath);
  const { thumbnailFileDir } = getThumbnailFilePath(originalFilePath);
  const logFilePath = pathModule.join(thumbnailFileDir, `${originalFileName}.log.json`);
  return logFilePath;
}

export function getOriginalFilePath(thumbnailFilePath: string): string {
  // Converting thumbnailFilePath to pathAfterStep2
  // -----------------------------------------------------
  // On Windows, assuming that plmThumbnailCacheDir is "C:\Users\Tomoyuki\.PlmCache",
  // thumbnailFilePath | "C:\Users\Tomoyuki\.PlmCache\C\Users\Tomoyuki\Desktop\IMG_100.HEIC.plm.jpg"
  // After step 1      | "\C\Users\Tomoyuki\Desktop\IMG_100.HEIC.plm.jpg"
  // After step 2      | "\C\Users\Tomoyuki\Desktop\IMG_100.HEIC"
  // ------------------------------------------------------
  // On macOS, assuming that plmThumbnailCacheDir is "/Users/Tomoyuki/.PlmCache",
  // thumbnailFilePath | "/Users/Tomoyuki/.PlmCache/Users/Tomoyuki/Desktop/IMG_100.HEIC.plm.jpg"
  // After step 1      | "/Users/Tomoyuki/Desktop/IMG_100.HEIC.plm.jpg"
  // After step 2      | "/Users/Tomoyuki/Desktop/IMG_100.HEIC"
  const pathAfterStep2 = thumbnailFilePath
    .replace(`${plmThumbnailCacheDir}`, '')    // See step 1 above
    .replace(/(.+)\.plm\.jpg$/, '$1');         // See step 2 above

  let originalFilePath = pathAfterStep2;
  if (os.platform() === 'win32') {
    const driveLetter = pathAfterStep2.split(pathModule.sep)[1];
    const pathAfterDriverLetter = pathAfterStep2.replace(`${pathModule.sep}${driveLetter}`, '');
    originalFilePath = `${driveLetter}:${pathAfterDriverLetter}`;
  }

  return originalFilePath;
}

const lastModifiedKey = 'LastModified';

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
  return lastModifiedMatch;
}