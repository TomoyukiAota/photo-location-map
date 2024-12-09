import * as fsExtra from 'fs-extra';
import * as os from 'os';
import * as pathModule from 'path';
import { PrependedLogger } from '../../log/create-prepended-logger';
import { Logger } from '../../log/logger';

export const plmThumbnailCacheDir = pathModule.join(os.homedir(), '.PlmCache');

function getThumbnailIntermediateDirOnWindows(originalFilePath: string) {
  let intermediateDir: string;

  if (originalFilePath.includes(':')) {                              // in a drive (e.g. C drive, like C:\folder\file.heic)
    const originalFilePathWithoutColon = originalFilePath.replace(':', '');               // Convert to C\folder\file.heic
    intermediateDir = `D_${pathModule.dirname(originalFilePathWithoutColon)}`;            // Convert to D_C\folder
  } else {                                                                      // in a network (e.g. \\Hostname\folder\file.heic)
    const originalFilePathWithoutLeadingSlashes = originalFilePath.substring(2);          // Convert to Hostname\folder\file.heic
    intermediateDir = `H_${pathModule.dirname(originalFilePathWithoutLeadingSlashes)}`;   // Convert to H_Hostname\folder
  }

  return intermediateDir;
}

export function getThumbnailFilePath(originalFilePath: string) {
  let intermediateDir: string;

  if (os.platform() === 'darwin' || os.platform() === 'linux') {
    intermediateDir = pathModule.dirname(originalFilePath);
  } else {    // on Windows
    intermediateDir = getThumbnailIntermediateDirOnWindows(originalFilePath);
  }

  const thumbnailFileDir = pathModule.join(plmThumbnailCacheDir, intermediateDir);
  const thumbnailFileName = `${pathModule.basename(originalFilePath)}.plm`;
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
  //                   | Files in a Drive                                                              | Files in a Network
  // thumbnailFilePath | "C:\Users\Tomoyuki\.PlmCache\D_C\Users\Tomoyuki\Desktop\IMG_100.HEIC.plm.jpg" | "C:\Users\Tomoyuki\.PlmCache\H_Hostname\Folder\IMG_100.HEIC.plm.jpg"
  // After step 1      | "\D_C\Users\Tomoyuki\Desktop\IMG_100.HEIC.plm.jpg"                            | "\H_Hostname\Folder\IMG_100.HEIC.plm.jpg"
  // After step 2      | "\D_C\Users\Tomoyuki\Desktop\IMG_100.HEIC"                                    | "\H_Hostname\Folder\IMG_100.HEIC"
  // ------------------------------------------------------
  // On macOS, assuming that plmThumbnailCacheDir is "/Users/Tomoyuki/.PlmCache",
  //                   | Files in Macintosh HD                                                       | Files in Volumes
  // thumbnailFilePath | "/Users/Tomoyuki/.PlmCache/Users/Tomoyuki/Desktop/IMG_100.HEIC.plm.jpg"     | "/Users/Tomoyuki/.PlmCache/Volumes/VolumeName/Folder/IMG_100.HEIC.plm.jpg"
  // After step 1      | "/Users/Tomoyuki/Desktop/IMG_100.HEIC.plm.jpg"                              | "/Volumes/VolumeName/Folder/IMG_100.HEIC.plm.jpg"
  // After step 2      | "/Users/Tomoyuki/Desktop/IMG_100.HEIC"                                      | "/Volumes/VolumeName/Folder/IMG_100.HEIC"
  const pathAfterStep2 = thumbnailFilePath
    .replace(`${plmThumbnailCacheDir}`, '')    // See step 1 above
    .replace(/(.+)\.plm\.jpg$/, '$1');         // See step 2 above

  let originalFilePath = pathAfterStep2;
  if (os.platform() === 'win32') {
    const driveLetterOrHostname = pathAfterStep2.split(pathModule.sep)[1];
    const isDriveLetter = driveLetterOrHostname.startsWith('D_');

    if (isDriveLetter) {
      const driveLetter = driveLetterOrHostname.substring(2);   // Convert "D_C" to "C"
      if (driveLetter.length !== 1) {
        Logger.error(`A drive letter must be a single character, but "${driveLetter}" is observed. Something went wrong.`);
      }
      const pathAfterDriverLetter = pathAfterStep2.replace(`\\D_${driveLetter}`, '');
      originalFilePath = `${driveLetter}:${pathAfterDriverLetter}`;
    } else {
      originalFilePath = pathAfterStep2.replace(`\\H_`, `\\\\`);    // Convert "\H_Hostname\Folder\File.heic" to "\\Hostname\Folder\File.heic"
    }
  }

  return originalFilePath;
}

const lastModifiedKey = 'LastModified';
const isThumbnailFileCreatedKey = 'IsThumbnailFileCreated';

export async function createThumbnailGenerationLogFile(srcFilePath: string, thumbnailFileDir: string, isThumbnailFileCreated: boolean, logger: PrependedLogger) {
  const srcFileName = pathModule.basename(srcFilePath);
  const lastModified = fsExtra.statSync(srcFilePath).mtime.toISOString();
  const fileContentObj = {};
  fileContentObj[lastModifiedKey] = lastModified;
  fileContentObj[isThumbnailFileCreatedKey] = isThumbnailFileCreated;
  const fileContentStr = JSON.stringify(fileContentObj, null, 2);
  const logFilePath = pathModule.join(thumbnailFileDir, `${srcFileName}.log.json`);

  try {
    await fsExtra.ensureFile(logFilePath);
    await fsExtra.promises.writeFile(logFilePath, fileContentStr);
  } catch (error) {
    logger.error(`Failed to write the file in "${logFilePath}" which is the thumbnail generation result for "${srcFilePath}". error: ${error}`, error);
    return;
  }

  logger.info(`Wrote the file in "${logFilePath}" which is the thumbnail generation result for "${srcFilePath}".`);
}

export function isAttemptToGenerateThumbnailFinished(srcFilePath: string): boolean {
  const lastModifiedMatch = lastModifiedMatchBetweenSrcFileAndThumbnailGenerationLogFile(srcFilePath);
  return lastModifiedMatch;
}

export function isThumbnailCacheAvailable(srcFilePath: string): boolean {
  if (!srcFilePath)
    return false;

  const { thumbnailFilePath } = getThumbnailFilePath(srcFilePath);
  const thumbnailFileExists = fsExtra.existsSync(thumbnailFilePath);
  if (!thumbnailFileExists)
    return false;

  const lastModifiedMatch = lastModifiedMatchBetweenSrcFileAndThumbnailGenerationLogFile(srcFilePath);
  return lastModifiedMatch;
}

export function lastModifiedMatchBetweenSrcFileAndThumbnailGenerationLogFile(srcFilePath: string): boolean {
  if (!srcFilePath)
    return false;

  const logFilePath = getThumbnailLogFilePath(srcFilePath);
  const logFileExists = fsExtra.existsSync(logFilePath);
  if (!logFileExists)
    return false;

  let fileContentStr;
  try {
    fileContentStr = fsExtra.readFileSync(logFilePath, 'utf8');
  } catch (error) {
    Logger.error(`Failed to read the log file "${logFilePath}" which is the thumbnail generation result for "${srcFilePath}". error: ${error}`, error);
    return false;
  }

  let fileContentObj;
  try {
    fileContentObj = JSON.parse(fileContentStr);
  } catch (error) {
    Logger.error(`Failed to parse the content of the log file "${logFilePath}" as JSON format. The log file is for thumbnail generation result of "${srcFilePath}". error: ${error}`, error);
    return false;
  }

  const lastModifiedFromLogFile = fileContentObj[lastModifiedKey];
  if (!lastModifiedFromLogFile)
    return false;

  const lastModifiedFromSrcFile = fsExtra.statSync(srcFilePath).mtime.toISOString();
  const lastModifiedMatch = lastModifiedFromLogFile === lastModifiedFromSrcFile;
  return lastModifiedMatch;
}
